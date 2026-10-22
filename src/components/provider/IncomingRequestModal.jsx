/* ============================================================
   INCOMING REQUEST MODAL
   Usta uchun yangi so'rov: tepada mijoz manzili xaritada,
   pastda so'rov tafsilotlari. 30 soniyadan keyin o'zi yopiladi.
   ============================================================ */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Navigation, MapPin } from 'lucide-react';

import RequestMap from '../common/RequestMap';
import '../../styles/requestTracker.css';

const AUTO_CLOSE_MS = 30000;

function timeAgo(date) {
  if (!date) return 'hozir';
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1) return 'hozir';
  if (diff < 60) return `${diff} daqiqa oldin`;
  if (diff < 1440) return `${Math.floor(diff / 60)} soat oldin`;
  return `${Math.floor(diff / 1440)} kun oldin`;
}

export default function IncomingRequestModal({
  isOpen,
  request,
  onClose,
  onReject,
  onView,
}) {
  const navigate = useNavigate();

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
          <RequestMap lat={location?.lat} lng={location?.lng} height={140} />
          <button type="button" className="rt-map__close" onClick={onClose} aria-label="Yopish">
            <X size={20} />
          </button>
        </div>

        <div className="rt-panel">
          <span className="rt-grabber" aria-hidden="true" />

          <div className="rt-status">
            <span className="rt-status__eyebrow">Yangi so‘rov</span>
            <h2 className="rt-status__title">{category || 'Xizmat'}</h2>
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
                <li><Navigation size={16} /><span>{distanceKm.toFixed(1)} km uzoqlikda</span></li>
              )}
              <li><Clock size={16} /><span>{timeAgo(createdAt)}</span></li>
            </ul>
          </div>

          <footer className="rt-foot">
            <button type="button" className="rt-btn rt-btn--primary" onClick={handleView}>
              Taklif berish
            </button>
            <button type="button" className="rt-btn rt-btn--text" onClick={handleReject}>
              O‘tkazib yuborish
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
