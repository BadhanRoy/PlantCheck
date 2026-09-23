# 🌱 SmartAgro Bot



> RAG-grounded answers · bilingual STT/TTS · trust-scored replies · one-tap helplines

![CI](https://img.shields.io/badge/CI-passing-22c55e?style=flat-square)
![Python](https://img.shields.io/badge/python-3.10%20|%203.11%20|%203.12-3776AB?style=flat-square&logo=python&logoColor=white)
![Node](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-welcome-22c55e?style=flat-square)

**Quick links:** [Quick start](#-quick-start) · [Features](#-features) · [API](#-api) · [Config](#-configuration) · [Deploy](#-deployment) · [FAQ](#-faq)

---

## 🎯 Why SmartAgro?

> 70% of Bangladesh's population depends on agriculture. Most farmers can't reach an agronomist quickly — but every farmer has a phone.

SmartAgro answers three questions in under 10 seconds:

1. **What is wrong with my crop?** — Photo or description
2. **How do I fix it?** — Verified, sourced remedy in Bengali
3. **Can I trust this?** — Every reply carries a trust score

---



**Prerequisites**

- Python 3.10 or newer
- Node.js 18 or newer
- Google API key ([get one free](https://aistudio.google.com/apikey))
- Optional: [FFmpeg](https://ffmpeg.org/download.html) for better audio


**Clone the repository**

    git clone https://github.com/<your-username>/SmartAgro_Bot.git
    cd SmartAgro_Bot


**Backend setup**

    cd backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1        # Windows
    # source venv/bin/activate          # macOS / Linux
    pip install -r requirements.txt
    cp .env.example .env                # then add GOOGLE_API_KEY
    python ingest.py                    # build RAG index (one-time)
    uvicorn main:app --reload --port 8000


**Frontend setup (new terminal)**

    cd frontend
    npm install
    npm run dev

The browser opens automatically at **http://localhost:5173**.

---

## ✨ Features

### End-user capabilities

| | Feature | Detail |
|---|---|---|
| 🧠 | **RAG-grounded answers** | FAISS + Gemini embeddings over a curated crop-disease KB |
| 🛡️ | **Trust badge** | Every reply scored ✅ Verified · ⚠️ Likely · ⚠️ Guess · ❓ No data |
| 🌐 | **Bilingual** | Bengali default · English on request (`in English`, `ইংরেজিতে বলুন`) |
| 🎙️ | **Voice input** | Faster-Whisper with auto language detection (bn / en) |
| 🔊 | **Voice output** | Microsoft Edge TTS — natural Bengali (`bn-BD-NabanitaNeural`) |
| 🖼️ | **Image quality gate** | Blurry / dark / overexposed photos rejected before LLM call |
| 📞 | **4 BD helplines** | Tap-to-call on mobile · copy + WhatsApp on desktop |
| 🎨 | **Modern UI** | Rice-field backdrop · hover-triggered sidebar · glass cards |

### Engineering capabilities

| | Feature | Detail |
|---|---|---|
| 🔒 | Rate limiting | Per-IP sliding window on expensive endpoints |
| ⏱️ | Timeouts | Frontend + proxy + backend, end-to-end |
| 🧵 | Thread-safe | LLM and Whisper model singletons |
| 🚨 | Friendly errors | Never leaks stack traces to clients |
| 📐 | Type-safe | Pydantic v2 backend · defensive frontend coercion |
| 🧪 | Diagnostic CLI | `check_answer.py` scores every retrieval + reply |
| ♿ | Accessible | `prefers-reduced-motion` · ARIA labels · keyboard nav |
| 📱 | Responsive | Desktop · tablet · mobile · landscape |

---

## Architecture

┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (React + Vite)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Sidebar    │  │  Chat Panel  │  │  InputBar  │  │ VoiceConfirm│ │
│  │  (drawer)   │  │  + TrustBadge│  │  + Helpline│  │ + TrustBadge│ │
│  └─────────────┘  └──────────────┘  └────────────┘  └────────────┘  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │  /api/*  (Vite proxy → :8000)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       FastAPI Server (Python)                       │
│                                                                     │
│   /api/chat ───► RAG retrieval ──► Gemini chat ──► reply + meta     │
│                    (FAISS +       (system prompt +                  │
│                     embeddings)    verified context)                │
│                                                                     │
│   /api/transcribe ─► Whisper ──► Gemini correction ──► text + lang  │
│                                                                     │
│   /api/tts ────────► Edge TTS ──► MP3 stream                        │
│                                                                     │
│   /api/health ─────► ffmpeg + status                                │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
      ┌──────────────┐   ┌─────────────────┐  ┌──────────────┐
      │  FAISS index │   │ Google Gemini   │  │  Edge TTS    │
      │  (local)     │   │ (cloud)         │  │  (cloud)     │
      └──────────────┘   └─────────────────┘  └──────────────┘





## 📡 API

Base URL: `http://127.0.0.1:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Status + ffmpeg availability |
| `POST` | `/api/chat` | Text + optional photo → diagnosis |
| `POST` | `/api/transcribe` | Audio → text (auto language) |
| `POST` | `/api/tts` | Text → MP3 stream |

**POST /api/chat — request**

Multipart form data:

| Field | Type | Req. | Notes |
|---|---|---|---|
| `text` | string | ✓* | User question (≤ 2000 chars) |
| `image` | file | ✓* | JPG or PNG, ≤ 5 MB |
| `history_json` | JSON string | – | Prior turns |

At least one of `text` or `image` is required.



## ⚙️ Configuration

All settings live in **`backend/.env`** (copy from `.env.example`).

**Minimum required**

    GOOGLE_API_KEY=your-key-here

**All environment variables**

| Variable | Default | Description |
|---|---|---|
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Any Gemini chat model |
| `SMARTAGRO_IMAGE_HINT` | `0` | `1` = extra LLM call for photo hints |
| `SMARTAGRO_CORRECT_STT` | `1` | Gemini cleanup of rough transcripts |
| `SMARTAGRO_DEBUG_RAG` | `0` | Dump retrieved context to file |
| `WHISPER_MODEL_SIZE` | `small` | `tiny` · `base` · `small` · `medium` |
| `WHISPER_DEVICE` | `cpu` | `cuda` for NVIDIA GPUs |
| `WHISPER_COMPUTE_TYPE` | `int8` | `float16` on GPU |
| `EDGE_TTS_VOICE` | `bn-BD-NabanitaNeural` | Any Edge TTS voice |
| `FRONTEND_ORIGINS` | `localhost:5173` | Comma-separated CORS origins |
| `RATE_LIMIT_MAX_REQUESTS` | `20` | Per IP per window |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Sliding window length |
| `MAX_IMAGE_BYTES` | `5242880` | 5 MB upload cap |
| `MAX_AUDIO_BYTES` | `8388608` | 8 MB upload cap |
| `MAX_AUDIO_DURATION_MS` | `120000` | Reject longer recordings |
| `MAX_TEXT_CHARS` | `2000` | Per user message |
| `MAX_TTS_CHARS` | `2500` | Per TTS request |

---

## 📁 Structure

    SmartAgro_Bot/
    ├── backend/
    │   ├── main.py            # FastAPI app + endpoints
    │   ├── backend.py         # LLM orchestration + system prompts
    │   ├── rag.py             # FAISS retrieval
    │   ├── voice.py           # Whisper STT + Edge TTS
    │   ├── image_utils.py     # Photo quality gate
    │   ├── schemas.py         # Pydantic models
    │   ├── ingest.py          # Build the RAG index
    │   ├── check_answer.py    # RAG/LLM diagnostic CLI
    │   ├── requirements.txt
    │   ├── .env.example
    │   ├── knowledge_base/    # Curated .txt files (BN + EN)
    │   └── faiss_db/          # Pre-built index
    │
    └── frontend/
        ├── vite.config.js
        ├── public/
        │   └── rice-field.jpg
        └── src/
            ├── App.jsx
            ├── api.js
            ├── styles.css
            ├── components/    # Sidebar · ChatMessage · InputBar
            │                  # VoiceConfirm · TrustBadge · HelplineModal
            └── hooks/         # useMediaRecorder

---

## 🧪 Testing & Debugging

**Run the diagnostic CLI**

    cd backend
    python check_answer.py --no-save

Output per question:

    ❓ ধানের ব্লাস্ট রোগের প্রতিকার কী?
    [1] RAG retrieval
        [1] ধান (রোগ ব্যবস্থাপনা)    score=0.2345  ✅ Excellent
    [3] Asking the LLM…
    [5] Verdict: ✅ RAG + LLM সব ঠিক আছে

**Useful flags**

| Flag | Purpose |
|---|---|
| `--top-k 6` | Deeper retrieval |
| `--verbose` | Show full LLM context |
| `--json out.json` | Save report |
| `--compare old.json` | Baseline comparison |

**Validate the project**

    python validate_project.py

---



## 🚢 Deployment

Production checklist:

1. Reverse proxy — Nginx or Caddy in front of Uvicorn
2. HTTPS — Let's Encrypt / Cloudflare
3. CORS — Set `FRONTEND_ORIGINS` to your real domain
4. Rate limiting — Replace in-memory limiter with Redis for multi-worker
5. Secrets — Use a secret manager; never commit `.env`
6. Frontend — `npm run build` → serve `dist/` statically
7. Process manager — `systemd`, `supervisor`, or Docker
8. Logging — Ship logs to a central store

---

## 🗺️ Roadmap

| Status | Feature |
|:---:|---|
| ✅ | Photo · text · voice input |
| ✅ | Bilingual replies |
| ✅ | Trust-scored answers |
| ✅ | Helpline integration |
| ⏳ | Offline mode (whisper.cpp) |
| ⏳ | User accounts + history |
| ⏳ | Redis rate limiting |
| ⏳ | WhatsApp / Messenger bot |
| 💡 | More crops (jute, tea, sugarcane) |

---



## ❓ FAQ

**Why is my first transcription so slow?**

Whisper downloads its model on first use (~500 MB for `small`). Subsequent runs load from cache in ~2 seconds.

**Can I run this on a laptop without a GPU?**

Yes. Set `WHISPER_MODEL_SIZE=small` and `WHISPER_DEVICE=cpu`. Expect ~1× realtime.

**How do I add a new crop to the knowledge base?**

Drop a UTF-8 `.txt` file into `backend/knowledge_base/`, then run `python ingest.py`. The index rebuilds in seconds.

**Why do I sometimes see "❓ তথ্য নেই"?**

The question didn't match anything in the KB. The bot is telling you honestly that it doesn't know — try rephrasing, or ask a local officer.

**Does it work offline?**

Not yet. Gemini and Edge TTS are cloud-based. Offline mode (whisper.cpp + local LLM) is on the roadmap.

**Is my data private?**

Yes. The knowledge base lives on your machine. Only prompts and images are sent to Google's Gemini API — no user accounts, no tracking, no analytics.

---

## 📜 License

Released under the [MIT License](./LICENSE).

---

** I Built 💚 for the farmers of Bangladesh**

Powered by [Gemini](https://ai.google.dev) · [FastAPI](https://fastapi.tiangolo.com) · [Whisper](https://github.com/SYSTRAN/faster-whisper) · [FAISS](https://github.com/facebookresearch/faiss)
