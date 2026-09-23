import { useEffect, useRef, useState } from 'react';

const LANG_LABELS = {
  bn: 'বাংলা (Bengali)',
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  ur: 'اردو (Urdu)',
  ar: 'العربية (Arabic)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  ko: '한국어 (Korean)',
};

function languageLabel(code) {
  if (!code) return null;
  if (LANG_LABELS[code]) return LANG_LABELS[code];
  if (typeof code === 'string' && code.length <= 8) {
    return `${code} (unrecognized)`;
  }
  return 'Unknown';
}

export default function VoiceConfirm({
  initialText,
  lowConfidence,
  language,
  onSend,
  onRetry,
  onClose,
}) {
  const [text, setText] = useState(initialText || '');
  const textareaRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setText(initialText || ''), [initialText]);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) onSend(text.trim());
    }
  };

  const langLabel = languageLabel(language);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-modal-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Cancel"
          title="Cancel (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <h3 id="voice-modal-title">
          {lowConfidence
            ? "🎙️ Not sure — please check the text"
            : "🎙️ Here's what I heard"}
        </h3>

        {langLabel && (
          <div className="lang-badge">
            <span className="lang-dot" aria-hidden />
            <span>
              Detected language: <strong>{langLabel}</strong>
            </span>
          </div>
        )}

        <p className="hint">
          Edit if needed, then send with <kbd>Ctrl</kbd>+<kbd>Enter</kbd>.
          Press <kbd>Esc</kbd> to cancel.
        </p>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          spellCheck={false}
        />

        <div className="row">
          <button
            type="button"
            className="primary"
            onClick={() => onSend(text.trim())}
            disabled={!text.trim()}
          >
            ✅ Send
          </button>
          <button type="button" className="ghost" onClick={onRetry}>
            🔁 Speak again
          </button>
          <button type="button" className="ghost cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}