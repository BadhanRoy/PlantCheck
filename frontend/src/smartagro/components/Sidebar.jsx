import { useCallback, useEffect, useState } from 'react';
import { fetchHealth } from '../api.js';

const Icon = ({ children, size = 20, className = '' }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const LeafIcon = (props) => (
  <Icon {...props}>
    <path d="M11 20A7 7 0 0 1 4 13V6a2 2 0 0 1 2-2h7a7 7 0 0 1 7 7v1a5 5 0 0 1-5 5h-4z" />
    <path d="M11 20v-5" />
    <path d="M8 11c2 0 4-1 5-3" />
  </Icon>
);

const PlusIcon = (props) => (
  <Icon {...props} size={16}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

const SpeakerIcon = (props) => (
  <Icon {...props} size={18}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </Icon>
);

const PulseIcon = (props) => (
  <Icon {...props} size={16}>
    <path d="M3 12h4l2-7 4 14 2-7h6" />
  </Icon>
);

const ShieldIcon = (props) => (
  <Icon {...props} size={16}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

const InfoIcon = (props) => (
  <Icon {...props} size={14}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Icon>
);

const PhoneIcon = (props) => (
  <Icon {...props} size={18}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
             19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67
             A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81
             a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27
             a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>
  </Icon>
);

export default function Sidebar({
  voiceEnabled,
  onToggleVoice,
  onClear,
  onOpenHelpline,
}) {
  const [ffmpeg, setFfmpeg] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const h = await fetchHealth();
      setFfmpeg(h.ffmpeg_available);
    } catch {
      setFfmpeg(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const statusInfo = (() => {
    if (checking) return { tone: 'muted', label: 'Connecting', value: 'Checking server…' };
    if (ffmpeg === true) return { tone: 'ok', label: 'Voice quality', value: 'Enhancement active' };
    if (ffmpeg === false) return { tone: 'warn', label: 'Voice quality', value: 'Limited · ffmpeg missing' };
    return { tone: 'warn', label: 'Server', value: 'Not reachable' };
  })();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden>
          <LeafIcon size={22} />
        </div>
        <div className="brand-text">
          <h1>SmartAgro</h1>
          <span className="brand-tag">Bot · v2.2</span>
        </div>
      </div>

      <button className="sidebar-primary" onClick={onClear} type="button">
        <PlusIcon />
        <span>New conversation</span>
      </button>

      {/* ─── Helpline section ─── */}
      <div className="sidebar-section">
        <div className="section-label">
          <span className="dot" aria-hidden />
          কৃষি সহায়তা
        </div>

        <button
          type="button"
          className="sidebar-helpline"
          onClick={onOpenHelpline}
        >
          <span className="sidebar-helpline-icon" aria-hidden>
            <PhoneIcon />
          </span>
          <span className="sidebar-helpline-text">
            <span className="sidebar-helpline-title">কৃষি হেল্পলাইন</span>
            <span className="sidebar-helpline-sub">বিশেষজ্ঞের পরামর্শ</span>
          </span>
          <span className="sidebar-helpline-badge">৪টি</span>
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-label">
          <span className="dot" aria-hidden />
          Preferences
        </div>

        <label className={`toggle ${voiceEnabled ? 'is-on' : ''}`}>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => onToggleVoice(e.target.checked)}
          />
          <span className="toggle-icon-wrap" aria-hidden>
            <SpeakerIcon />
          </span>
          <span className="toggle-content">
            <span className="toggle-title">Voice replies</span>
            <span className="toggle-sub">Read answers aloud</span>
          </span>
          <span className="toggle-slider" aria-hidden />
        </label>
      </div>

      <div className="sidebar-section">
        <div className="section-label">
          <span className="dot" aria-hidden />
          System
        </div>

        <div className={`status-card ${statusInfo.tone}`}>
          <span className="status-icon-wrap" aria-hidden>
            {statusInfo.tone === 'ok' ? <ShieldIcon /> : <PulseIcon />}
          </span>
          <span className="status-text">
            <span className="label">{statusInfo.label}</span>
            <span className="value">{statusInfo.value}</span>
          </span>
          <span className="status-dot" aria-hidden />
        </div>
      </div>

      <div className="sidebar-footer">
        <InfoIcon />
        <span>AI-generated advice. Verify with your local agriculture officer before use.</span>
      </div>
    </aside>
  );
}