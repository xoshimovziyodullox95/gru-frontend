/* ============================================================
   INCOMING OFFER MODAL — Client uchun
   Usta taklif berganda (mijoz boshqa sahifada turganda) chiqadi.
   Ko'rinishi RequestTrackerModal bilan bir xil (rt-* uslublari).
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Star, Loader2 } from 'lucide-react';

import { serviceLabel, formatSum } from '../utils/i18nHelpers';
import '../../styles/requestTracker.css';

export default function IncomingOfferModal({
  isOpen,
  offer,
  request,
  onClose,
  onAccept,
  onView,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [accepting, setAccepting] = useState(false);

  if (!isOpen || !offer) return null;

  const provider = offer.provider || {};
  const name = provider.name || t('activeOrder.pro', 'Usta');

  const handleView = () => {
    onClose?.();
    if (onView) onView(offer);
    else if (request?._id) navigate(`/requests/${request._id}`);
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept?.(offer);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="rt-overlay" onClick={onClose}>
      <div className="rt-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="rt-panel rt-panel--plain">
          <span className="rt-grabber" aria-hidden="true" />

          <div className="rt-status">
            <span className="rt-status__eyebrow">{t('incomingOffer.eyebrow', 'Yangi taklif')}</span>
            <h2 className="rt-status__title">{name}</h2>
            {request?.category && <p className="rt-status__sub">{serviceLabel(request.category)}</p>}
          </div>

          <button type="button" className="rt-map__close" onClick={onClose} aria-label={t('common.close', 'Yopish')}>
            <X size={20} />
          </button>

          <div className="rt-content">
            <div className="rt-row is-active" role="presentation">
              <span className="rt-avatar rt-avatar--letter" style={{ width: 42, height: 42 }}>
                {name.trim()[0]?.toUpperCase() || 'U'}
              </span>
              <span className="rt-row__who">
                <strong>{name}</strong>
                <span className="rt-row__meta">
                  {provider.ratingsCount > 0 ? (
                    <span className="rt-rating">
                      <Star size={12} /> {Number(provider.averageRating).toFixed(1)}
                      <em>({provider.ratingsCount})</em>
                    </span>
                  ) : (
                    <span className="rt-rating rt-rating--new">{t('common.new', 'yangi')}</span>
                  )}
                  <span>· {offer.arrivalMinutes || 30} {t('common.min', 'daq')}</span>
                </span>
                {offer.message && <span className="rt-row__msg">{offer.message}</span>}
              </span>
              <span className="rt-row__price">
                {formatSum(offer.price)}
                <small>{t('common.sum', 'so‘m')}</small>
              </span>
            </div>
          </div>

          <footer className="rt-foot">
            <button type="button" className="rt-btn rt-btn--primary" onClick={handleAccept} disabled={accepting}>
              {accepting ? <Loader2 size={18} className="rt-spin" /> : null}
              {t('incomingOffer.choose', 'Tanlash · {{price}} so‘m', { price: formatSum(offer.price) })}
            </button>
            <button type="button" className="rt-btn rt-btn--text" onClick={handleView}>
              {t('incomingOffer.all', 'Barcha takliflarni ko‘rish')}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
