/* ============================================================
   ORDER HISTORY PAGE
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Clock, CheckCircle2, XCircle, Star, MapPin,
  Wrench, User, Filter, ArrowLeft,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import '../../styles/orderHistory.css';

import { T } from '../utils/T';
import { serviceLabel } from '../utils/i18nHelpers';
const STATUS_INFO = {
  completed: { label: T('Bajarildi'), color: '#00c853', icon: CheckCircle2 },
  cancelled: { label: T('Bekor qilindi'), color: '#ef4444', icon: XCircle },
  closed: { label: T('Yopilgan'), color: '#94a3b8', icon: CheckCircle2 },
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState('client');
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/service-requests/history', {
        params: { viewer: tab, limit: 50 },
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('History xato:', err);
      toast.error(T('Tarixni yuklab bo\'lmadi'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  return (
    <div className="oh-page">
      <header className="oh-header">
        <Link to="/profile" className="oh-back">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1>{T('Zakazlar tarixi')}</h1>
          <p>{T('O‘tgan buyurtmalaringiz')}</p>
        </div>
      </header>

      <div className="oh-tabs">
        <button
          type="button"
          className={`oh-tab ${tab === 'client' ? 'is-on' : ''}`}
          onClick={() => setTab('client')}
        >
          <User size={16} />
          {T('Mening zakazlarim')}
        </button>
        <button
          type="button"
          className={`oh-tab ${tab === 'provider' ? 'is-on' : ''}`}
          onClick={() => setTab('provider')}
        >
          <Wrench size={16} />
          {T('Bajarilgan ishlar')}
        </button>
      </div>

      <div className="oh-filter">
        <Filter size={14} />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="oh-filter__select"
        >
          <option value="all">{T('Hammasi')}</option>
          <option value="completed">{T('Bajarilgan')}</option>
          <option value="cancelled">{T('Bekor qilingan')}</option>
        </select>
      </div>

      {loading && (
        <div className="oh-skeletons">
          {[1, 2, 3].map((i) => <div key={i} className="oh-skeleton" />)}
        </div>
      )}

      {!loading && !filtered.length && (
        <div className="oh-empty">
          <Clock size={48} strokeWidth={1.5} />
          <h3>{T('Hozircha zakaz yo‘q')}</h3>
          <p>{T('Yangi zakazlar bu yerda ko‘rinadi')}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="oh-list">
          {filtered.map((item) => {
            const status = STATUS_INFO[item.status] || STATUS_INFO.closed;
            const StatusIcon = status.icon;

            const acceptedOffer = (item.offers || []).find(
              (o) => o._id === item.acceptedOfferId
            );

            const other = tab === 'client'
              ? acceptedOffer?.provider
              : item.client;

            const otherLabel = tab === 'client' ? T('Usta') : T('Mijoz');
            const hasReview = Boolean(item.review?.rating);

            return (
              <article key={item._id} className="oh-card">
                <header className="oh-card__header">
                  <div className="oh-card__left">
                    <div
                      className="oh-card__status"
                      style={{ color: status.color, background: `${status.color}20` }}
                    >
                      <StatusIcon size={12} strokeWidth={2.4} />
                      {status.label}
                    </div>
                    <span className="oh-card__date">
                      {new Date(
                        item.completedAt || item.createdAt
                      ).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                  <strong className="oh-card__category">
                    {item.category ? serviceLabel(item.category) : T('Xizmat')}
                  </strong>
                </header>

                {other && (
                  <div className="oh-card__other">
                    <span className="oh-card__other-avatar">
                      {(other.fullName || other.name || '?')[0].toUpperCase()}
                    </span>
                    <span className="oh-card__other-info">
                      <small>{otherLabel}</small>
                      <strong>{other.fullName || other.name || T('Noma\'lum')}</strong>
                    </span>
                    {acceptedOffer?.price && (
                      <span className="oh-card__price">
                        {Number(acceptedOffer.price).toLocaleString('uz-UZ')}
                        <small>{T('so\'m')}</small>
                      </span>
                    )}
                  </div>
                )}

                {item.description && (
                  <p className="oh-card__desc">{item.description}</p>
                )}

                {item.location?.address && (
                  <p className="oh-card__address">
                    <MapPin size={12} />
                    {item.location.address}
                  </p>
                )}

                {tab === 'client' && item.status === 'completed' && (
                  <>
                    {hasReview ? (
                      <div className="oh-card__review">
                        <div className="oh-card__stars">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={14}
                              fill={n <= item.review.rating ? '#fbbf24' : 'transparent'}
                              stroke={n <= item.review.rating ? '#fbbf24' : '#64748b'}
                            />
                          ))}
                          <span>{item.review.rating}.0</span>
                        </div>
                        {item.review.comment && <p>"{item.review.comment}"</p>}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="oh-card__rate-btn"
                        onClick={() => navigate(`/requests/${item._id}/done`)}
                      >
                        <Star size={14} />
                        {T('Xizmatni baholash')}
                      </button>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}