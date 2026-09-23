import { useState } from 'react';

const CONFIG = {
  high:   { tone: 'high',   icon: '✅', fallback: 'নিশ্চিত তথ্য' },
  medium: { tone: 'medium', icon: '⚠️', fallback: 'সম্ভাব্য তথ্য' },
  low:    { tone: 'low',    icon: '⚠️', fallback: 'অনুমান' },
  none:   { tone: 'none',   icon: '❓', fallback: 'তথ্য নেই' },
};

function clamp01(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  return Math.min(1, Math.max(0, n));
}

function coerceScore(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceChunks(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return 0;
}

function toStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => x != null && typeof x !== 'object')
    .map((x) => String(x))
    .filter((s) => s.length > 0);
}

export default function TrustBadge({ meta }) {
  const [open, setOpen] = useState(false);

  // Full defensive extraction
  const safeMeta = meta && typeof meta === 'object' ? meta : {};
  const level = ['high', 'medium', 'low', 'none'].includes(safeMeta.confidence)
    ? safeMeta.confidence
    : 'medium';
  const cfg = CONFIG[level] || CONFIG.medium;

  const label =
    typeof safeMeta.confidence_label === 'string' && safeMeta.confidence_label
      ? safeMeta.confidence_label
      : `${cfg.icon} ${cfg.fallback}`;

  const reason =
    typeof safeMeta.confidence_reason === 'string'
      ? safeMeta.confidence_reason
      : '';

  const score = coerceScore(safeMeta.best_match_score);
  const chunks = coerceChunks(safeMeta.matched_chunks);
  const crops = toStringArray(safeMeta.matched_crops);
  const warnings = toStringArray(safeMeta.uncertainty_reasons);

  const hasDetails =
    Boolean(reason) ||
    warnings.length > 0 ||
    crops.length > 0 ||
    score !== null ||
    chunks > 0;

  const similarity = score !== null ? clamp01(1 - score) : null;

  return (
    <div className={`trust-badge trust-${cfg.tone}`}>
      <div className="trust-row">
        <span className="trust-icon" aria-hidden>{cfg.icon}</span>
        <div className="trust-text">
          <span className="trust-label">{label}</span>
          {reason && <span className="trust-reason">{reason}</span>}
        </div>
        {hasDetails && (
          <button
            type="button"
            className="trust-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Hide details' : 'Show details'}
          >
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>

      {open && hasDetails && (
        <div className="trust-details">
          {crops.length > 0 && (
            <div className="trust-detail-line">
              <span className="trust-detail-key">📚 সোর্স:</span>
              <span className="trust-detail-val">{crops.join(', ')}</span>
            </div>
          )}

          {similarity !== null && (
            <div className="trust-detail-line">
              <span className="trust-detail-key">📊 মিল:</span>
              <span className="trust-detail-val">
                {similarity.toFixed(2)} / 1.00
                {score !== null && score < 0.35 && ' (চমৎকার)'}
                {score !== null && score >= 0.35 && score < 0.55 && ' (মাঝারি)'}
                {score !== null && score >= 0.55 && ' (দুর্বল)'}
              </span>
            </div>
          )}

          {chunks > 0 && (
            <div className="trust-detail-line">
              <span className="trust-detail-key">📖 প্রসঙ্গ:</span>
              <span className="trust-detail-val">
                {chunks}টি অংশ পাওয়া গেছে
              </span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="trust-detail-line trust-detail-warn">
              <span className="trust-detail-key">⚠️ সতর্কতা:</span>
              <span className="trust-detail-val">
                {warnings.map((w, i) => (
                  <span key={i} className="trust-warn-item">• {w}</span>
                ))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}