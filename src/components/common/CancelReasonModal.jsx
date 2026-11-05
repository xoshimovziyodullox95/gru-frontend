/* ============================================================
   CANCEL REASON MODAL — "Bekor qilasizmi?" + sabab tanlash
   Taxi ilovalaridagi kabi: avval tasdiqlash, keyin sabab (tayyor
   variantlar + "Boshqa sabab" — o'zi yozadi).
   ============================================================ */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import '../../styles/requestTracker.css';

const OTHER = '__other__';

export default function CancelReasonModal({ isOpen, role, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [customText, setCustomText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const REASONS = role === 'provider'
    ? [
        t('cancelReason.pro1', 'Band bo‘lib qoldim'),
        t('cancelReason.pro2', 'Manzil juda uzoq'),
        t('cancelReason.pro3', 'Narx kelishilmadi'),
        t('cancelReason.pro4', 'Mijoz bilan bog‘lanib bo‘lmadi'),
        t('cancelReason.pro5', 'Kerakli asbob-jihoz yo‘q'),
        t('cancelReason.pro6', 'Bu ish mening sohamga to‘g‘ri kelmaydi'),
      ]
    : [
        t('cancelReason.cl1', 'Narx juda qimmat'),
        t('cancelReason.cl2', 'Boshqa usta topdim'),
        t('cancelReason.cl3', 'Fikrimni o‘zgartirdim'),
        t('cancelReason.cl4', 'Juda uzoq kuttirdi'),
        t('cancelReason.cl5', 'Muammo o‘z-o‘zidan hal bo‘ldi'),
        t('cancelReason.cl6', 'Usta bilan bog‘lanib bo‘lmadi'),
      ];

  const reset = () => { setSelected(null); setCustomText(''); };
  const handleClose = () => { reset(); onClose?.(); };

  const canSubmit = selected && (selected !== OTHER || customText.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    const reason = selected === OTHER ? customText.trim() : selected;
    setSubmitting(true);
    try {
      await onConfirm?.(reason);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rt-overlay" onClick={handleClose}>
      <div className="rt-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="rt-panel rt-panel--plain">
          <span className="rt-grabber" aria-hidden="true" />

          <div className="rt-status">
            <span className="rt-status__eyebrow">{t('cancelReason.eyebrow', 'Diqqat')}</span>
            <h2 className="rt-status__title">{t('cancelReason.title', 'Rostdan ham bekor qilasizmi?')}</h2>
            <p className="rt-status__sub">{t('cancelReason.sub', 'Sababini tanlang — bu boshqa tomonga ko‘rsatiladi')}</p>
          </div>

          <button type="button" className="rt-map__close" onClick={handleClose} aria-label={t('common.close', 'Yopish')}>
            <X size={20} />
          </button>

          <div className="rt-content">
            <div className="rt-reason-list">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`rt-reason-item ${selected === r ? 'is-selected' : ''}`}
                  onClick={() => setSelected(r)}
                >
                  {r}
                </button>
              ))}
              <button
                type="button"
                className={`rt-reason-item ${selected === OTHER ? 'is-selected' : ''}`}
                onClick={() => setSelected(OTHER)}
              >
                {t('cancelReason.other', 'Boshqa sabab')}
              </button>
              {selected === OTHER && (
                <textarea
                  className="rt-reason-custom"
                  value={customText}
                  maxLength={300}
                  autoFocus
                  placeholder={t('cancelReason.customPlaceholder', 'Sababingizni yozing...')}
                  onChange={(e) => setCustomText(e.target.value)}
                />
              )}
            </div>
          </div>

          <footer className="rt-foot rt-foot--row">
            <button type="button" className="rt-btn rt-btn--ghost" onClick={handleClose}>
              {t('cancelReason.keep', 'Yo‘q, qolsin')}
            </button>
            <button type="button" className="rt-btn rt-btn--primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {t('cancelReason.confirm', 'Bekor qilish')}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
