import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatMessage from './components/ChatMessage.jsx';
import InputBar from './components/InputBar.jsx';
import VoiceConfirm from './components/VoiceConfirm.jsx';
import HelplineModal from './components/HelplineModal.jsx';
import { useMediaRecorder } from './hooks/useMediaRecorder.js';
import { fetchTTS, sendChat, transcribeAudio } from './api.js';

let messageCounter = 0;
const nextId = () => `m_${Date.now()}_${++messageCounter}`;

const SUGGESTIONS = [
  { icon: '🌾', label: 'Rice Blast', tone: 'green' },
  { icon: '🍅', label: 'Tomato Leaf Spot', tone: 'red' },
  { icon: '🥔', label: 'Potato Late Blight', tone: 'amber' },
  { icon: '🌽', label: 'Maize Borer', tone: 'yellow' },
];

function ChatBackdrop() {
  return (
    <div className="chat-backdrop" aria-hidden="true">
      <div className="backdrop-photo" />
      <div className="backdrop-warmth" />
      <div className="backdrop-vignette" />
      <div className="backdrop-fade" />
    </div>
  );
}

function SelfDrawingPlant() {
  return (
    <svg className="drawing-plant" width="52" height="52" viewBox="0 0 56 56"
         fill="none" aria-hidden="true">
      <path pathLength="100" className="dp-stem"
        d="M28 54 C28 42 28 34 28 24"
        stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path pathLength="100" className="dp-leaf-left"
        d="M28 34 C18 30 12 22 14 12 C22 16 28 24 28 34 Z"
        stroke="#16a34a" strokeWidth="2" strokeLinejoin="round"
        fill="rgba(34, 197, 94, 0.14)" />
      <path pathLength="100" className="dp-leaf-right"
        d="M28 28 C38 24 44 16 42 6 C34 10 28 18 28 28 Z"
        stroke="#16a34a" strokeWidth="2" strokeLinejoin="round"
        fill="rgba(34, 197, 94, 0.14)" />
    </svg>
  );
}

// Safely convert any backend reply into a string
function toStringSafe(value, fallback = '') {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  try { return String(value); } catch { return fallback; }
}

// Safely extract an array of strings
function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => v != null && typeof v !== 'object')
    .map((v) => toStringSafe(v))
    .filter((s) => s.length > 0);
}

export default function SmartAgroBot() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(null);
  const [showHelpline, setShowHelpline] = useState(false);
  const chatEndRef = useRef(null);
  const recorder = useMediaRecorder();

  const sendingRef = useRef(false);
  const generationRef = useRef(0);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      messagesRef.current.forEach((m) => {
        if (m.imageUrl) URL.revokeObjectURL(m.imageUrl);
        if (m.audioUrl) URL.revokeObjectURL(m.audioUrl);
      });
    };
  }, []);

  const playTTS = useCallback(async (id, text) => {
    try {
      const blob = await fetchTTS(text);
      const url = URL.createObjectURL(blob);
      if (!messagesRef.current.some((m) => m.id === id)) {
        URL.revokeObjectURL(url);
        return;
      }
      setMessages((items) =>
        items.map((m) => (m.id === id ? { ...m, audioUrl: url } : m)),
      );
    } catch (error) {
      console.warn('TTS failed', error);
    }
  }, []);

  const handleSend = useCallback(async ({ text, imageFile } = {}) => {
    if (sendingRef.current) return;
    if (!text && !imageFile) return;

    const myGeneration = generationRef.current;

    sendingRef.current = true;
    setLoading(true);

    let imageUrl = null;
    try {
      imageUrl = imageFile ? URL.createObjectURL(imageFile) : null;
    } catch {
      imageUrl = null;
    }

    const displayText =
      toStringSafe(text) || (imageFile ? '(image attached)' : '');
    setMessages((m) => [
      ...m,
      { id: nextId(), role: 'user', text: displayText, imageUrl },
    ]);

    try {
      const res = await sendChat({ text, imageFile, history });

      if (generationRef.current !== myGeneration) return;

      const rawMeta = res && typeof res === 'object' ? res : {};
      const confidence = ['high', 'medium', 'low', 'none'].includes(
        rawMeta.confidence,
      )
        ? rawMeta.confidence
        : 'none';

      const replyText = toStringSafe(rawMeta.reply, '(empty response)');

      const meta = rawMeta.image_quality_issue
        ? {
            confidence,
            confidence_label:
              toStringSafe(rawMeta.confidence_label) || '❌ ছবি অস্পষ্ট',
            confidence_reason:
              toStringSafe(rawMeta.confidence_reason) ||
              'ভালো ছবি দিলে আরও নির্ভুল পরামর্শ পাওয়া যাবে',
            best_match_score:
              typeof rawMeta.best_match_score === 'number'
                ? rawMeta.best_match_score
                : null,
            matched_chunks: Number(rawMeta.matched_chunks) || 0,
            matched_crops: toStringArray(rawMeta.matched_crops),
            uncertainty_reasons: toStringArray(rawMeta.uncertainty_reasons),
          }
        : {
            verified: Boolean(rawMeta.verified),
            sources: toStringArray(rawMeta.sources),
            confidence,
            confidence_label: toStringSafe(rawMeta.confidence_label) || null,
            confidence_reason: toStringSafe(rawMeta.confidence_reason) || null,
            best_match_score:
              typeof rawMeta.best_match_score === 'number'
                ? rawMeta.best_match_score
                : null,
            matched_chunks: Number(rawMeta.matched_chunks) || 0,
            matched_crops: toStringArray(rawMeta.matched_crops),
            uncertainty_reasons: toStringArray(rawMeta.uncertainty_reasons),
          };

      const assistantId = nextId();
      setMessages((m) => [
        ...m,
        { id: assistantId, role: 'assistant', text: replyText, meta },
      ]);

      if (!rawMeta.image_quality_issue) {
        setHistory((h) => [
          ...h.slice(-8),
          { role: 'user', content: toStringSafe(text) },
          { role: 'assistant', content: replyText },
        ]);

        if (voiceEnabled && replyText) {
          const speakable = replyText
            .split('\n')
            .filter((line) => {
              const t = line.trim();
              return t && !t.startsWith('⚠️') && t !== '---';
            })
            .join('\n')
            .trim();
          if (speakable) playTTS(assistantId, speakable);
        }
      }
    } catch (error) {
      if (generationRef.current !== myGeneration) return;
      const errMsg = toStringSafe(error?.message, 'Unknown error');
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: 'assistant',
          text: `⚠️ ${errMsg}`,
          meta: {
            confidence: 'none',
            confidence_label: '❌ সংযোগ সমস্যা',
            confidence_reason: errMsg,
            uncertainty_reasons: [errMsg],
          },
        },
      ]);
    } finally {
      if (generationRef.current === myGeneration) {
        setLoading(false);
        sendingRef.current = false;
      }
    }
  }, [history, voiceEnabled, playTTS]);

  const startRecording = useCallback(async () => {
    try {
      await recorder.start();
    } catch (error) {
      alert(toStringSafe(error?.message, 'Could not start recording.'));
    }
  }, [recorder]);

  const handleRecordToggle = useCallback(async () => {
    if (loading && !recorder.recording) return;
    if (recorder.recording) {
      const blob = await recorder.stop();
      if (!blob) {
        alert("Couldn't capture any audio. Please try again.");
        return;
      }
      setLoading(true);
      try {
        const result = await transcribeAudio(blob);
        if (result?.text) {
          setPending({
            text: toStringSafe(result.text),
            lowConf: Boolean(result.low_confidence),
            language: toStringSafe(result.language) || null,
          });
        } else {
          alert(
            "I couldn't understand the speech clearly. " +
            "Please try again — speak a bit closer to the mic, in a quiet room."
          );
        }
      } catch (error) {
        alert(toStringSafe(error?.message, 'Transcription failed.'));
      } finally {
        setLoading(false);
      }
    } else {
      await startRecording();
    }
  }, [loading, recorder, startRecording]);

  const clearAll = useCallback(async () => {
    if (!confirm('Clear the entire conversation?')) return;

    generationRef.current += 1;

    if (recorder.recording) {
      try { await recorder.stop(); } catch { /* ignore */ }
    }

    messagesRef.current.forEach((m) => {
      if (m.imageUrl) URL.revokeObjectURL(m.imageUrl);
      if (m.audioUrl) URL.revokeObjectURL(m.audioUrl);
    });

    setMessages([]);
    setHistory([]);
    setPending(null);
    setLoading(false);
    sendingRef.current = false;
  }, [recorder]);

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="app">
      {/* ─── Hover-triggered sidebar drawer ─── */}
      <div
        className="sidebar-shell"
        role="complementary"
        aria-label="SmartAgro navigation"
      >
        <div className="sidebar-dock" aria-hidden="true" />
        <Sidebar
          voiceEnabled={voiceEnabled}
          onToggleVoice={setVoiceEnabled}
          onClear={clearAll}
          onOpenHelpline={() => setShowHelpline(true)}
        />
      </div>

      <main className={`chat ${isEmpty ? 'chat-idle' : 'chat-active'}`}>
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-mark" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.6"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 4 13V6a2 2 0 0 1 2-2h7a7 7 0 0 1 7 7v1a5 5 0 0 1-5 5h-4z" />
                <path d="M11 20v-5M8 11c2 0 4-1 5-3" />
              </svg>
            </div>
            <div className="chat-header-titles">
              <h2>SmartAgro Bot</h2>
              <div className="chat-header-status">
                <span className="online-dot" aria-hidden />
                <span>Online · Ready to help</span>
              </div>
            </div>
          </div>
          <p className="chat-header-sub">
            Identify crop diseases · Find reliable remedies
          </p>
        </header>

        <div className={`messages ${isEmpty ? 'messages-empty' : ''}`}>
          {isEmpty && <ChatBackdrop />}

          {isEmpty ? (
            <div className="welcome">
              <div className="welcome-glow" aria-hidden />
              <div className="welcome-icon" aria-hidden>🌱</div>
              <h3>Welcome to SmartAgro Bot</h3>
              <p>
                Upload a crop photo, type a question, or speak in Bengali.<br />
                The bot will help identify diseases and suggest remedies.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className={`chip chip-${s.tone}`}
                    onClick={() => handleSend({ text: s.label })}
                    disabled={loading}
                  >
                    <span className="chip-emoji" aria-hidden>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => <ChatMessage key={m.id} {...m} />)}
              {loading && (
                <div className="msg assistant loading-msg">
                  <SelfDrawingPlant />
                  <span className="loading-text">Analyzing…</span>
                </div>
              )}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        <InputBar
          disabled={loading}
          onSend={handleSend}
          onRecordToggle={handleRecordToggle}
          recording={recorder.recording}
        />
      </main>

      {pending && (
        <VoiceConfirm
          initialText={pending.text}
          lowConfidence={pending.lowConf}
          language={pending.language}
          onSend={(text) => { setPending(null); handleSend({ text }); }}
          onRetry={() => { setPending(null); startRecording(); }}
          onClose={() => setPending(null)}
        />
      )}

      {showHelpline && (
        <HelplineModal onClose={() => setShowHelpline(false)} />
      )}
    </div>
  );
}