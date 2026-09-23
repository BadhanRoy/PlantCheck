export default function ChatMessage({ role, text, imageUrl, meta, audioUrl }) {
  const verified = meta?.verified;
  const sources = meta?.sources || [];

  return (
    <div className={`msg ${role}`}>
      {imageUrl && (
        <div className="msg-image-wrap">
          <img className="msg-img" src={imageUrl} alt="Attached crop photo" />
        </div>
      )}

      {role === 'assistant' && meta && (
        verified ? (
          <div className="badge success">
            <span className="badge-icon" aria-hidden>✓</span>
            <span>
              Verified from agricultural knowledge base
              {sources.length ? ` · ${sources.join(', ')}` : ''}
            </span>
          </div>
        ) : (
          <div className="badge warning">
            <span className="badge-icon" aria-hidden>!</span>
            <span>
              Specific info not found in the verified database. Please verify with an agriculture officer before use.
            </span>
          </div>
        )
      )}

      {text && <div className="msg-text">{text}</div>}

      {audioUrl && (
        <audio
          className="msg-audio"
          controls
          controlsList="nodownload"
          src={audioUrl}
        />
      )}
    </div>
  );
}