"""SmartAgro Bot — RAG + LLM diagnostic tool.

Run:
    python check_answer.py              # test DEFAULT_QUESTIONS
    python check_answer.py --top-k 6    # deeper retrieval
    python check_answer.py --verbose    # show full LLM context
    python check_answer.py --compare old.json

FAISS scores (smaller = better):
     < 0.30  ✅ Excellent
    < 0.50  ✅ Good
    < 0.70  ⚠️  Fair
    ≥ 0.70  ❌ Poor
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


# ═══════════════════════════════════════════════════════════════════════════
# SAFE IMPORTS
# ═══════════════════════════════════════════════════════════════════════════

def _die(msg: str, code: int = 1) -> None:
    try:
        print(f"\n❌ {msg}\n", file=sys.stderr)
    except UnicodeEncodeError:
        safe = msg.encode("ascii", "replace").decode("ascii")
        print(f"\n[ERROR] {safe}\n", file=sys.stderr)
    sys.exit(code)


_HERE = Path(__file__).resolve().parent

if not (_HERE / "backend.py").is_file():
    _die(
        "backend.py was not found next to check_answer.py.\n"
        f"   Expected in: {_HERE}\n"
        "   Fix: run this from inside the backend/ folder."
    )

if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

try:
    from langchain_core.messages import HumanMessage, SystemMessage
except ImportError as _e:
    _die(
        f"langchain_core is not installed: {_e}\n"
        "   Fix: pip install -r requirements.txt"
    )

try:
    from backend import SYSTEM_PROMPT, extract_text, get_llm
except Exception as _e:
    _die(f"Could not import backend.py: {_e}")

try:
    from rag import (
        format_context_from_docs,
        friendly_source_name,
        retrieve_documents_with_scores,
        source_stems_from_docs,
    )
except Exception as _e:
    _die(f"Could not import rag.py: {_e}")

try:
    from rag import _index_exists as _rag_index_exists  # type: ignore
except Exception:
    def _rag_index_exists() -> bool:
        return True


# ═══════════════════════════════════════════════════════════════════════════
# ANSI COLOR
# ═══════════════════════════════════════════════════════════════════════════

class C:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    RED     = "\033[31m"
    GREEN   = "\033[32m"
    YELLOW  = "\033[33m"
    BLUE    = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN    = "\033[36m"
    GRAY    = "\033[90m"


def _enable_win_ansi() -> bool:
    if sys.platform != "win32":
        return True
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-11)
        mode = ctypes.c_uint32()
        if not kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
            return False
        return bool(kernel32.SetConsoleMode(handle, mode.value | 0x0004))
    except Exception:
        return False


COLOR_OK: bool = (
    sys.stdout.isatty()
    and os.getenv("NO_COLOR") is None
    and _enable_win_ansi()
)


def _c(text: str, *codes: str) -> str:
    if not COLOR_OK:
        return str(text)
    return "".join(codes) + str(text) + C.RESET


# ═══════════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════════

DEFAULT_QUESTIONS: list[str] = [
    "ধানের ব্লাস্ট রোগের প্রতিকার কী?",
    "আলুর লেট ব্লাইট হলে কী করব?",
    "টমেটোর পাতায় দাগ কেন হয়?",
    "How to treat rice blast?",
    "Potato late blight remedy",
]

REPORT_DIR = _HERE / "check_reports"


# ═══════════════════════════════════════════════════════════════════════════
# DATA MODELS
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class RetrievedChunk:
    rank: int
    source: str
    source_stem: str
    score: float
    snippet: str


@dataclass
class CheckResult:
    question: str
    retrieved: int = 0
    best_score: float = float("inf")
    mean_score: float = float("inf")
    chunks: list[RetrievedChunk] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    answer: str = ""
    verdict: str = ""
    rag_ms: float = 0.0
    llm_ms: float = 0.0
    total_ms: float = 0.0
    error: Optional[str] = None


@dataclass
class Report:
    timestamp: str
    cwd: str
    top_k: int
    results: list[CheckResult]


# ═══════════════════════════════════════════════════════════════════════════
# REPORT I/O
# ═══════════════════════════════════════════════════════════════════════════

def _to_jsonable(obj: Any) -> Any:
    if hasattr(obj, "__dataclass_fields__"):
        return {k: _to_jsonable(v) for k, v in asdict(obj).items()}
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_jsonable(v) for v in obj]
    if isinstance(obj, float):
        if obj == float("inf") or obj != obj:
            return None
        return obj
    if isinstance(obj, Path):
        return str(obj)
    return obj


def save_report(report: Report, path: Optional[Path] = None) -> Path:
    if path is None:
        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = REPORT_DIR / f"check_{ts}.json"
    else:
        path = Path(path).resolve()
        path.parent.mkdir(parents=True, exist_ok=True)

    data = _to_jsonable(report)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def load_report(path: Path) -> dict:
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(_c(f"⚠️  Report not found: {path}", C.YELLOW))
    except json.JSONDecodeError as e:
        print(_c(f"⚠️  Report is not valid JSON: {e}", C.YELLOW))
    except Exception as e:
        print(_c(f"⚠️  Could not load report: {e}", C.YELLOW))
    return {}


# ═══════════════════════════════════════════════════════════════════════════
# DIAGNOSIS
# ═══════════════════════════════════════════════════════════════════════════

def score_quality(score: float) -> tuple[str, str]:
    if score < 0.30:
        return "✅ Excellent", C.GREEN
    if score < 0.50:
        return "✅ Good", C.GREEN
    if score < 0.70:
        return "⚠️  Fair", C.YELLOW
    return "❌ Poor", C.RED


def _snippet(text: str, n: int = 140) -> str:
    s = (text or "").strip().replace("\n", " ").replace("\r", " ")
    s = " ".join(s.split())
    return s if len(s) <= n else s[: n - 1] + "…"


def diagnose(result: CheckResult) -> str:
    if result.error:
        return f"❌ {result.error}"
    if result.retrieved == 0:
        return "❌ No documents retrieved — check knowledge_base/ + re-run ingest.py"

    best = result.best_score
    answer = result.answer or ""
    lower = answer.lower()

    is_unverified = (
        "যাচাইকৃত নয়" in answer
        or "unverified" in lower
        or "general advice" in lower
    )
    has_structure = any(
        m in answer for m in ("🔍", "সমস্যা", "লক্ষণ", "ব্যবস্থাপনা", "symptom", "disease")
    )

    if best > 0.70:
        return "❌ Poor retrieval — KB-তে প্রশ্নের ভাষা যোগ করুন"
    if best > 0.50:
        if is_unverified:
            return "⚠️  Moderate retrieval + unverified answer"
        return "⚠️  Moderate retrieval — কাজ চলে, তবে KB উন্নত করা যায়"
    if is_unverified:
        return "⚠️  Good retrieval but LLM says 'unverified'"
    if not has_structure:
        return "⚠️  LLM answer looks flat — system prompt বা model চেক করুন"
    return "✅ RAG + LLM সব ঠিক আছে"


# ═══════════════════════════════════════════════════════════════════════════
# CORE
# ═══════════════════════════════════════════════════════════════════════════

def check_one(question: str, top_k: int = 4, verbose: bool = False) -> CheckResult:
    result = CheckResult(question=question)
    t_start = time.perf_counter()

    print()
    print(_c("═" * 74, C.GRAY))
    print(_c(f"  ❓ {question}", C.BOLD, C.CYAN))
    print(_c("═" * 74, C.GRAY))

    if not _rag_index_exists():
        result.error = "FAISS index not found"
        result.verdict = diagnose(result)
        print(_c("    ❌ FAISS index missing. Run `python ingest.py` first.", C.RED))
        return result

    print(f"\n{_c('[1] RAG retrieval', C.BOLD)}  (top_k={top_k})")
    t0 = time.perf_counter()

    try:
        scored = retrieve_documents_with_scores(question, k=top_k)
    except Exception as exc:
        result.error = f"RAG error: {exc}"
        result.verdict = diagnose(result)
        print(_c(f"    ❌ {result.error}", C.RED))
        return result

    result.rag_ms = (time.perf_counter() - t0) * 1000

    if not scored:
        result.error = "No documents matched"
        result.verdict = diagnose(result)
        print(_c("    ❌ কোনো document মেলেনি (empty KB or off-topic)", C.RED))
        return result

    result.retrieved = len(scored)
    scores = [s for _, s in scored]
    result.best_score = float(scores[0])
    result.mean_score = float(sum(scores) / len(scores))

    for i, (doc, score) in enumerate(scored, 1):
        stem = Path(doc.metadata.get("source", "")).stem
        pretty = friendly_source_name(stem)
        tag, color = score_quality(float(score))
        result.chunks.append(
            RetrievedChunk(
                rank=i,
                source=pretty,
                source_stem=stem,
                score=float(score),
                snippet=_snippet(doc.page_content, 140),
            )
        )
        print(
            f"    [{i}] {pretty:32s} "
            f"{_c(f'score={score:.4f}', color)}  {_c(tag, color)}"
        )
        print(_c(f"         {_snippet(doc.page_content, 140)}", C.DIM))

    print(
        _c(
            f"    ⏱  RAG: {result.rag_ms:.0f} ms  |  "
            f"best={result.best_score:.4f}  mean={result.mean_score:.4f}",
            C.GRAY,
        )
    )

    docs = [d for d, _ in scored]
    context = format_context_from_docs(docs)
    result.sources = [friendly_source_name(s) for s in source_stems_from_docs(docs)]

    if verbose:
        print(f"\n{_c('[2] Full context (verbose)', C.BOLD)}")
        print(_c(context or "(empty)", C.DIM))

    print(f"\n{_c('[3] Asking the LLM…', C.BOLD)}")
    system_content = SYSTEM_PROMPT
    if context:
        system_content += "\n\n=== Verified reference (knowledge base) ===\n" + context

    t0 = time.perf_counter()
    try:
        response = get_llm().invoke([
            SystemMessage(content=system_content),
            HumanMessage(content=question),
        ])
        result.answer = extract_text(response.content).strip()
    except Exception as exc:
        result.error = f"LLM error: {exc}"
        result.verdict = diagnose(result)
        print(_c(f"    ❌ {result.error}", C.RED))
        return result

    result.llm_ms = (time.perf_counter() - t0) * 1000

    print(f"\n{_c('[4] Bot answer', C.BOLD)}\n")
    for line in (result.answer.splitlines() or [""]):
        print(f"    {line}")

    result.total_ms = (time.perf_counter() - t_start) * 1000
    result.verdict = diagnose(result)

    if result.verdict.startswith("✅"):
        vcolor = C.GREEN
    elif result.verdict.startswith("❌"):
        vcolor = C.RED
    else:
        vcolor = C.YELLOW

    print()
    print(
        _c(
            f"    ⏱  LLM: {result.llm_ms:.0f} ms  |  "
            f"total: {result.total_ms:.0f} ms",
            C.GRAY,
        )
    )
    print(_c(f"\n[5] Verdict: {result.verdict}", C.BOLD, vcolor))
    return result


# ═══════════════════════════════════════════════════════════════════════════
# BATCH
# ═══════════════════════════════════════════════════════════════════════════

def run_batch(
    questions: list[str],
    top_k: int = 4,
    verbose: bool = False,
) -> Report:
    results: list[CheckResult] = []
    for q in questions:
        try:
            results.append(check_one(q, top_k=top_k, verbose=verbose))
        except KeyboardInterrupt:
            print(_c("\n\n⚠️  Interrupted by user", C.YELLOW))
            break
        except Exception as exc:
            r = CheckResult(question=q, error=f"Unexpected: {exc}")
            r.verdict = diagnose(r)
            results.append(r)
            print(_c(f"\n❌ Unexpected error on '{q}': {exc}", C.RED))

    return Report(
        timestamp=datetime.now().isoformat(timespec="seconds"),
        cwd=str(Path.cwd()),
        top_k=top_k,
        results=results,
    )


# ═══════════════════════════════════════════════════════════════════════════
# SUMMARY + COMPARISON
# ═══════════════════════════════════════════════════════════════════════════

def _truncate(s: str, n: int) -> str:
    return s if len(s) <= n else s[: n - 1] + "…"


def print_summary(report: Report) -> None:
    print()
    print(_c("═" * 74, C.GRAY))
    print(_c("  📊 Summary", C.BOLD, C.MAGENTA))
    print(_c("═" * 74, C.GRAY))

    print(_c(f"  {'#':>2}  {'Question':<42}  {'Best':>7}  {'Time':>7}  Verdict", C.BOLD))
    print(_c("  " + "─" * 70, C.GRAY))

    for i, r in enumerate(report.results, 1):
        q = _truncate(r.question, 42)
        best = "n/a" if r.best_score == float("inf") else f"{r.best_score:.4f}"
        t = f"{r.total_ms:.0f}ms" if r.total_ms else "n/a"
        v = _truncate(r.verdict, 30)

        if r.verdict.startswith("✅"):
            v = _c(v, C.GREEN)
        elif r.verdict.startswith("❌"):
            v = _c(v, C.RED)
        else:
            v = _c(v, C.YELLOW)

        print(f"  {i:>2}  {q:<42}  {best:>7}  {t:>7}  {v}")

    ok = sum(1 for r in report.results if r.verdict.startswith("✅"))
    warn = sum(1 for r in report.results if r.verdict.startswith("⚠️"))
    bad = sum(1 for r in report.results if r.verdict.startswith("❌"))

    print(_c("  " + "─" * 70, C.GRAY))
    print(
        f"  {_c('✅', C.GREEN)} {ok}   "
        f"{_c('⚠️ ', C.YELLOW)} {warn}   "
        f"{_c('❌', C.RED)} {bad}   "
        f"(total {len(report.results)})"
    )


def print_comparison(current: Report, previous: dict) -> None:
    print()
    print(_c("═" * 74, C.GRAY))
    print(_c("  🔍 Baseline comparison", C.BOLD, C.MAGENTA))
    print(_c("═" * 74, C.GRAY))

    if not previous or "results" not in previous:
        print(_c("  ⚠️  No previous results to compare against.", C.YELLOW))
        return

    prev_by_q = {
        r.get("question"): r
        for r in previous.get("results", [])
        if isinstance(r, dict) and r.get("question")
    }

    print(f"  {'Question':<42}  {'Prev':>7}  {'Now':>7}  Δ")
    print(_c("  " + "─" * 70, C.GRAY))

    improved = worsened = same = skipped = 0

    for r in current.results:
        p = prev_by_q.get(r.question)
        if p is None:
            skipped += 1
            continue

        prev_best = p.get("best_score")
        now_best = r.best_score

        if prev_best is None or now_best == float("inf"):
            skipped += 1
            continue

        delta = now_best - prev_best
        if delta < -0.02:
            tag, color = "↓ better", C.GREEN
            improved += 1
        elif delta > 0.02:
            tag, color = "↑ worse", C.RED
            worsened += 1
        else:
            tag, color = "= same", C.GRAY
            same += 1

        q = _truncate(r.question, 42)
        print(f"  {q:<42}  {prev_best:>7.4f}  {now_best:>7.4f}  {_c(tag, color)}")

    print(_c("  " + "─" * 70, C.GRAY))
    print(
        f"  {_c(f'improved: {improved}', C.GREEN)}   "
        f"{_c(f'worsened: {worsened}', C.RED)}   "
        f"{_c(f'same: {same}', C.GRAY)}   "
        f"{_c(f'skipped: {skipped}', C.DIM)}"
    )


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════

def _parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="check_answer",
        description="SmartAgro Bot — RAG + LLM diagnostic tool",
    )
    p.add_argument(
        "question",
        nargs="*",
        help="A single question (overrides DEFAULT_QUESTIONS). "
             "Use English here — PowerShell mangles Bengali CLI args.",
    )
    p.add_argument("--top-k", type=int, default=4, help="RAG retrieval depth (default: 4)")
    p.add_argument("--json", type=Path, default=None, help="Save report to a specific path")
    p.add_argument("--no-save", action="store_true", help="Do not save a JSON report")
    p.add_argument("--compare", type=Path, default=None, help="Compare against a previous report")
    p.add_argument("--verbose", action="store_true", help="Print full context sent to the LLM")
    p.add_argument("--no-color", action="store_true", help="Disable colored output")
    return p.parse_args(argv)


def _banner() -> None:
    print()
    print(_c("╭" + "─" * 72 + "╮", C.GRAY))
    title = "  🌱 SmartAgro Bot — RAG + LLM diagnostic tool"
    print(_c("│", C.GRAY) + _c(title.ljust(72), C.BOLD, C.GREEN) + _c("│", C.GRAY))
    print(_c("╰" + "─" * 72 + "╯", C.GRAY))


def main(argv: Optional[list[str]] = None) -> int:
    global COLOR_OK

    try:
        args = _parse_args(argv if argv is not None else sys.argv[1:])
    except SystemExit:
        raise

    if args.no_color:
        COLOR_OK = False

    _banner()

    if args.question:
        cli_q = " ".join(args.question).strip()
        if cli_q and "?" in cli_q:
            if any(w.strip("?").strip() == "" for w in cli_q.split()):
                print(_c(
                    "\n⚠️  Warning: the CLI argument contains isolated '?' tokens,\n"
                    "   which usually means PowerShell mangled Bengali characters.\n"
                    "   Edit DEFAULT_QUESTIONS inside check_answer.py and run without\n"
                    "   arguments instead.\n",
                    C.YELLOW,
                ))
        questions = [cli_q] if cli_q else []
    else:
        questions = list(DEFAULT_QUESTIONS)

    if not questions:
        print(_c("❌ No questions to test.", C.RED))
        return 1

    try:
        report = run_batch(questions, top_k=args.top_k, verbose=args.verbose)
    except KeyboardInterrupt:
        print(_c("\n\n⚠️  Interrupted by user", C.YELLOW))
        return 130
    except Exception as exc:
        print(_c(f"\n❌ Fatal error: {exc}", C.RED))
        return 1

    print_summary(report)

    if args.compare:
        previous = load_report(args.compare)
        print_comparison(report, previous)

    if not args.no_save:
        try:
            saved_path = save_report(report, args.json)
            print()
            print(_c(f"💾 Report saved: {saved_path}", C.GRAY))
        except Exception as exc:
            print(_c(f"⚠️  Could not save report: {exc}", C.YELLOW))

    print()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(_c("\n\n⚠️  Interrupted", C.YELLOW))
        sys.exit(130)