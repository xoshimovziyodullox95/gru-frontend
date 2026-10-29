/* ============================================================
   ACTIVE ORDER BAR
   Yandex Taxi uslubi — tepada doim ko'rinadigan banner
   Bosilganda → so'rov tafsilotlari sahifasi ochiladi (mijoz yoki usta)
   ============================================================ */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  MapPin,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Navigation,
  BellRing,
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
  // Ustaga: javob kutayotgan yangi buyurtmalar
  incoming: {
    icon: BellRing,
    color: '#ff8a2a',
    progress: 10,
  },
  open: {
    icon: Loader2,
    color: '#2196f3',
    spin: true,
    progress: 20,
  },
  accepted: {
    icon: CheckCircle2,
    color: '#00c853',
    progress: 40,
  },
  on_way: {
    icon: Navigation,
    color: '#ff8a2a',
    progress: 60,
  },
  arrived: {
    icon: MapPin,
    color: '#00c853',
    progress: 80,
  },
  in_progress: {
    icon: Wrench,
    color: '#7c4dff',
    progress: 100,
  },
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function ActiveOrderBar({ floating = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        notif.type === 'offer_declined' ||
        notif.type === 'request_status' ||
        notif.type === 'request_declined'
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
    if (active.status === 'incoming') {
      navigate(active.incomingCount > 1 ? '/provider-requests' : `/provider-requests/${active._id}`);
      return;
    }
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

  const offersCount = (active.offers || []).length;

  /* Sarlavha — mijozga taklif kelganini, ustaga yangi buyurtmani aniq aytadi */
  const getLabel = () => {
    if (active.status === 'incoming') {
      return t('activeOrder.incoming', 'Sizga {{count}} ta yangi buyurtma', { count: active.incomingCount || 1 });
    }
    if (active.viewer === 'client' && active.status === 'open') {
      if (offersCount > 0) return t('activeOrder.offersIn', '{{count}} ta taklif keldi', { count: offersCount });
      if (active.isDirect) return t('activeOrder.sentToPro', 'So‘rov ustaga yuborildi');
    }
    return t(`activeOrder.status.${active.status}`);
  };

  /* Subtitle */
  const getSubtitle = () => {
    if (active.status === 'incoming') {
      return active.isDirect
        ? t('activeOrder.directWaiting', 'Mijoz sizga shaxsan buyurtma berdi — javob bering')
        : t('activeOrder.replyIncoming', 'Narx taklif qiling');
    }

    /* Client */
    if (active.viewer === 'client') {
      if (active.status === 'open') {
        if (offersCount > 0) return t('activeOrder.chooseOffer', 'Ko‘rib chiqing va ustani tanlang');
        if (active.isDirect) return t('activeOrder.waitingPro', 'Usta javobini kutyapmiz');
        return t('activeOrder.sentTo', '{{count}} ta ustaga yuborildi', { count: active.notifiedCount || 0 });
      }

      if (active.status === 'accepted' && acceptedOffer) {
        return t('activeOrder.arrivesIn', '{{name}} · {{min}} daqiqada', {
          name: acceptedOffer.provider?.name || t('activeOrder.pro', 'Usta'),
          min: acceptedOffer.arrivalMinutes || active.arrivalMinutes || 30,
        });
      }

      if (active.status === 'on_way') {
        return acceptedOffer?.provider?.name || t('activeOrder.status.on_way');
      }

      if (active.status === 'arrived') {
        return t('activeOrder.status.arrived');
      }

      if (active.status === 'in_progress') {
        return t('activeOrder.status.in_progress');
      }
    }

    /* Provider */
    if (active.viewer === 'provider') {
      if (active.status === 'accepted') {
        return t('activeOrder.goToAddress', 'Manzilga yo‘l oling');
      }

      if (active.status === 'on_way') {
        return t('activeOrder.onWay', 'Yo‘lda');
      }

      if (active.status === 'arrived') {
        return t('activeOrder.startWork', 'Ishni boshlang');
      }

      if (active.status === 'in_progress') {
        return t('activeOrder.status.in_progress');
      }
    }

    return '';
  };

  return (
    <>
      <div
        className={`aob ${floating ? 'aob--floating' : ''}`}
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
            className={info.spin && offersCount === 0 ? 'aob__icon--spin' : ''}
          />
        </div>

        {/* Content */}
        <div className="aob__content">
          <div className="aob__label">{getLabel()}</div>

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
          aria-label={t('activeOrder.hide', 'Yashirish')}
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