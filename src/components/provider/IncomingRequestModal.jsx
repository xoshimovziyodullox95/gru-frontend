/* ============================================================
   INCOMING REQUEST MODAL
   Usta uchun yangi so'rov: tepada mijoz manzili xaritada,
   pastda so'rov tafsilotlari. 30 soniyadan keyin o'zi yopiladi.
   ============================================================ */

import { lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Clock, Navigation, MapPin } from 'lucide-react';

// Xarita (Leaflet) og'ir — faqat oyna ochilganda yuklanadi
const RequestMap = lazy(() => import('../common/RequestMap'));
import { serviceLabel, timeAgo } from '../utils/i18nHelpers';
import '../../styles/requestTracker.css';

const AUTO_CLOSE_MS = 30000;


export default function IncomingRequestModal({
  isOpen,
  request,
  onClose,
  onReject,
  onView,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => onClose?.(), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  const { _id, category, description, location, createdAt, distanceKm } = request;

  const handleView = () => {
    onClose?.();
    if (onView) onView(request);
    else navigate(`/provider-requests/${_id}`);
  };

  const handleReject = () => {
    onReject?.(request);
    onClose?.();
  };

  return (
    <div className="rt-overlay" onClick={onClose}>
      <div className="rt-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="rt-map">
          <Suspense fallback={<div style={{ height: 140 }} />}>
            <RequestMap lat={location?.lat} lng={location?.lng} height={140} />
          </Suspense>
          <button type="button" className="rt-map__close" onClick={onClose} aria-label={t('common.close', 'Yopish')}>
            <X size={20} />
          </button>
        </div>

        <div className="rt-panel">
          <span className="rt-grabber" aria-hidden="true" />

          <div className="rt-status">
            <span className="rt-status__eyebrow">{t('incomingRequest.eyebrow', 'Yangi so‘rov')}</span>
            <h2 className="rt-status__title">{serviceLabel(category)}</h2>
            {/* Oyna avtomatik yopilishigacha qolgan vaqt */}
            <div className="rt-line rt-line--drain" style={{ animationDuration: `${AUTO_CLOSE_MS}ms` }}>
              <span style={{ animationDuration: `${AUTO_CLOSE_MS}ms` }} />
            </div>
          </div>

          <div className="rt-content">
            {description && <p className="rt-desc">{description}</p>}

            <ul className="rt-facts">
              {location?.address && (
                <li><MapPin size={16} /><span>{location.address}</span></li>
              )}
              {typeof distanceKm === 'number' && (
                <li><Navigation size={16} /><span>{t('common.kmAway', '{{km}} km uzoqlikda', { km: distanceKm.toFixed(1) })}</span></li>
              )}
              <li><Clock size={16} /><span>{timeAgo(createdAt)}</span></li>
            </ul>
          </div>

          <footer className="rt-foot">
            <button type="button" className="rt-btn rt-btn--primary" onClick={handleView}>
              {t('incomingRequest.offer', 'Taklif berish')}
            </button>
            <button type="button" className="rt-btn rt-btn--text" onClick={handleReject}>
              {t('incomingRequest.skip', 'O‘tkazib yuborish')}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
