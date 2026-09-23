import { useEffect, useRef, useState } from 'react';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const PaperclipIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const MicIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M5 10v2a7 7 0 0 0 14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

const StopIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);

const SendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4 20-7z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

export default function InputBar({ disabled, onSend, onRecordToggle, recording }) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    onSend({ text: text.trim(), imageFile });
    setText('');
    setImageFile(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG/PNG images are supported.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image size must be at most 8 MB.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setError('');
    setImageFile(file);
  };

  const canSend = !disabled && (text.trim() || imageFile);

  return (
    <form className="input-bar" onSubmit={submit}>
      {error && <div className="inline-error" role="alert">⚠️ {error}</div>}
      {previewUrl && (
        <div className="attach-preview">
          <img src={previewUrl} alt="Attachment preview" />
          <button type="button" onClick={() => setImageFile(null)} aria-label="Remove image">✕</button>
        </div>
      )}

      <div className="input-pill">
        <input
          type="text"
          maxLength={2000}
          placeholder="Ask about a crop disease, or describe what you see…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />

        <label className="icon-btn-sm" title="Attach image" aria-label="Attach image">
          <PaperclipIcon />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={onPickFile}
            hidden
            disabled={disabled}
          />
        </label>

        <button
          type="button"
          className={`icon-btn-sm ${recording ? 'recording' : ''}`}
          onClick={onRecordToggle}
          disabled={disabled}
          title={recording ? 'Stop recording' : 'Record voice'}
          aria-label={recording ? 'Stop recording' : 'Record voice'}
        >
          {recording ? <StopIcon /> : <MicIcon />}
        </button>

        <button
          type="submit"
          className="send-btn"
          disabled={!canSend}
          aria-label="Send message"
        >
          <span className="send-btn-label">Send</span>
          <SendIcon />
        </button>
      </div>
    </form>
  );
}