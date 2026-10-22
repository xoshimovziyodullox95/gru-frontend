// src/components/pages/ProviderRequestsPage.jsx
/* ============================================================
   PROVIDER REQUESTS PAGE — ZUMO dizaynida
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  MapPin, Clock, Phone, Send, X, Loader2, Inbox,
  MessageSquare, CheckCircle2, XCircle, Sparkles,
  Wallet, User, ChevronRight, Filter, RefreshCw,
} from 'lucide-react';

import Modal from '../ui/Modal';
import {
  getProviderServiceRequests,
  sendServiceRequestOffer,
} from '../services/serviceRequests';

import '../../styles/serviceRequests.css';

const OFFER_STATUS = {
  pending: {
    label: 'Kutilmoqda',
    icon: Clock,
    color: '#fbbf24',
  },
  accepted: {
    label: 'Tanlandi',
    icon: CheckCircle2,
    color: '#10b981',
  },
  declined: {
    label: 'Rad etildi',
    icon: XCircle,
    color: '#ff5c5c',
  },
};

const formatSlug = (slug = '') =>
  slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return 'hozir';
  if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;

  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'short',
  });
};

const formatPrice = (value) =>
  `${Number(value || 0).toLocaleString('uz-UZ')} so'm`;

/* ============================================================
   OFFER MODAL
   ============================================================ */

function OfferModal({ isOpen, request, onClose, onSent }) {
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrice('');
      setMessage('');
      setError('');
    }
  }, [isOpen]);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!Number(price) || Number(price) <= 0) {
      setError('Narxni kiriting');
      return;
    }

    setSubmitting(true);

    try {
      await sendServiceRequestOffer(request._id, {
        price: Number(price),
        message,
      });
      toast.success('Taklif yuborildi');
      onSent();
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Taklif berish"
      footer={
        <>
          <button
            type="button"
            className="pr-btn pr-btn--ghost"
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="offer-form"
            className="pr-btn pr-btn--primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="spin" />
                Yuborilmoqda...
              </>
            ) : (
              <>
                <Send size={16} />
                Yuborish
              </>
            )}
          </button>
        </>
      }
    >
      <form id="offer-form" className="pr-form" onSubmit={handleSubmit}>
        <div className="pr-form__desc">
          <span className="pr-form__desc-icon">
            <MessageSquare size={16} />
          </span>
          <p>{request.description}</p>
        </div>

        <label className="pr-field">
          <span className="pr-field__label">
            <Wallet size={14} /> Narx (so'm)
          </span>
          <input
            className="pr-field__input"
            type="number"
            min="1"
            placeholder="500 000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>

        <label className="pr-field">
          <span className="pr-field__label">
            <MessageSquare size={14} /> Izoh (ixtiyoriy)
          </span>
          <textarea
            className="pr-field__input pr-field__textarea"
            rows={3}
            maxLength={1000}
            placeholder="Qachon kela olasiz, nimalar kiradi..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        {error && (
          <div className="pr-error">
            <XCircle size={16} />
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function ProviderRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRequest, setActiveRequest] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await getProviderServiceRequests(
        filter ? { status: filter } : {}
      );
      setRequests(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="pr-page">
      {/* Header */}
      <header className="pr-header">
        <div className="pr-header__left">
          <span className="pr-header__icon">
            <Inbox size={22} strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="pr-header__title">Kelgan so'rovlar</h1>
            <p className="pr-header__sub">
              {requests.length} ta so'rov
            </p>
          </div>
        </div>

        <button
          type="button"
          className="pr-refresh"
          onClick={load}
          disabled={loading}
          aria-label="Yangilash"
        >
          <RefreshCw
            size={18}
            strokeWidth={2.2}
            className={loading ? 'spin' : ''}
          />
        </button>
      </header>

      {/* Filters */}
      <div className="pr-filters">
        <span className="pr-filters__icon">
          <Filter size={14} strokeWidth={2.4} />
        </span>
        {[
          { value: 'open', label: 'Ochiq' },
          { value: 'closed', label: 'Yopilgan' },
          { value: '', label: 'Hammasi' },
        ].map((opt) => (
          <button
            key={opt.value || 'all'}
            type="button"
            className={`pr-filter ${
              filter === opt.value ? 'active' : ''
            }`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="pr-error">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="pr-loading">
          <Loader2 size={28} className="spin" />
          <span>Yuklanmoqda...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && !requests.length && (
        <div className="pr-empty">
          <div className="pr-empty__icon">
            <Inbox size={42} strokeWidth={1.6} />
          </div>
          <h3>Hozircha so'rov yo'q</h3>
          <p>Yangi so'rovlar kelganda shu yerda ko'rinadi</p>
        </div>
      )}

      {/* Requests list */}
      <div className="pr-list">
        {requests.map((request) => {
          const statusCfg = request.myOffer
            ? OFFER_STATUS[request.myOffer.status] || OFFER_STATUS.pending
            : null;
          const StatusIcon = statusCfg?.icon;

          return (
            <article key={request._id} className="pr-card">
              {/* Top row: category + status */}
              <header className="pr-card__top">
                <div className="pr-card__category">
                  <span className="pr-card__badge">
                    {formatSlug(request.category)}
                  </span>
                  <span
                    className={`pr-card__status pr-card__status--${request.status}`}
                  >
                    {request.status === 'open' ? 'Ochiq' : 'Yopilgan'}
                  </span>
                </div>
                <span className="pr-card__time">
                  <Clock size={12} />
                  {formatDate(request.createdAt)}
                </span>
              </header>

              {/* Description */}
              <p className="pr-card__desc">{request.description}</p>

              {/* Meta row */}
              <div className="pr-card__meta">
                {request.location?.address && (
                  <span className="pr-card__meta-item">
                    <MapPin size={13} strokeWidth={2.2} />
                    {request.location.address}
                  </span>
                )}
                <span className="pr-card__meta-item">
                  <User size={13} strokeWidth={2.2} />
                  {request.client?.fullName ||
                    request.client?.full_name ||
                    'Mijoz'}
                </span>
                <span className="pr-card__meta-item">
                  <MessageSquare size={13} strokeWidth={2.2} />
                  {request.offersCount} taklif
                </span>
              </div>

              {/* My offer status */}
              {request.myOffer && statusCfg && (
                <div
                  className="pr-card__offer"
                  style={{ '--offer-color': statusCfg.color }}
                >
                  <div className="pr-card__offer-left">
                    <span className="pr-card__offer-icon">
                      <StatusIcon size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                      <strong>{formatPrice(request.myOffer.price)}</strong>
                      <small>{statusCfg.label}</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Accepted — phone call */}
              {request.myOffer?.status === 'accepted' &&
                request.client?.phone && (
                  <a
                    className="pr-btn pr-btn--success pr-btn--full"
                    href={`tel:${request.client.phone}`}
                  >
                    <Phone size={16} strokeWidth={2.4} />
                    {request.client.phone}
                  </a>
                )}

              {/* Can offer — main CTA */}
              {request.canOffer && (
                <button
                  type="button"
                  className="pr-btn pr-btn--primary pr-btn--full"
                  onClick={() => setActiveRequest(request)}
                >
                  <Sparkles size={16} strokeWidth={2.4} />
                  Taklif berish
                  <ChevronRight size={16} strokeWidth={2.4} />
                </button>
              )}
            </article>
          );
        })}
      </div>

      <OfferModal
        isOpen={Boolean(activeRequest)}
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
        onSent={() => {
          setActiveRequest(null);
          load();
        }}
      />
    </div>
  );
}