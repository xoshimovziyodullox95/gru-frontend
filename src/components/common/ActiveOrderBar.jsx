/* ============================================================
   ACTIVE ORDER BAR
   Yandex Taxi uslubi — tepada doim ko'rinadigan banner
   Bosilganda → so'rov tafsilotlari sahifasi ochiladi (mijoz yoki usta)
   ============================================================ */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Navigation,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import api from '../services/api';


import '../../styles/activeOrderBar.css';

/* ============================================================
   STATUS CONFIG
   ============================================================ */

const STATUS_INFO = {
  open: {
    label: 'Usta qidirilmoqda',
    icon: Loader2,
    color: '#2196f3',
    spin: true,
    progress: 20,
  },
  accepted: {
    label: 'Usta tayinlandi',
    icon: CheckCircle2,
    color: '#00c853',
    progress: 40,
  },
  on_way: {
    label: 'Usta yo‘lda',
    icon: Navigation,
    color: '#ff8a2a',
    progress: 60,
  },
  arrived: {
    label: 'Usta yetib keldi',
    icon: MapPin,
    color: '#00c853',
    progress: 80,
  },
  in_progress: {
    label: 'Ish bajarilmoqda',
    icon: Wrench,
    color: '#7c4dff',
    progress: 100,
  },
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function ActiveOrderBar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  /* ============================================================
     FETCH
     ============================================================ */

  const fetchActive = async () => {
    if (!user) return;

    try {
      const { data } = await api.get('/service-requests/active');

      if (data && data.status) {
        setActive(data);
      } else {
        setActive(null);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.warn('Active fetch xato:', err.message);
      }
      setActive(null);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     INITIAL + POLLING
     ============================================================ */

  useEffect(() => {
    if (!user) return undefined;

    fetchActive();

    /* Har 30 sekundda yangilash (zaxira) */
    const interval = setInterval(fetchActive, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ============================================================
     SOCKET — real-time
     ============================================================ */

  useEffect(() => {
    if (!user) return undefined;

    const socket = getSocket();

    const handleStatusChange = (data) => {
      console.log('📥 ActiveOrderBar status:', data);
      fetchActive();
    };

    const handleNotification = (notif) => {
      if (
        notif.type === 'service_request' ||
        notif.type === 'new_offer' ||
        notif.type === 'offer_accepted' ||
        notif.type === 'offer_declined'
      ) {
        fetchActive();
      }
    };

    socket.on('request_status_changed', handleStatusChange);
    socket.on('new_notification', handleNotification);

    return () => {
      socket.off('request_status_changed', handleStatusChange);
      socket.off('new_notification', handleNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ============================================================
     HANDLERS
     ============================================================ */

  // Bitta joyda boshqariladi: RequestDetailPage (holat, tasdiqlash, yo'l)
  const handleOpenModal = () => {
    if (!active?._id) return;
    navigate(active.viewer === 'provider' ? `/provider-requests/${active._id}` : `/requests/${active._id}`);
  };

  const handleHideBanner = (e) => {
    e.stopPropagation();
    setHidden(true);
  };

  /* ============================================================
     RENDER
     ============================================================ */

  /* Loading yoki user yo'q — ko'rsatmaymiz */
  if (loading || !user || hidden || !active) return null;

  const info = STATUS_INFO[active.status];

  if (!info) return null;

  const Icon = info.icon;

  /* Topilgan offer (client uchun) */
  const acceptedOffer = (active.offers || []).find(
    (o) => o._id === active.acceptedOfferId
  );

  /* Subtitle */
  const getSubtitle = () => {
    /* Client */
    if (active.viewer === 'client') {
      if (active.status === 'open') {
        return `${active.notifiedCount || 0} ta ustaga yuborildi`;
      }

      if (active.status === 'accepted' && acceptedOffer) {
        return `${acceptedOffer.provider?.name || 'Usta'} · ${
          acceptedOffer.arrivalMinutes || active.arrivalMinutes || 30
        } daqiqada`;
      }

      if (active.status === 'on_way') {
        return acceptedOffer?.provider?.name || 'Usta yo‘lda';
      }

      if (active.status === 'arrived') {
        return 'Usta yetib keldi';
      }

      if (active.status === 'in_progress') {
        return 'Ish bajarilmoqda';
      }
    }

    /* Provider */
    if (active.viewer === 'provider') {
      if (active.status === 'accepted') {
        return 'Manzilga yo‘l oling';
      }

      if (active.status === 'on_way') {
        return 'Yo‘lda';
      }

      if (active.status === 'arrived') {
        return 'Ishni boshlang';
      }

      if (active.status === 'in_progress') {
        return 'Ish bajarilmoqda';
      }
    }

    return '';
  };

  return (
    <>
      <div
        className="aob"
        style={{ '--aob-color': info.color }}
        onClick={handleOpenModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenModal();
          }
        }}
      >
        {/* Progress chiziq (yuqorida) */}
        <div className="aob__progress">
          <div
            className="aob__progress-bar"
            style={{ width: `${info.progress}%` }}
          />
        </div>

        {/* Icon */}
        <div className="aob__icon">
          <Icon
            size={20}
            strokeWidth={2.2}
            className={info.spin ? 'aob__icon--spin' : ''}
          />
        </div>

        {/* Content */}
        <div className="aob__content">
          <div className="aob__label">{info.label}</div>

          <div className="aob__sub">
            <Clock size={11} />
            <span>{getSubtitle()}</span>
          </div>
        </div>

        {/* Hide tugmasi */}
        <button
          type="button"
          className="aob__close"
          onClick={handleHideBanner}
          aria-label="Yashirish"
        >
          <X size={14} />
        </button>

        {/* Arrow */}
        <span className="aob__arrow" aria-hidden="true">
          <ChevronRight size={16} />
        </span>
      </div>


    </>
  );
}