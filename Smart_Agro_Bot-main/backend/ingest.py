from __future__ import annotations

import logging
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()
logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent
KB_DIR = BASE_DIR / "knowledge_base"
DB_DIR = BASE_DIR / "faiss_db"

EMBEDDING_MODEL = "models/gemini-embedding-001"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def build_vector_db():
    if not KB_DIR.exists():
        raise RuntimeError(f"knowledge_base folder missing: {KB_DIR}")

    loader = DirectoryLoader(
        str(KB_DIR),
        glob="*.txt",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8", "autodetect_encoding": True},
    )
    documents = loader.load()
    if not documents:
        raise RuntimeError("No .txt files in knowledge_base.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", "।", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL)
    vectordb = FAISS.from_documents(chunks, embeddings)
    DB_DIR.mkdir(parents=True, exist_ok=True)
    vectordb.save_local(str(DB_DIR))
    logger.info("Indexed %d chunks.", len(chunks))
    return DB_DIR


if __name__ == "__main__":
    print(f"Building FAISS index: {build_vector_db()}")