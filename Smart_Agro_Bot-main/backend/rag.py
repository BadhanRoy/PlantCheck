from __future__ import annotations

import logging
import threading
from pathlib import Path

from langchain_google_genai import GoogleGenerativeAIEmbeddings

logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent
DB_DIR = BASE_DIR / "faiss_db"
EMBEDDING_MODEL = "models/gemini-embedding-001"
_REQUIRED_INDEX_FILES = ("index.faiss", "index.pkl")

_vectordb = None
_load_lock = threading.Lock()

_FRIENDLY_SOURCE_NAMES = {
    "potato_alu": "আলু",
    "wheat_gom": "গম",
    "guava_peyara": "পেয়ারা",
    "tomato_tometo": "টমেটো",
    "dhan_rog_bebosthapona": "ধান (রোগ ব্যবস্থাপনা)",
    "bottle_gourd_lau": "লাউ",
    "litchi_lichu": "লিচু",
    "maize_vutta": "ভুট্টা",
    "brinjal_begun": "বেগুন",
    "banana_kola": "কলা",
    "jackfruit_kathal": "কাঁঠাল",
    "papaya_pepe": "পেঁপে",
    "turmeric_holud": "হলুদ",
}


def _index_exists() -> bool:
    try:
        return DB_DIR.exists() and all(
            (DB_DIR / f).is_file() for f in _REQUIRED_INDEX_FILES
        )
    except Exception:
        return False


def _get_vectordb():
    global _vectordb
    if _vectordb is None:
        with _load_lock:
            if _vectordb is None:
                from langchain_community.vectorstores import FAISS

                embeddings = GoogleGenerativeAIEmbeddings(
                    model=EMBEDDING_MODEL
                )
                _vectordb = FAISS.load_local(
                    str(DB_DIR),
                    embeddings,
                    allow_dangerous_deserialization=True,
                )
    return _vectordb


def retrieve_documents_with_scores(query, k=3):
    if not query or not query.strip() or not _index_exists():
        return []
    try:
        db = _get_vectordb()
        if db is None:
            return []
        results = db.similarity_search_with_score(query, k=k)
        # Ensure results are valid tuples
        return [
            (doc, float(score))
            for doc, score in results
            if doc is not None
        ]
    except Exception:
        logger.exception("RAG retrieval failed")
        return []


def retrieve_documents(query, k=3):
    return [doc for doc, _ in retrieve_documents_with_scores(query, k)]


def format_context_from_docs(docs):
    if not docs:
        return None
    parts = []
    for d in docs:
        try:
            stem = Path(d.metadata.get("source", "")).stem
            parts.append(
                f'<source name="{stem}">\n'
                f"{d.page_content.strip()}\n</source>"
            )
        except Exception:
            continue
    return "\n\n".join(parts) if parts else None


def source_stems_from_docs(docs):
    stems = []
    for doc in docs:
        try:
            stem = Path(doc.metadata.get("source", "")).stem
            if stem and stem not in stems:
                stems.append(stem)
        except Exception:
            continue
    return stems


def friendly_source_name(source_stem):
    if not source_stem:
        return "Unknown"
    return _FRIENDLY_SOURCE_NAMES.get(
        source_stem, source_stem.replace("_", " ").strip().title()
    )


def retrieve_context(query, k=3):
    return format_context_from_docs(retrieve_documents(query, k))