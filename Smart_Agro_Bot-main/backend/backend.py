from __future__ import annotations

import base64
import io
import logging
import os
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from PIL import Image

from rag import (
    format_context_from_docs,
    friendly_source_name,
    retrieve_documents_with_scores,
    source_stems_from_docs,
)

load_dotenv()
load_dotenv(Path(__file__).resolve().parents[2] / ".env")
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT — optimized, ~40% shorter, same behaviour
# ═══════════════════════════════════════════════════════════════════════════
SYSTEM_PROMPT = """You are SmartAgro Bot — a crop-disease assistant for farmers in Bangladesh.

═══ LANGUAGE ═══
Reply in **Bengali** by default (simple sentences, আপনি-সম্বোধন).
Reply in **English** ONLY when the user asks (e.g. "in English", "ইংরেজিতে বলুন").
If asked for both: Bengali first, then "**English:**" section.

═══ IMAGE ═══
With an image: one sentence describing what is clearly visible.
If unclear/ambiguous → ask for a clearer, closer photo. Never guess a disease.
If multiple diseases are plausible → list each separately with its specific sign.

═══ GROUNDING ═══
A "Verified reference" block may be provided.
• If present: base disease names, causes, management, and medicine doses ONLY on it.
• If absent: say "সাধারণ পরামর্শ (যাচাইকৃত নয়)" / "general advice (unverified)".
NEVER invent medicine names, brand names, dosages, or registration numbers.
If the reference lacks a dose → tell the user to ask the local agriculture officer.

═══ RESPONSE FORMAT (Bengali) ═══
🔍 সম্ভাব্য সমস্যা: <name>
🧐 লক্ষণ:
- <short>
🛠️ ব্যবস্থাপনা:
- <biological step first, then chemical if reference allows>
💊 ওষুধ (only if in reference):
- <name + exact dose>
📌 যাচাই: <one line — confirm with local agriculture officer>

Skip any section you have nothing valid for. Reply < 180 words unless asked for more.

═══ STYLE ═══
Short sentences. Bullets "- " only. No markdown tables/hashes. No filler phrases.

═══ DISCLAIMER ═══
End every reply with ONE line in the reply's language:
• Bengali: "⚠️ এটি AI-এর পরামর্শ — ওষুধ ব্যবহারের আগে স্থানীয় কৃষি কর্মকর্তার সাথে যাচাই করুন।"
• English: "⚠️ AI advice — verify with your local agriculture officer before using any pesticide."
"""

IMAGE_IDENTIFY_PROMPT = (
    "ছবিতে ফসলের পাতা/ফল/কাণ্ডে দৃশ্যমান রোগ বা পোকার লক্ষণ ২-৫টি বাংলা "
    "শব্দ/বাক্যাংশে বলো। সম্ভব হলে ফসলের নাম বলো। কোনো প্রতিকার লিখবে না।"
)

FALLBACK_REPLY = (
    "দুঃখিত, এই মুহূর্তে সার্ভারের সাথে সংযোগ করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।\n"
    "⚠️ এটি AI-এর পরামর্শ — ওষুধ ব্যবহারের আগে স্থানীয় কৃষি কর্মকর্তার সাথে যাচাই করুন।"
)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
MAX_HISTORY_MESSAGES = 10
MAX_RETRIES = 3
RETRY_BASE_DELAY_SECONDS = 2.0
ENABLE_IMAGE_HINT = os.getenv("SMARTAGRO_IMAGE_HINT", "0") == "1"

VALID_CONFIDENCE_LEVELS = ("high", "medium", "low", "none")

_llm_instance: Optional[ChatGoogleGenerativeAI] = None
_llm_lock = threading.Lock()


# ═══════════════════════════════════════════════════════════════════════════
# LLM
# ═══════════════════════════════════════════════════════════════════════════

def get_llm() -> ChatGoogleGenerativeAI:
    global _llm_instance
    if _llm_instance is None:
        with _llm_lock:
            if _llm_instance is None:
                if not os.getenv("GOOGLE_API_KEY"):
                    raise RuntimeError("GOOGLE_API_KEY is not set.")
                _llm_instance = ChatGoogleGenerativeAI(model=GEMINI_MODEL)
    return _llm_instance


def _invoke_with_retry(llm, messages):
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            return llm.invoke(messages)
        except Exception as exc:
            last_error = exc
            logger.warning("LLM attempt %d failed: %s", attempt + 1, exc)
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_BASE_DELAY_SECONDS * (2 ** attempt))
    raise last_error


# ═══════════════════════════════════════════════════════════════════════════
# MESSAGE BUILDERS
# ═══════════════════════════════════════════════════════════════════════════

def build_human_message(user_text: str, image: Optional[Image.Image]) -> HumanMessage:
    content: list[dict[str, Any]] = [
        {"type": "text", "text": user_text or "(image attached)"}
    ]
    if image is not None:
        buffer = io.BytesIO()
        image.convert("RGB").save(buffer, format="JPEG", quality=85, optimize=True)
        b64_image = base64.b64encode(buffer.getvalue()).decode("ascii")
        content.append(
            {
                "type": "image_url",
                "image_url": f"data:image/jpeg;base64,{b64_image}",
            }
        )
    return HumanMessage(content=content)


def extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
            elif isinstance(item, str):
                parts.append(item)
        return "".join(parts)
    return str(content)


# ═══════════════════════════════════════════════════════════════════════════
# IMAGE HINT (optional)
# ═══════════════════════════════════════════════════════════════════════════

def _quick_identify_image(image: Image.Image) -> Optional[str]:
    if not ENABLE_IMAGE_HINT:
        return None
    try:
        response = _invoke_with_retry(
            get_llm(),
            [build_human_message(IMAGE_IDENTIFY_PROMPT, image)],
        )
        hint = extract_text(response.content).strip()
        return hint[:500] if hint else None
    except Exception:
        logger.exception("Image hint generation failed")
        return None


# ═══════════════════════════════════════════════════════════════════════════
# RAG DEBUG LOG
# ═══════════════════════════════════════════════════════════════════════════

def _is_debug_rag_enabled() -> bool:
    return os.getenv("SMARTAGRO_DEBUG_RAG", "0") == "1"


def _write_rag_debug_log(user_text, retrieval_query, scored_docs, answer):
    if not _is_debug_rag_enabled():
        return
    try:
        log_path = Path(__file__).resolve().parent / "debug_retrieved_context.txt"
        with open(log_path, "w", encoding="utf-8") as f:
            f.write(f"Time: {datetime.now():%Y-%m-%d %H:%M:%S}\n")
            f.write(f"Question: {user_text}\n")
            f.write(f"retrieval_query: {retrieval_query}\n")
            for i, item in enumerate(scored_docs, 1):
                try:
                    doc, score = item
                    source = Path(doc.metadata.get("source", "")).stem
                    f.write(f"\n[{i}] {source} | score={score:.4f}\n")
                    f.write(doc.page_content.strip() + "\n")
                except Exception:
                    f.write(f"\n[{i}] (unreadable chunk)\n")
            f.write("\nBot answer:\n" + answer)
    except Exception:
        logger.exception("RAG debug log failed")


# ═══════════════════════════════════════════════════════════════════════════
# CONFIDENCE CLASSIFICATION
# ═══════════════════════════════════════════════════════════════════════════

def _safe_best_score(scored_docs) -> Optional[float]:
    """Return the best (lowest) score, or None if unavailable."""
    if not scored_docs:
        return None
    try:
        first = scored_docs[0]
        if isinstance(first, (tuple, list)) and len(first) >= 2:
            return float(first[1])
        return None
    except Exception:
        return None


def _classify_confidence(
    scored_docs,
    image_hint,
    image_quality_issue,
) -> tuple[str, str, str, list[str]]:
    """Return (level, bengali_label, reason, uncertainty_reasons).

    Guaranteed to return a level from VALID_CONFIDENCE_LEVELS.
    """
    reasons: list[str] = []

    if image_quality_issue:
        reasons.append("ছবিটি অস্পষ্ট ছিল")

    if not scored_docs:
        return (
            "none",
            "❓ তথ্য নেই",
            "জ্ঞানভাণ্ডারে এই বিষয়ে নির্দিষ্ট তথ্য পাওয়া যায়নি",
            reasons,
        )

    best_score = _safe_best_score(scored_docs)
    if best_score is None:
        return (
            "none",
            "❓ তথ্য নেই",
            "স্কোর পড়া যায়নি — জ্ঞানভাণ্ডার সমস্যা",
            reasons or ["জ্ঞানভাণ্ডারে ত্রুটি"],
        )

    if image_hint is None and len(scored_docs) < 2:
        reasons.append("ছবি থেকে স্পষ্টভাবে সমস্যা বোঝা যায়নি")

    if best_score < 0.35:
        return (
            "high",
            "✅ নিশ্চিত তথ্য",
            "কৃষি জ্ঞানভাণ্ডার থেকে যাচাইকৃত তথ্য",
            reasons,
        )
    if best_score < 0.55:
        if not reasons:
            reasons.append("মিলটি মাঝারি — প্রশ্ন আরও স্পষ্ট হলে ভালো হয়")
        return (
            "medium",
            "⚠️ সম্ভাব্য তথ্য",
            "জ্ঞানভাণ্ডারে কাছাকাছি তথ্য আছে — ব্যবহারের আগে যাচাই করুন",
            reasons,
        )

    reasons.append("স্থানীয় কৃষি কর্মকর্তার সাথে যাচাই করুন")
    return (
        "low",
        "⚠️ অনুমান",
        "জ্ঞানভাণ্ডারে সরাসরি মিল নেই — এটি সাধারণ পরামর্শ",
        reasons,
    )


# ═══════════════════════════════════════════════════════════════════════════
# FALLBACK META
# ═══════════════════════════════════════════════════════════════════════════

def _fallback_meta(
    label: str,
    reason: str,
    uncertainty: Optional[list[str]] = None,
) -> dict[str, Any]:
    return {
        "verified": False,
        "sources": [],
        "confidence": "none",
        "confidence_label": label,
        "confidence_reason": reason,
        "best_match_score": None,
        "matched_chunks": 0,
        "matched_crops": [],
        "uncertainty_reasons": uncertainty or [reason],
        "image_quality_issue": None,
    }


# ═══════════════════════════════════════════════════════════════════════════
# MAIN REPLY FUNCTION
# ═══════════════════════════════════════════════════════════════════════════

def get_bot_reply(user_text, image, history):
    """Return (reply_text, meta_dict). Never raises."""
    try:
        llm = get_llm()
    except Exception:
        logger.exception("LLM initialization failed")
        return FALLBACK_REPLY, _fallback_meta(
            "❌ সার্ভার সংযোগ নেই",
            "সার্ভারের সাথে সংযোগ করা যায়নি",
            ["সার্ভার সংযোগ নেই"],
        )

    # ---- Retrieval ----
    retrieval_query = (user_text or "").strip()
    image_hint = None
    if image is not None:
        image_hint = _quick_identify_image(image)
        if image_hint:
            retrieval_query = f"{retrieval_query}\n{image_hint}".strip()

    try:
        scored_docs = (
            retrieve_documents_with_scores(retrieval_query)
            if retrieval_query
            else []
        )
    except Exception:
        logger.exception("RAG retrieval failed")
        scored_docs = []

    docs = []
    for item in scored_docs:
        try:
            if isinstance(item, (tuple, list)) and len(item) >= 1:
                docs.append(item[0])
        except Exception:
            continue

    try:
        context = format_context_from_docs(docs)
    except Exception:
        logger.exception("Context formatting failed")
        context = None

    try:
        source_stems = source_stems_from_docs(docs)
        friendly_sources = [friendly_source_name(s) for s in source_stems]
    except Exception:
        logger.exception("Source name processing failed")
        friendly_sources = []

    # ---- Confidence ----
    best_score = _safe_best_score(scored_docs)
    confidence, confidence_label, confidence_reason, uncertainty = (
        _classify_confidence(scored_docs, image_hint, None)
    )

    # Safety: ensure confidence is a valid literal value
    if confidence not in VALID_CONFIDENCE_LEVELS:
        confidence = "none"

    # ---- Build prompt ----
    system_content = SYSTEM_PROMPT
    if context:
        system_content += (
            "\n\n=== Verified reference (knowledge base) ===\n" + context
        )

    messages = [SystemMessage(content=system_content)]
    try:
        messages.extend(history[-MAX_HISTORY_MESSAGES:])
    except Exception:
        logger.warning("History extension failed; ignoring history")
    messages.append(build_human_message(user_text, image))

    try:
        response = _invoke_with_retry(llm, messages)
        reply = extract_text(response.content).strip()
    except Exception:
        logger.exception("LLM request failed")
        return FALLBACK_REPLY, _fallback_meta(
            "❌ উত্তর তৈরি হয়নি",
            "AI মডেল সাড়া দেয়নি",
            ["AI মডেল সাড়া দেয়নি"],
        )

    if not reply:
        reply = FALLBACK_REPLY

    try:
        _write_rag_debug_log(user_text, retrieval_query, scored_docs, reply)
    except Exception:
        logger.exception("Debug log write failed")

    return reply, {
        "verified": bool(context),
        "sources": friendly_sources,
        "confidence": confidence,
        "confidence_label": confidence_label,
        "confidence_reason": confidence_reason,
        "best_match_score": best_score,
        "matched_chunks": len(docs),
        "matched_crops": friendly_sources,
        "uncertainty_reasons": uncertainty,
        "image_quality_issue": None,
    }