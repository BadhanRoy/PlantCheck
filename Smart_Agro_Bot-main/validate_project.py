"""Validate the SmartAgro Bot project layout.

Run from the project root:
    python validate_project.py
"""
from pathlib import Path
import ast
import sys

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
FRONTEND_SRC = FRONTEND / "src"

errors: list[str] = []

if BACKEND.is_dir():
    for py in BACKEND.glob("*.py"):
        try:
            ast.parse(py.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"Syntax error in {py.relative_to(ROOT)}: {exc}")
else:
    errors.append("Missing folder: backend/")

required_backend = [
    "main.py", "backend.py", "rag.py", "voice.py",
    "image_utils.py", "schemas.py", "ingest.py",
    "check_answer.py", "requirements.txt", ".env.example",
]
for name in required_backend:
    p = BACKEND / name
    if not p.is_file():
        errors.append(f"Missing backend file: {p.relative_to(ROOT)}")

kb_dir = BACKEND / "knowledge_base"
faiss_dir = BACKEND / "faiss_db"

txt_count = len(list(kb_dir.glob("*.txt"))) if kb_dir.is_dir() else 0
if txt_count == 0:
    errors.append("No knowledge-base .txt files found in backend/knowledge_base/")

for required_index in ("index.faiss", "index.pkl"):
    p = faiss_dir / required_index
    if not p.is_file():
        errors.append(f"Missing FAISS index file: {p.relative_to(ROOT)}")

required_frontend = ["package.json", "vite.config.js", "index.html"]
for name in required_frontend:
    p = FRONTEND / name
    if not p.is_file():
        errors.append(f"Missing frontend file: {p.relative_to(ROOT)}")

required_src = [
    "main.jsx", "App.jsx", "api.js", "styles.css",
    "components/ChatMessage.jsx", "components/InputBar.jsx",
    "components/Sidebar.jsx", "components/VoiceConfirm.jsx",
    "hooks/useMediaRecorder.js",
]
for name in required_src:
    p = FRONTEND_SRC / name
    if not p.is_file():
        errors.append(f"Missing frontend file: {p.relative_to(ROOT)}")

if errors:
    print("VALIDATION FAILED")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print("VALIDATION PASSED")
print(f"  Python files parsed : {len(list(BACKEND.glob('*.py')))}")
print(f"  Knowledge-base files: {txt_count}")
print("  FAISS index         : present")
print("  Frontend files      : all present")