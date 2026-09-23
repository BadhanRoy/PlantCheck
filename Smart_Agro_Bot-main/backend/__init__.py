"""SmartAgro Bot — backend package.

An AI-powered crop-disease assistant for farmers in Bangladesh.
Combines Retrieval-Augmented Generation (RAG) over a curated
knowledge base with Google Gemini for reasoning, Faster-Whisper
for bilingual speech recognition, and Edge TTS for voice replies.

Modules
-------
main
    FastAPI application and HTTP endpoints
    (/api/chat, /api/transcribe, /api/tts, /api/health).

backend
    LLM orchestration: system prompts, retrieval grounding,
    confidence classification, and the main ``get_bot_reply`` entry point.

rag
    FAISS-based retrieval over the knowledge base with
    ``gemini-embedding-001`` vectors.

voice
    Faster-Whisper speech-to-text (auto language detect) and
    Microsoft Edge TTS for Bengali voice output.

image_utils
    Lightweight photo-quality gate — rejects blurry, dark,
    overexposed, or tiny images before the LLM is called.

schemas
    Pydantic request and response models.

ingest
    One-shot script that rebuilds the FAISS index from
    ``knowledge_base/*.txt``.

check_answer
    Diagnostic CLI for scoring RAG retrieval and LLM answers.
"""

__version__ = "2.5.0"
__author__ = "SmartAgro Bot Contributors"
__license__ = "MIT"

__all__ = [
    "main",
    "backend",
    "rag",
    "voice",
    "image_utils",
    "schemas",
    "ingest",
    "check_answer",
]