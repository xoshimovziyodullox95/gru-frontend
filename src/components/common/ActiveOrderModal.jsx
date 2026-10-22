/* ============================================================
   ACTIVE ORDER MODAL
   Status bo'yicha turli ko'rinish + Timer
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  X, Star, Phone, MessageCircle, MapPin, Clock,
  Navigation, Wrench, CheckCircle2, AlertCircle,
  Loader2, Wallet, Radar, Users,
} from 'lucide-react';

import {
  updateRequestStatus,
  acceptServiceRequestOffer,
} from '../services/serviceRequests';

import '../../styles/activeOrderModal.css';

/* ============================================================
   STATUS LABELS
   ============================================================ */

const STATUS_LABELS = {
  open: 'Usta qidirilmoqda',
  accepted: 'Usta tayinlandi',
  on_way: "Usta yo'lda",
  arrived: 'Usta yetib keldi',
  in_progress: 'Ish bajarilmoqda',
  completed: 'Bajarildi',
  cancelled: 'Bekor qilindi',
};

const PROVIDER_ACTIONS = {
  accepted: { label: "Yo'ldaman", next: 'on_way', icon: Navigation, color: '#ff8a2a' },
  on_way: { label: 'Yetib keldim', next: 'arrived', icon: MapPin, color: '#2196f3' },
  arrived: { label: 'Ishni boshlash', next: 'in_progress', icon: Wrench, color: '#7c4dff' },
  in_progress: { label: 'Ishni tugatdim', next: 'completed', icon: CheckCircle2, color: '#00c853' },
};

/* ============================================================
   TIMER SUB-COMPONENT
   ============================================================ */

function ClientSearchTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return undefined;

    const update = () => {
      const diff = Math.max(0, new Date(expiresAt) - Date.now());
      setRemaining(Math.floor(diff / 1000));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || remaining <= 0) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="aom-timer">
      <Clock size={14} />
      <span>
        {minutes}:{String(seconds).padStart(2, '0')} qoldi
      </span>
    </div>
  );
}

/* ============================================================
   MODAL
   ============================================================ */

export default function ActiveOrderModal({
  isOpen,
  order,
  onClose,
  onUpdate,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const isClient = order.viewer === 'client';
  const isProvider = order.viewer === 'provider';

  const acceptedOffer = (order.offers || []).find(
    (o) => String(o._id) === String(order.acceptedOfferId)
  );

  /* HANDLERS */

  const handleStatusChange = async (nextStatus) => {
    setLoading(true);
    try {
      await updateRequestStatus(order._id, nextStatus);
      toast.success('Status yangilandi', { toastId: `status-${order._id}` });
      onUpdate?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik', {
        toastId: `status-error-${order._id}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone) => {
    if (!phone) {
      toast.info("Telefon raqami yo'q", { toastId: 'no-phone' });
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleChat = () => {
    onClose?.();
    navigate('/chat');
  };

  const handleCancel = async () => {
    const reason = window.prompt('Bekor qilish sababini yozing:');
    if (!reason) return;

    setLoading(true);
    try {
      await updateRequestStatus(order._id, 'cancelled', reason);
      toast.info('Bekor qilindi', { toastId: `cancel-${order._id}` });
      onUpdate?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "Bekor qilib bo'lmadi", {
        toastId: `cancel-error-${order._id}`,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     CLIENT VIEW
     ============================================================ */

  const renderClientView = () => {
    /* 🅰️ STATUS: OPEN */
    if (order.status === 'open') {
      return (
        <>
          <div className="aom-searching">
            <div className="aom-searching__radar">
              <span className="aom-searching__ring aom-searching__ring--1" />
              <span className="aom-searching__ring aom-searching__ring--2" />
              <span className="aom-searching__ring aom-searching__ring--3" />
              <div className="aom-searching__center">
                <Radar size={28} strokeWidth={2} />
              </div>
            </div>

            <h3 className="aom-searching__title">
              Usta qidirilmoqda
              <span className="aom-searching__dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </h3>

            <p className="aom-searching__sub">
              Yaqin atrofdagi ustalarga xabar yuborildi
            </p>

            {/* ✅ Timer */}
            <ClientSearchTimer expiresAt={order.expiresAt} />
          </div>

          <div className="aom-info-grid">
            <div className="aom-info-card">
              <span className="aom-info-card__icon aom-info-card__icon--blue">
                <Users size={16} />
              </span>
              <div className="aom-info-card__text">
                <strong>{order.notifiedCount || 0}</strong>
                <small>ta ustaga yuborildi</small>
              </div>
            </div>

            <div className="aom-info-card">
              <span className="aom-info-card__icon aom-info-card__icon--orange">
                <Clock size={16} />
              </span>
              <div className="aom-info-card__text">
                <strong>1-2 daqiqa</strong>
                <small>o'rtacha kutish</small>
              </div>
            </div>
          </div>

          {order.location?.address && (
            <div className="aom-address">
              <MapPin size={16} />
              <span>{order.location.address}</span>
            </div>
          )}

          <div className="aom-hint">
            <AlertCircle size={14} />
            <span>Sahifani yopmang — ustalar javob beradi</span>
          </div>

          <button
            type="button"
            className="aom-btn aom-btn--cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            <X size={16} />
            So'rovni bekor qilish
          </button>
        </>
      );
    }

    /* 🅱️ STATUS: ACCEPTED+ */
    const provider = acceptedOffer?.provider || {};
    const price = acceptedOffer?.price || 0;
    const arrivalMinutes =
      acceptedOffer?.arrivalMinutes || order.arrivalMinutes || 30;

    return (
      <>
        <div className="aom-master">
          <div className="aom-master__avatar">
            {provider.image ? (
              <img src={provider.image} alt={provider.name || 'Usta'} />
            ) : (
              <span>{provider.name?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>

          <div className="aom-master__info">
            <strong>{provider.name || 'Usta'}</strong>

            {provider.company && (
              <span className="aom-master__company">{provider.company}</span>
            )}

            {provider.ratingsCount > 0 ? (
              <span className="aom-master__rating">
                <Star size={11} fill="#fbbf24" stroke="#fbbf24" />
                {provider.averageRating}
                <em>({provider.ratingsCount})</em>
              </span>
            ) : (
              <span className="aom-master__new">Yangi usta</span>
            )}
          </div>
        </div>

        {price > 0 && (
          <div className="aom-price">
            <Wallet size={18} />
            <div className="aom-price__text">
              <em>Kelishilgan narx</em>
              <strong>
                {Number(price).toLocaleString('uz-UZ')}
                <small>so'm</small>
              </strong>
            </div>
          </div>
        )}

        {['accepted', 'on_way', 'arrived'].includes(order.status) && (
          <div className="aom-arrival">
            <Clock size={20} />
            <div className="aom-arrival__text">
              <em>Taxminiy kelish vaqti</em>
              <strong>{arrivalMinutes} daqiqa ichida</strong>
            </div>
          </div>
        )}

        {order.location?.address && (
          <div className="aom-address">
            <MapPin size={16} />
            <span>{order.location.address}</span>
          </div>
        )}

        <div className="aom-actions aom-actions--client">
          <button
            type="button"
            className="aom-btn aom-btn--call"
            onClick={() => handleCall(provider.phone)}
          >
            <Phone size={18} />
            Qo'ng'iroq
          </button>

          <button
            type="button"
            className="aom-btn aom-btn--chat"
            onClick={handleChat}
          >
            <MessageCircle size={18} />
            Chat
          </button>
        </div>
      </>
    );
  };

  /* ============================================================
     PROVIDER VIEW
     ============================================================ */

  const renderProviderView = () => {
    const client = order.client || {};
    const action = PROVIDER_ACTIONS[order.status];

    return (
      <>
        <div className="aom-client">
          <div className="aom-client__avatar">
            {client.avatar_url ? (
              <img src={client.avatar_url} alt={client.fullName || 'Mijoz'} />
            ) : (
              <span>{client.fullName?.[0]?.toUpperCase() || 'M'}</span>
            )}
          </div>

          <div className="aom-client__info">
            <strong>{client.fullName || 'Mijoz'}</strong>
            <span className="aom-client__label">Mijoz</span>
          </div>

          {client.phone && (
            <button
              type="button"
              className="aom-client__call"
              onClick={() => handleCall(client.phone)}
              aria-label="Qo'ng'iroq"
            >
              <Phone size={16} />
            </button>
          )}
        </div>

        {order.location?.address && (
          <div className="aom-address">
            <MapPin size={16} />
            <span>{order.location.address}</span>
          </div>
        )}

        {order.description && (
          <div className="aom-desc">
            <strong>Mijoz izohi:</strong>
            <p>{order.description}</p>
          </div>
        )}

        <div className="aom-status">
          <AlertCircle size={14} />
          <span>Joriy holat: {STATUS_LABELS[order.status]}</span>
        </div>

        {action && (
          <button
            type="button"
            className="aom-btn aom-btn--next"
            style={{ '--btn-color': action.color }}
            onClick={() => handleStatusChange(action.next)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="aom-spin" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <action.icon size={18} />
                {action.label}
              </>
            )}
          </button>
        )}

        <button
          type="button"
          className="aom-btn aom-btn--chat-full"
          onClick={handleChat}
        >
          <MessageCircle size={18} />
          Mijoz bilan chat
        </button>
      </>
    );
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="aom-overlay" onClick={onClose}>
      <div className="aom-modal" onClick={(e) => e.stopPropagation()}>
        <header className="aom-header">
          <div className="aom-header__left">
            <span
              className={`aom-header__pulse ${
                order.status === 'open' ? 'aom-header__pulse--spin' : ''
              }`}
            />
            <div>
              <strong>{STATUS_LABELS[order.status] || 'Zakaz'}</strong>
              <small>
                {order.category || 'Xizmat'} · #{String(order._id).slice(-6)}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="aom-header__close"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </header>

        <div className="aom-body">
          {isClient && renderClientView()}
          {isProvider && renderProviderView()}
        </div>
      </div>
    </div>
  );
}