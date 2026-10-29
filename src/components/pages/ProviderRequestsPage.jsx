/* ============================================================
   PROVIDER REQUESTS PAGE — /provider-requests
   Ustaga kelgan so'rovlar ro'yxati. Har bir karta tafsilotlar
   sahifasini ochadi (/provider-requests/:id) — taklif berish,
   yo'lga chiqish va ishni tugatish o'sha yerda.
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, MapPin, RefreshCw, Inbox, ChevronRight, Loader2 } from 'lucide-react';

import { getProviderServiceRequests } from '../services/serviceRequests';
import { safeGoBack } from '../utils/navigation.js';
import { serviceLabel, timeAgo, formatSum, whenLabel } from '../utils/i18nHelpers';

import '../../styles/requestTracker.css';
import '../../styles/providerRequests.css';

const TABS = ['open', 'active', 'closed'];

// Ustaning nuqtai nazaridan holat matni
function statusLabel(request) {
  const offer = request.myOffer;
  if (request.status === 'open') {
    if (!offer) return { key: 'waitingOffer', tone: 'new' };
    return { key: 'offerSent', tone: 'wait' };
  }
  if (offer && offer.status !== 'accepted') return { key: 'otherChosen', tone: 'muted' };
  if (request.completionRequestedAt && request.status !== 'completed') {
    return { key: 'awaitingClient', tone: 'wait' };
  }
  const MAP = {
    accepted: 'new', on_way: 'active', arrived: 'active', in_progress: 'active', completed: 'muted', cancelled: 'muted',
  };
  return MAP[request.status] ? { key: request.status, tone: MAP[request.status] } : { key: null, text: request.status, tone: 'muted' };
}


export default function ProviderRequestsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getProviderServiceRequests({ status: tab });
      setRequests(Array.isArray(res.data) ? res.data : res.data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.error || t('providerRequests.loadError', 'So‘rovlarni yuklab bo‘lmadi'));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  return (
    <div className="prq-page">
      <header className="prq-head">
        <button type="button" className="rt-round" onClick={() => safeGoBack(navigate)} aria-label={t('common.back', 'Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <h1>{t('providerRequests.title', 'So‘rovlar')}</h1>
        <button type="button" className="rt-round" onClick={load} disabled={loading} aria-label={t('providerRequests.refresh', 'Yangilash')}>
          <RefreshCw size={18} className={loading ? 'rt-spin' : ''} />
        </button>
      </header>

      <div className="prq-tabs" role="tablist">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={`prq-tab ${tab === value ? 'is-active' : ''}`}
            onClick={() => setTab(value)}
          >
            {t(`providerRequests.tab.${value}`)}
          </button>
        ))}
      </div>

      {error && <p className="prq-note">{error}</p>}

      {loading && !requests.length && (
        <div className="prq-center"><Loader2 size={26} className="rt-spin" /></div>
      )}

      {!loading && !error && !requests.length && (
        <div className="prq-center">
          <Inbox size={36} strokeWidth={1.6} />
          <p className="prq-note">
            {tab === 'open' && t('providerRequests.empty.open', 'Hozircha yangi so‘rov yo‘q. Kelganda bildirishnoma keladi.')}
            {tab === 'active' && t('providerRequests.empty.active', 'Faol ishingiz yo‘q.')}
            {tab === 'closed' && t('providerRequests.empty.closed', 'Tugagan ishlar shu yerda ko‘rinadi.')}
          </p>
        </div>
      )}

      <ul className="prq-list">
        {requests.map((request) => {
          const st = statusLabel(request);
          return (
            <li key={request._id}>
              <button
                type="button"
                className="prq-card"
                onClick={() => navigate(`/provider-requests/${request._id}`)}
              >
                <span className="prq-card__top">
                  <strong>
                    {serviceLabel(request.category)}
                    {request.isDirect && <span className="prq-direct">{t('providerRequests.direct', 'Sizga shaxsan')}</span>}
                  </strong>
                  <span className="prq-card__time"><Clock size={12} /> {timeAgo(request.createdAt)}</span>
                </span>

                {request.description && <span className="prq-card__desc">{request.description}</span>}
                {request.when && request.when !== 'now' && (
                  <span className="prq-card__addr"><Clock size={13} /> {t('requestDetail.whenNeeded', 'Kerak: {{when}}', { when: whenLabel(request.when) })}</span>
                )}

                {request.location?.address && (
                  <span className="prq-card__addr"><MapPin size={13} /> {request.location.address}</span>
                )}

                <span className="prq-card__bottom">
                  <span className={`prq-status prq-status--${st.tone}`}>{st.key ? t(`providerRequests.status.${st.key}`) : st.text}</span>
                  {request.myOffer?.price ? (
                    <span className="prq-card__price">
                      {formatSum(request.myOffer.price)} {t('common.sum', 'so‘m')}
                    </span>
                  ) : (
                    request.status === 'open' ? (
                      <span className="prq-card__price prq-card__price--cta">{t('providerRequests.makeOffer', 'Narx taklif qiling')}</span>
                    ) : null
                  )}
                  <ChevronRight size={18} className="prq-card__chev" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
