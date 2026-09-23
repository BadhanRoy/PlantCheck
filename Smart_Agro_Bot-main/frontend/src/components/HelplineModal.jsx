import { useEffect, useState } from 'react';

const HELPLINES = [
  {
    id: 'ais-16123',
    name: 'কৃষি কল সেন্টার',
    nameEn: 'Agriculture Call Center (AIS)',
    number: '16123',
    numberDisplay: '১৬১২৩',
    dialNumber: '16123',
    copyNumber: '16123',
    whatsapp: null,
    hours: 'সকাল ৮টা – রাত ৮টা',
    hoursNote: 'শুক্র, শনি ও সরকারি ছুটির দিন বন্ধ',
    cost: '২৫ পয়সা / মিনিট',
    features: [
      'ফসল, মৎস্য ও প্রাণিসম্পদ',
      'রোগ-বালাই, পোকা দমন',
      'সার, বীজ, কীটনাশক পরামর্শ',
      'কৃষি বিশেষজ্ঞের সাথে সরাসরি কথা',
    ],
    primary: true,
  },
  {
    id: 'brri-dhan',
    name: 'ধান হেল্পলাইন',
    nameEn: 'BRRI Rice Helpline',
    number: '09644300300',
    numberDisplay: '০৯৬৪৪৩০০৩০০',
    dialNumber: '09644300300',
    copyNumber: '09644300300',
    whatsapp: '8809644300300',
    hours: '২৪ ঘণ্টা খোলা',
    hoursNote: 'প্রতিদিন, সাপ্তাহিক ছুটিও',
    cost: 'টোল-ফ্রি',
    features: [
      'ধান চাষের যেকোনো সমস্যা',
      'সার, আগাছা, সেচ ব্যবস্থাপনা',
      'রোগবালাই ও পোকা দমন',
      'বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI)',
    ],
  },
  {
    id: 'krishak-bondhu',
    name: 'কৃষকবন্ধু ফোনসেবা',
    nameEn: 'Krishak Bondhu Phone Service',
    number: '3331',
    numberDisplay: '৩৩৩১',
    dialNumber: '3331',
    copyNumber: '3331',
    whatsapp: null,
    hours: '২৪ ঘণ্টা খোলা',
    hoursNote: 'প্রতিদিন',
    cost: 'টোল-ফ্রি',
    features: [
      'কৃষি বিষয়ক যেকোনো পরামর্শ',
      'সরকারি কৃষি সেবা তথ্য',
      'অভিযোগ ও পরামর্শ',
    ],
  },
  {
    id: 'national-333',
    name: 'জাতীয় তথ্য ও সেবা',
    nameEn: 'National Information Service',
    number: '333',
    numberDisplay: '৩৩৩',
    dialNumber: '333',
    copyNumber: '333',
    whatsapp: null,
    hours: '২৪ ঘণ্টা খোলা',
    hoursNote: 'প্রতিদিন',
    cost: 'টোল-ফ্রি',
    features: [
      'সরকারি যেকোনো সেবার তথ্য',
      'অভিযোগ দাখিল',
      'কৃষি তথ্যও পাওয়া যায়',
    ],
  },
];

/**
 * Detect whether we should show the "Call" button (tel: works only on
 * phones that have a native dialer). Tablets, laptops, and desktops
 * get the "Copy" button + WhatsApp fallback instead.
 */
function hasNativeDialer() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Phones only — exclude iPad/Tablets
  const isPhone =
    /iPhone|iPod|Windows Phone|BlackBerry|BB10|Opera Mini|IEMobile/i.test(ua) ||
    (/Android/i.test(ua) && /Mobile/i.test(ua)); // Android phone, not tablet
  return isPhone;
}

// ─── Icons ───
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
             19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67
             A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81
             a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27
             a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CoinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v12M9 8h4.5a2.5 2.5 0 0 1 0 5H9h5a2.5 2.5 0 0 1 0 5H9"/>
  </svg>
);

const SmallCheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="3"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Clipboard helper ───
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function HelplineCard({ line, canDial }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(line.copyNumber);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const whatsappUrl = line.whatsapp
    ? `https://wa.me/${line.whatsapp}?text=${encodeURIComponent(
        'আসসালামু আলাইকুম, আমি কৃষি বিষয়ে পরামর্শ চাই।',
      )}`
    : null;

  return (
    <div className={`helpline-card ${line.primary ? 'is-primary' : ''}`}>
      {line.primary && (
        <div className="helpline-primary-badge">⭐ সবচেয়ে বেশি ব্যবহৃত</div>
      )}

      <div className="helpline-card-top">
        <div className="helpline-card-titles">
          <h4>{line.name}</h4>
          <p className="helpline-name-en">{line.nameEn}</p>
        </div>
      </div>

      <div className="helpline-action-row">
        <div className="helpline-number-block">
          <span className="helpline-number-text">{line.numberDisplay}</span>
          <span className="helpline-number-raw">{line.number}</span>
        </div>

        {canDial ? (
          <a
            href={`tel:${line.dialNumber}`}
            className="helpline-action-btn helpline-call-btn"
            aria-label={`Call ${line.number}`}
          >
            <PhoneIcon />
            <span>Call</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={handleCopy}
            className={`helpline-action-btn helpline-copy-btn ${copied ? 'is-copied' : ''}`}
            aria-label={`Copy ${line.number}`}
          >
            {copied ? (
              <>
                <CheckIcon />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {!canDial && whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="helpline-secondary-action"
        >
          <WhatsAppIcon />
          <span>WhatsApp-এ মেসেজ পাঠান</span>
        </a>
      )}

      <div className="helpline-meta">
        <span className="helpline-meta-item">
          <ClockIcon />
          <span>{line.hours}</span>
        </span>
        <span className="helpline-meta-item">
          <CoinIcon />
          <span>{line.cost}</span>
        </span>
      </div>

      {line.hoursNote && (
        <div className="helpline-hours-note">{line.hoursNote}</div>
      )}

      <ul className="helpline-features">
        {line.features.map((f, i) => (
          <li key={i}>
            <span className="helpline-feature-check" aria-hidden>
              <SmallCheckIcon />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HelplineModal({ onClose }) {
  const [canDial, setCanDial] = useState(() => hasNativeDialer());

  useEffect(() => {
    const onResize = () => setCanDial(hasNativeDialer());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal helpline-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpline-modal-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
          title="Close (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="helpline-header">
          <div className="helpline-header-icon" aria-hidden>
            <PhoneIcon />
          </div>
          <div>
            <h3 id="helpline-modal-title">📞 কৃষি হেল্পলাইন</h3>
            <p className="helpline-sub">
              {canDial
                ? 'Call বাটনে চাপলে সরাসরি ডায়াল হবে'
                : 'নম্বর কপি করে ফোন থেকে ডায়াল করুন'}
            </p>
          </div>
        </div>

        {!canDial && (
          <div className="helpline-laptop-tip">
            <span aria-hidden>💻</span>
            <span>
              এই ডিভাইস থেকে সরাসরি কল করা যায় না। নম্বর <strong>Copy</strong>{' '}
              করে মোবাইলে ডায়াল করুন, অথবা <strong>WhatsApp</strong> /
              <strong>Skype</strong>-এ কল করুন।
            </span>
          </div>
        )}

        <div className="helpline-list">
          {HELPLINES.map((line) => (
            <HelplineCard key={line.id} line={line} canDial={canDial} />
          ))}
        </div>

        <div className="helpline-tip">
          <span className="helpline-tip-icon" aria-hidden>💡</span>
          <span>
            কল করার আগে ছবি ও প্রশ্ন প্রস্তুত রাখলে দ্রুত সাহায্য পাবেন।
          </span>
        </div>
      </div>
    </div>
  );
}