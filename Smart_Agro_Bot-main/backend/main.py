from __future__ import annotations

import asyncio
import io
import json
import logging
import os
import threading
import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from PIL import Image, UnidentifiedImageError

from backend import MAX_HISTORY_MESSAGES, get_bot_reply
from image_utils import check_image_quality
from schemas import ChatResponse, HealthResponse, TTSRequest, TranscribeResponse
from voice import check_ffmpeg_available, speech_to_text_bn, text_to_speech_bn

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(8 * 1024 * 1024)))
MAX_AUDIO_BYTES = int(os.getenv("MAX_AUDIO_BYTES", str(10 * 1024 * 1024)))
MAX_TEXT_CHARS = int(os.getenv("MAX_TEXT_CHARS", "2000"))
MAX_TTS_CHARS = int(os.getenv("MAX_TTS_CHARS", "2500"))
MAX_HISTORY_JSON_BYTES = int(os.getenv("MAX_HISTORY_JSON_BYTES", str(20_000)))

RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "20"))
RATE_LIMIT_WINDOW_SECONDS = float(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

VALID_CONFIDENCE_LEVELS = {"high", "medium", "low", "none"}

_rate_limit_hits: dict[str, deque] = defaultdict(deque)
_rate_limit_lock = threading.Lock()


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request) -> None:
    if RATE_LIMIT_MAX_REQUESTS <= 0:
        return
    key = _client_key(request)
    now = time.monotonic()
    with _rate_limit_lock:
        hits = _rate_limit_hits[key]
        while hits and now - hits[0] > RATE_LIMIT_WINDOW_SECONDS:
            hits.popleft()
        if len(hits) >= RATE_LIMIT_MAX_REQUESTS:
            retry_after = max(
                1, int(RATE_LIMIT_WINDOW_SECONDS - (now - hits[0]))
            )
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again in a moment.",
                headers={"Retry-After": str(retry_after)},
            )
        hits.append(now)


FRONTEND_ORIGINS = [
    x.strip()
    for x in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if x.strip()
]

app = FastAPI(title="SmartAgro Bot API", version="2.5.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred. Please try again later."
        },
    )


def _read_limited(upload: UploadFile, max_bytes: int) -> bytes:
    data = upload.file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=413, detail="File size exceeds the allowed limit."
        )
    return data


def _load_image(data: bytes) -> Optional[Image.Image]:
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
        img.load()
        return img
    except (UnidentifiedImageError, OSError, ValueError):
        return None


def _history_from_json(raw: str) -> list[BaseMessage]:
    try:
        turns = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    if not isinstance(turns, list):
        return []
    out: list[BaseMessage] = []
    for turn in turns[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(turn, dict):
            continue
        role = turn.get("role")
        content = turn.get("content", "")
        if role not in {"user", "assistant"} or not isinstance(content, str):
            continue
        content = content.strip()[:MAX_TEXT_CHARS]
        if not content:
            continue
        out.append(
            HumanMessage(content=content)
            if role == "user"
            else AIMessage(content=content)
        )
    return out


def _normalize_meta(meta: dict) -> dict:
    """Ensure meta has every field with a valid value (never raises)."""
    if not isinstance(meta, dict):
        meta = {}

    confidence = meta.get("confidence", "none")
    if confidence not in VALID_CONFIDENCE_LEVELS:
        confidence = "none"

    def _list(v):
        if isinstance(v, list):
            return [str(x) for x in v if x is not None]
        return []

    best_score = meta.get("best_match_score")
    try:
        best_score = float(best_score) if best_score is not None else None
    except (TypeError, ValueError):
        best_score = None

    try:
        matched_chunks = int(meta.get("matched_chunks", 0) or 0)
    except (TypeError, ValueError):
        matched_chunks = 0

    return {
        "verified": bool(meta.get("verified", False)),
        "sources": _list(meta.get("sources")),
        "confidence": confidence,
        "confidence_label": meta.get("confidence_label") or None,
        "confidence_reason": meta.get("confidence_reason") or None,
        "best_match_score": best_score,
        "matched_chunks": matched_chunks,
        "matched_crops": _list(meta.get("matched_crops")),
        "uncertainty_reasons": _list(meta.get("uncertainty_reasons")),
        "image_quality_issue": meta.get("image_quality_issue") or None,
    }


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", ffmpeg_available=check_ffmpeg_available())


@app.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe(
    request: Request,
    audio: UploadFile = File(...),
    hint_language: Optional[str] = Form(None),
) -> TranscribeResponse:
    enforce_rate_limit(request)
    data = await asyncio.to_thread(_read_limited, audio, MAX_AUDIO_BYTES)
    if not data:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    try:
        result = await asyncio.to_thread(
            speech_to_text_bn, data, hint_language
        )
    except RuntimeError as exc:
        msg = str(exc)
        if "too long" in msg.lower():
            raise HTTPException(
                status_code=413,
                detail="Recording is too long. Please keep it under 2 minutes.",
            )
        raise HTTPException(
            status_code=502, detail="Could not transcribe audio."
        )
    except Exception:
        logger.exception("Unexpected STT failure")
        raise HTTPException(
            status_code=502, detail="Could not transcribe audio."
        )

    return TranscribeResponse(
        text=result.text,
        low_confidence=bool(result.low_confidence),
        language=result.language,
        debug=result.debug,
    )


@app.post("/api/tts")
async def tts(request: Request, req: TTSRequest) -> Response:
    enforce_rate_limit(request)
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(text) > MAX_TTS_CHARS:
        raise HTTPException(status_code=413, detail="TTS text is too long.")
    try:
        audio_bytes = await asyncio.to_thread(text_to_speech_bn, text)
    except RuntimeError:
        raise HTTPException(
            status_code=502, detail="Could not generate voice."
        )
    if not audio_bytes:
        raise HTTPException(
            status_code=502, detail="Could not generate voice."
        )
    return Response(content=audio_bytes, media_type="audio/mpeg")


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: Request,
    text: str = Form(""),
    history_json: str = Form("[]"),
    image: Optional[UploadFile] = File(None),
) -> ChatResponse:
    enforce_rate_limit(request)

    if len(history_json) > MAX_HISTORY_JSON_BYTES:
        raise HTTPException(
            status_code=413, detail="Conversation history is too long."
        )

    user_message = (text or "").strip()
    if len(user_message) > MAX_TEXT_CHARS:
        raise HTTPException(
            status_code=413, detail="Question is too long."
        )
    if not user_message and image is None:
        raise HTTPException(
            status_code=400, detail="Please provide a question or an image."
        )

    pil_image: Optional[Image.Image] = None
    if image is not None:
        content_type = (image.content_type or "").lower()
        if content_type not in {"image/jpeg", "image/png"}:
            raise HTTPException(
                status_code=415, detail="Only JPG/PNG images are accepted."
            )
        data = await asyncio.to_thread(_read_limited, image, MAX_IMAGE_BYTES)
        pil_image = _load_image(data)
        if pil_image is None:
            raise HTTPException(
                status_code=400, detail="The image is not a valid JPG/PNG."
            )

    history = _history_from_json(history_json)

    # ---- Image quality gate ----
    if pil_image is not None:
        try:
            issue = check_image_quality(pil_image)
        except Exception:
            logger.exception("Image quality check failed")
            issue = None

        if issue:
            return ChatResponse(
                user_message=user_message or "(image attached)",
                reply=issue,
                verified=False,
                sources=[],
                image_quality_issue=issue,
                confidence="none",
                confidence_label="❌ ছবি অস্পষ্ট",
                confidence_reason="ভালো ছবি দিলে আরও নির্ভুল পরামর্শ পাওয়া যাবে",
                best_match_score=None,
                matched_chunks=0,
                matched_crops=[],
                uncertainty_reasons=["ছবির মান যথেষ্ট ভালো নয়"],
            )

    # ---- Get reply ----
    try:
        reply, raw_meta = await asyncio.to_thread(
            get_bot_reply, user_message, pil_image, history
        )
    except Exception:
        logger.exception("get_bot_reply raised unexpectedly")
        reply = (
            "দুঃখিত, একটি অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন।\n"
            "⚠️ এটি AI-এর পরামর্শ — ওষুধ ব্যবহারের আগে স্থানীয় কৃষি "
            "কর্মকর্তার সাথে যাচাই করুন।"
        )
        raw_meta = {}

    meta = _normalize_meta(raw_meta)

    # ---- Build response (defensive against Pydantic validation) ----
    try:
        return ChatResponse(
            user_message=user_message
            or ("(image attached)" if pil_image else ""),
            reply=reply,
            verified=meta["verified"],
            sources=meta["sources"],
            image_quality_issue=meta["image_quality_issue"],
            confidence=meta["confidence"],
            confidence_label=meta["confidence_label"],
            confidence_reason=meta["confidence_reason"],
            best_match_score=meta["best_match_score"],
            matched_chunks=meta["matched_chunks"],
            matched_crops=meta["matched_crops"],
            uncertainty_reasons=meta["uncertainty_reasons"],
        )
    except Exception:
        logger.exception("ChatResponse construction failed")
        return ChatResponse(
            user_message=user_message or "",
            reply=reply,
            verified=False,
            sources=[],
            confidence="none",
            confidence_label="❌ সার্ভার সমস্যা",
            confidence_reason="উত্তর তৈরি হয়নি",
            uncertainty_reasons=["সার্ভার সমস্যা"],
        )