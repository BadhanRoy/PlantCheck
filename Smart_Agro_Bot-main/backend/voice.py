from __future__ import annotations

import asyncio
import io
import logging
import os
import shutil
import tempfile
import threading
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger("smartagro.voice")
logging.basicConfig(level=logging.INFO)

_whisper_model = None
_whisper_lock = threading.Lock()
_whisper_load_failed = False
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")
TTS_VOICE = os.getenv("EDGE_TTS_VOICE", "bn-BD-NabanitaNeural")
SUPPORTED_LANGUAGES = {"bn", "en", "hi"}
MAX_AUDIO_DURATION_MS = int(os.getenv("MAX_AUDIO_DURATION_MS", str(120_000)))


@dataclass
class TranscriptionResult:
    text: Optional[str]
    low_confidence: bool = False
    language: Optional[str] = None
    debug: Optional[str] = None


def check_ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def _resolve_device_and_compute_type():
    device = os.getenv("WHISPER_DEVICE")
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE")
    if device is None:
        try:
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            device = "cpu"
    if compute_type is None:
        compute_type = "float16" if device == "cuda" else "int8"
    return device, compute_type


def _get_whisper_model():
    global _whisper_model, _whisper_load_failed
    if _whisper_load_failed:
        raise RuntimeError(
            "Speech recognition model failed to load previously. "
            "Restart the server or check WHISPER_MODEL_SIZE."
        )
    if _whisper_model is None:
        with _whisper_lock:
            if _whisper_model is None:
                try:
                    from faster_whisper import WhisperModel
                    device, compute_type = _resolve_device_and_compute_type()
                    logger.info(
                        f"[whisper] Loading model={WHISPER_MODEL_SIZE} "
                        f"device={device} compute={compute_type}"
                    )
                    _whisper_model = WhisperModel(
                        WHISPER_MODEL_SIZE,
                        device=device,
                        compute_type=compute_type,
                    )
                    logger.info("[whisper] Model loaded")
                except Exception as exc:
                    _whisper_load_failed = True
                    logger.exception("[whisper] Model load failed")
                    raise RuntimeError("Speech recognition model failed to load.") from exc
    return _whisper_model


def _preprocess_audio(audio_bytes):
    if os.getenv("WHISPER_SKIP_PREPROCESS", "").lower() == "true":
        return audio_bytes

    try:
        from pydub import AudioSegment
        from pydub.effects import normalize
    except Exception:
        return audio_bytes

    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
    except Exception as e:
        logger.warning(f"[preprocess] decode failed: {e}")
        return audio_bytes

    logger.info(
        f"[preprocess] duration={len(audio)/1000:.1f}s channels={audio.channels}"
    )

    if len(audio) > MAX_AUDIO_DURATION_MS:
        raise RuntimeError("Audio is too long.")

    try:
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio = audio.high_pass_filter(80)
        audio = normalize(audio)
        buffer = io.BytesIO()
        audio.export(buffer, format="wav")
        return buffer.getvalue()
    except Exception as e:
        logger.warning(f"[preprocess] failed: {e}")
        return audio_bytes


def speech_to_text_bn(audio_bytes, hint_language=None):
    tmp_path = None
    try:
        logger.info(f"[transcribe] Received {len(audio_bytes)} bytes")

        if len(audio_bytes) < 500:
            return TranscriptionResult(None, debug="audio_too_small")

        try:
            processed = _preprocess_audio(audio_bytes)
        except RuntimeError:
            raise
        except Exception as e:
            logger.warning(f"[transcribe] preprocess failed: {e}")
            processed = audio_bytes

        model = _get_whisper_model()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(processed)
            tmp_path = tmp.name

        logger.info("[transcribe] Running Whisper...")
        segments, info = model.transcribe(
            tmp_path,
            language=None,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 300},
            beam_size=5,
            temperature=0.0,
            condition_on_previous_text=False,
            no_speech_threshold=0.6,
            log_prob_threshold=-1.5,
        )
        segments = list(segments)
        text = "".join(s.text for s in segments).strip()

        detected = getattr(info, "language", None) or "unknown"
        prob = float(getattr(info, "language_probability", 0.0) or 0.0)
        duration = float(getattr(info, "duration", 0.0) or 0.0)

        logger.info(
            f"[transcribe] duration={duration:.2f}s "
            f"lang={detected}({prob:.2f}) "
            f"segments={len(segments)} text_len={len(text)}"
        )
        logger.info(f"[transcribe] RAW TEXT: {text!r}")

        if not text:
            return TranscriptionResult(
                None, language=detected, debug="empty_text"
            )

        if duration < 0.5:
            return TranscriptionResult(
                None, language=detected, debug="too_short"
            )

        return TranscriptionResult(
            text=text[:2000],
            low_confidence=(prob < 0.5),
            language=detected,
            debug=f"detected={detected} prob={prob:.2f} dur={duration:.2f}s",
        )
    except RuntimeError:
        raise
    except Exception:
        logger.exception("[transcribe] Unexpected failure")
        raise RuntimeError("Speech recognition failed.")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


async def _edge_tts_generate(text, voice):
    import edge_tts
    communicate = edge_tts.Communicate(text, voice=voice)
    buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])
    return buffer.getvalue()


def text_to_speech_bn(text, voice=TTS_VOICE):
    try:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(_edge_tts_generate(text, voice))
        finally:
            loop.close()
    except Exception as exc:
        raise RuntimeError("Could not generate voice.") from exc