/* ============================================================
   REQUEST TRACKER MODAL
   Mijoz so'rov yuborgandan keyin: ustalar javobini kutish,
   takliflarni solishtirish va ustani tanlash.
   ============================================================ */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Clock, Star, Phone, MessageCircle, Loader2, Users, FileText,
} from 'lucide-react';
import { toast } from 'react-toastify';

import { getSocket } from '../lib/socket';
import {
  acceptServiceRequestOffer,
  getServiceRequestById,
  updateRequestStatus,
} from '../services/serviceRequests';

import '../../styles/requestTracker.css';

// Socket uzilsa ham holat yangilanib tursin
const POLL_MS = 10000;

const CLOSED_STATUSES = ['cancelled', 'completed'];

function formatPrice(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatCountdown(ms) {
  if (ms <= 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function mergeOffers(prev, next) {
  const map = new Map(prev.map((o) => [String(o._id), o]));
  next.forEach((o) => {
    if (!o?._id) return;
    map.set(String(o._id), { ...map.get(String(o._id)), ...o });
  });
  return [...map.values()];
}

function ProviderAvatar({ provider, size = 44 }) {
  const [broken, setBroken] = useState(false);
  const name = provider?.name || 'Usta';
  if (provider?.image && !broken) {
    return (
      <img
        className="rt-avatar"
        style={{ width: size, height: size }}
        src={provider.image}
        alt=""
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="rt-avatar rt-avatar--letter" style={{ width: size, height: size }}>
      {name.trim()[0]?.toUpperCase() || 'U'}
    </span>
  );
}

function Rating({ provider }) {
  if (!provider?.ratingsCount) {
    return <span className="rt-rating rt-rating--new">yangi</span>;
  }
  return (
    <span className="rt-rating">
      <Star size={12} />
      {Number(provider.averageRating).toFixed(1)}
      <em>({provider.ratingsCount})</em>
    </span>
  );
}

// Yangi so'rov uchun ota komponent key={request._id} beradi — holat noldan boshlanadi
export default function RequestTrackerModal({ isOpen, request: initialRequest, onClose }) {
  const navigate = useNavigate();

  const [request, setRequest] = useState(initialRequest);
  const [offers, setOffers] = useState(initialRequest?.offers || []);
  const [now, setNow] = useState(() => Date.now());
  const [acceptingId, setAcceptingId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const requestId = initialRequest?._id ? String(initialRequest._id) : null;

  /* ---------- Sekund hisoblagich (muddat uchun) ---------- */
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  /* ---------- Serverdan yangilash (socket zaxirasi) ---------- */
  useEffect(() => {
    if (!isOpen || !requestId) return undefined;
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await getServiceRequestById(requestId);
        const fresh = res.data?.request || res.data;
        if (cancelled || !fresh?._id) return;
        setRequest(fresh);
        setOffers((prev) => mergeOffers(prev, fresh.offers || []));
      } catch {
        // Tarmoq xatosi — keyingi urinishda yangilanadi
      }
    };

    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isOpen, requestId]);

  /* ---------- Socket: yangi taklif darhol ko'rinsin ---------- */
  useEffect(() => {
    if (!isOpen || !requestId) return undefined;
    const socket = getSocket();

    const onRequestUpdated = (data) => {
      if (String(data?.requestId) !== requestId || !data.offer) return;
      setOffers((prev) => mergeOffers(prev, [data.offer]));
    };

    socket.on('request_updated', onRequestUpdated);
    return () => socket.off('request_updated', onRequestUpdated);
  }, [isOpen, requestId]);

  /* ---------- Hisoblangan qiymatlar ---------- */
  const status = request?.status || 'open';
  const pendingOffers = useMemo(
    () => offers.filter((o) => o.status !== 'declined').sort((a, b) => a.price - b.price),
    [offers]
  );
  const cheapestId = pendingOffers[0]?._id;
  const fastestId = useMemo(() => {
    if (pendingOffers.length < 2) return null;
    return [...pendingOffers].sort((a, b) => (a.arrivalMinutes || 30) - (b.arrivalMinutes || 30))[0]._id;
  }, [pendingOffers]);

  const acceptedOffer = request?.acceptedOfferId
    ? offers.find((o) => String(o._id) === String(request.acceptedOfferId))
    : null;

  const expiresAt = request?.expiresAt ? new Date(request.expiresAt).getTime() : null;
  const createdAt = request?.createdAt ? new Date(request.createdAt).getTime() : null;
  const timeLeft = expiresAt ? expiresAt - now : null;
  const progress = expiresAt && createdAt
    ? Math.min(100, Math.max(0, ((now - createdAt) / (expiresAt - createdAt)) * 100))
    : 0;

  const isClosed = CLOSED_STATUSES.includes(status) || (status === 'open' && timeLeft !== null && timeLeft <= 0);
  const isAccepted = !isClosed && status !== 'open' && acceptedOffer;
  const phase = isClosed ? 'closed' : isAccepted ? 'accepted' : pendingOffers.length ? 'offers' : 'searching';

  /* ---------- Amallar ---------- */
  const handleAccept = async (offer) => {
    setAcceptingId(offer._id);
    try {
      const res = await acceptServiceRequestOffer(requestId, offer._id);
      const updated = res.data?.request;
      if (updated) {
        setRequest(updated);
        setOffers((prev) => mergeOffers(prev, updated.offers || []));
      } else {
        setRequest((prev) => ({ ...prev, status: 'accepted', acceptedOfferId: offer._id }));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ustani tanlab bo‘lmadi');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('So‘rovni bekor qilasizmi? Ustalar endi uni ko‘rmaydi.')) return;
    setCancelling(true);
    try {
      await updateRequestStatus(requestId, 'cancelled', 'Mijoz bekor qildi');
      setRequest((prev) => ({ ...prev, status: 'cancelled' }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bekor qilib bo‘lmadi');
    } finally {
      setCancelling(false);
    }
  };

  const openChat = () => {
    const userId = acceptedOffer?.provider?.userId;
    onClose?.();
    navigate(userId ? `/chat?userId=${userId}` : '/chat');
  };

  if (!isOpen || !request) return null;

  const provider = acceptedOffer?.provider || {};
  const selectedOffer =
    pendingOffers.find((o) => o._id === selectedId) || pendingOffers[0] || null;
  const minutesLeft = timeLeft !== null ? Math.max(0, Math.ceil(timeLeft / 60000)) : null;

  const TITLES = {
    searching: 'Usta qidirilmoqda',
    offers: 'Ustani tanlang',
    accepted: 'Usta yo‘lda',
    closed: status === 'completed' ? 'Ish yakunlandi' : 'So‘rov yopildi',
  };

  return (
    <div className="rt-overlay" onClick={onClose}>
      <div className="rt-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* ---------- Panel ---------- */}
        {/* Mijozga xarita kerak emas — o'z manzilini biladi; faqat holat va takliflar */}
        <div className="rt-panel rt-panel--plain">
          <span className="rt-grabber" aria-hidden="true" />
          <button type="button" className="rt-map__close" onClick={onClose} aria-label="Yopish">
            <X size={20} />
          </button>

          <div className="rt-status">
            <h2 className="rt-status__title">{TITLES[phase]}</h2>
            {(phase === 'searching' || phase === 'offers') && (
              <div className={`rt-line ${phase === 'searching' ? 'rt-line--run' : ''}`}>
                <span style={phase === 'offers' ? { width: `${100 - progress}%` } : undefined} />
              </div>
            )}
            <p className="rt-status__sub">
              {request.category || 'Xizmat'}
              {request.location?.address ? ` · ${request.location.address}` : ''}
            </p>
          </div>

          <div className="rt-content">
            {/* ========== 1. KUTISH ========== */}
            {phase === 'searching' && (
              <ul className="rt-facts">
                <li>
                  <Users size={16} />
                  <span>
                    {request.notifiedCount
                      ? `${request.notifiedCount} ta yaqin ustaga yuborildi`
                      : 'Yaqin ustalarga yuborildi'}
                  </span>
                </li>
                {minutesLeft !== null && (
                  <li>
                    <Clock size={16} />
                    <span>Takliflar {minutesLeft} daqiqa davomida qabul qilinadi</span>
                  </li>
                )}
                {request.description && (
                  <li>
                    <FileText size={16} />
                    <span className="rt-facts__desc">{request.description}</span>
                  </li>
                )}
              </ul>
            )}

            {/* ========== 2. TAKLIFLAR ========== */}
            {phase === 'offers' && (
              <>
                <div className="rt-offers-meta">
                  <span>{pendingOffers.length} ta taklif</span>
                  {minutesLeft !== null && <span>yana {formatCountdown(timeLeft)}</span>}
                </div>
                <ul className="rt-list" role="radiogroup">
                  {pendingOffers.map((offer) => {
                    const active = selectedOffer?._id === offer._id;
                    return (
                      <li key={offer._id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className={`rt-row ${active ? 'is-active' : ''}`}
                          onClick={() => setSelectedId(offer._id)}
                        >
                          <ProviderAvatar provider={offer.provider} size={42} />
                          <span className="rt-row__who">
                            <strong>{offer.provider?.name || 'Usta'}</strong>
                            <span className="rt-row__meta">
                              <Rating provider={offer.provider} />
                              <span>· {offer.arrivalMinutes || 30} daq</span>
                            </span>
                            {offer.message && <span className="rt-row__msg">{offer.message}</span>}
                          </span>
                          <span className="rt-row__price">
                            {formatPrice(offer.price)}
                            <small>so‘m</small>
                            {offer._id === cheapestId && pendingOffers.length > 1 && <em>arzon</em>}
                            {offer._id === fastestId && offer._id !== cheapestId && <em>tez</em>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* ========== 3. USTA TANLANDI ========== */}
            {phase === 'accepted' && (
              <>
                <div className="rt-eta">
                  <strong>~{acceptedOffer.arrivalMinutes || request.arrivalMinutes || 30}</strong>
                  <span>daqiqada yetib keladi</span>
                </div>
                <div className="rt-master">
                  <ProviderAvatar provider={provider} size={48} />
                  <span className="rt-row__who">
                    <strong>{provider.name || 'Usta'}</strong>
                    <span className="rt-row__meta">
                      <Rating provider={provider} />
                      <span>· {formatPrice(acceptedOffer.price)} so‘m</span>
                    </span>
                  </span>
                  <span className="rt-master__actions">
                    {provider.phone && (
                      <a href={`tel:${provider.phone}`} className="rt-round" aria-label="Qo‘ng‘iroq">
                        <Phone size={18} />
                      </a>
                    )}
                    <button type="button" className="rt-round" onClick={openChat} aria-label="Ustaga yozish">
                      <MessageCircle size={18} />
                    </button>
                  </span>
                </div>
              </>
            )}

            {/* ========== 4. YOPILGAN ========== */}
            {phase === 'closed' && (
              <p className="rt-closed-text">
                {status === 'completed'
                  ? 'Xizmatdan foydalanganingiz uchun rahmat.'
                  : 'So‘rov bekor qilingan yoki muddati tugagan. Kerak bo‘lsa, yangi so‘rov yuboring.'}
              </p>
            )}
          </div>

          {/* ---------- Pastki tugmalar ---------- */}
          <footer className="rt-foot">
            {phase === 'offers' && selectedOffer && (
              <button
                type="button"
                className="rt-btn rt-btn--primary"
                onClick={() => handleAccept(selectedOffer)}
                disabled={Boolean(acceptingId)}
              >
                {acceptingId ? <Loader2 size={18} className="rt-spin" /> : null}
                Tanlash · {formatPrice(selectedOffer.price)} so‘m
              </button>
            )}

            {(phase === 'searching' || phase === 'offers') && (
              <button type="button" className="rt-btn rt-btn--text" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? <Loader2 size={16} className="rt-spin" /> : null}
                So‘rovni bekor qilish
              </button>
            )}

            {phase === 'accepted' && (
              <button
                type="button"
                className="rt-btn rt-btn--ghost"
                onClick={() => { onClose?.(); navigate(`/requests/${requestId}`); }}
              >
                Buyurtma tafsilotlari
              </button>
            )}

            {phase === 'closed' && (
              <button
                type="button"
                className="rt-btn rt-btn--primary"
                onClick={() => { onClose?.(); navigate('/request'); }}
              >
                Yangi so‘rov
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
