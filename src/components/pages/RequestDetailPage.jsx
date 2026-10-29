/* ============================================================
   REQUEST DETAIL PAGE — /requests/:id (mijoz), /provider-requests/:id (usta)
   Backend ko'ruvchiga qarab viewer: 'client' | 'provider' qaytaradi.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Clock, MapPin, Star, Phone, MessageCircle, Navigation,
  Loader2, CheckCircle2, FileText, Camera, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import RequestMap from '../common/RequestMap';
import { getSocket } from '../lib/socket';
import {
  getServiceRequestById,
  acceptServiceRequestOffer,
  sendServiceRequestOffer,
  updateRequestStatus,
  requestPriceChange,
  respondPriceChange,
  declineServiceRequest,
} from '../services/serviceRequests';
import { uploadFile } from '../services/upload';
import { getImageUrl } from '../utils/imageUrl';
import { getRouteLinks, openRoute } from '../utils/routeLinks';
import { safeGoBack } from '../utils/navigation.js';
import { serviceLabel, formatSum, currentLocale, whenLabel, formatVisit } from '../utils/i18nHelpers';

import '../../styles/requestTracker.css';
import '../../styles/requestDetail.css';

const POLL_MS = 10000;

const STEPS = [{ key: 'accepted' }, { key: 'on_way' }, { key: 'arrived' }, { key: 'completed' }];
// in_progress ham "Yetib keldi" qadamida ko'rinadi
const STEP_OF = { in_progress: 'arrived' };

// Usta bosadigan keyingi qadam. "Ishni tugatdim" so'rovni yopmaydi —
// mijoz tasdiqlagandan keyin "Tugadi" bo'ladi.
const PROVIDER_NEXT = {
  accepted: { next: 'on_way', label: 'leftHome' },
  on_way: { next: 'arrived', label: 'arrived' },
  arrived: { next: 'completed', label: 'finished' },
  in_progress: { next: 'completed', label: 'finished' },
};

const CLIENT_TITLES = ['open', 'accepted', 'on_way', 'arrived', 'in_progress', 'completed', 'cancelled'];

const ARRIVAL_CHOICES = [15, 30, 45, 60];

function defaultVisit(when) {
  const d = new Date();
  if (when === 'tomorrow') { d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); }
  else { d.setHours(d.getHours() + 1, 0, 0, 0); }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const price = formatSum;

function Avatar({ name, image, size = 44 }) {
  const [broken, setBroken] = useState(false);
  if (image && !broken) {
    return <img className="rt-avatar" style={{ width: size, height: size }} src={image} alt="" onError={() => setBroken(true)} />;
  }
  return (
    <span className="rt-avatar rt-avatar--letter" style={{ width: size, height: size }}>
      {(name || 'U').trim()[0]?.toUpperCase()}
    </span>
  );
}

function Rating({ provider }) {
  const { t } = useTranslation();
  if (!provider?.ratingsCount) return <span className="rt-rating rt-rating--new">{t('requestDetail.newPro', 'Yangi usta')}</span>;
  return (
    <span className="rt-rating">
      <Star size={12} /> {Number(provider.averageRating).toFixed(1)}
      <em>({provider.ratingsCount})</em>
    </span>
  );
}

function ProviderStats({ provider }) {
  const { t } = useTranslation();
  const done = provider?.completedJobs || 0;
  const cancelled = provider?.cancelledJobs || 0;
  if (!done && !cancelled) return null;
  return (
    <span className="rd-stats">
      {done > 0 && <span>{t('requestDetail.jobsDone', '{{count}} ta ish bajargan', { count: done })}</span>}
      {cancelled > 0 && <span className="rd-stats__warn">{t('requestDetail.jobsCancelled', '{{count}} marta bekor qilgan', { count: cancelled })}</span>}
    </span>
  );
}

const MAX_PHOTOS = 3;

function Stepper({ status }) {
  const { t } = useTranslation();
  const current = STEPS.findIndex((s) => s.key === (STEP_OF[status] || status));
  return (
    <ol className="rd-steps">
      {STEPS.map((step, i) => (
        <li key={step.key} className={i < current ? 'is-done' : i === current ? 'is-current' : ''}>
          <span className="rd-steps__dot" />
          <span className="rd-steps__label">{t(`requestDetail.step.${step.key}`)}</span>
        </li>
      ))}
    </ol>
  );
}

function RouteButtons({ location }) {
  const { t } = useTranslation();
  const links = getRouteLinks(location?.lat, location?.lng);
  if (!links.length) return null;
  return (
    <div className="rd-route">
      <span className="rd-route__title"><Navigation size={14} /> {t('requestDetail.route', 'Yo‘lni ochish')}</span>
      <div className="rd-route__list">
        {links.map((link) => (
          <button key={link.key} type="button" className="rd-chip" onClick={() => openRoute(link)}>
            {t(`requestDetail.routeApp.${link.key}`, link.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Usta taklif formasi
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMinutes, setOfferMinutes] = useState(30);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerVisit, setOfferVisit] = useState('');

  // Usta: joyida narxni o'zgartirish va ish rasmlari
  const [priceFormOpen, setPriceFormOpen] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getServiceRequestById(id);
      setRequest(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || t('requestDetail.loadError', 'So‘rovni yuklab bo‘lmadi'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  // Socket: taklif yoki holat o'zgarsa darhol yangilaymiz
  useEffect(() => {
    const socket = getSocket();
    const onChange = (data) => {
      if (String(data?.requestId) === String(id)) load();
    };
    socket.on('request_updated', onChange);
    socket.on('request_status_changed', onChange);
    return () => {
      socket.off('request_updated', onChange);
      socket.off('request_status_changed', onChange);
    };
  }, [id, load]);

  const isProvider = request?.viewer === 'provider';
  const status = request?.status;

  // Yakunlangan ish uchun alohida "Ish bajarildi" sahifasi
  useEffect(() => {
    if (status !== 'completed') return;
    navigate(`${isProvider ? '/provider-requests' : '/requests'}/${id}/done`, { replace: true });
  }, [status, isProvider, id, navigate]);

  const offers = useMemo(
    () => (request?.offers || []).filter((o) => o.status !== 'declined').sort((a, b) => a.price - b.price),
    [request]
  );
  const acceptedOffer = request?.acceptedOfferId
    ? (request.offers || []).find((o) => String(o._id) === String(request.acceptedOfferId))
    : null;
  const selectedOffer = offers.find((o) => o._id === selectedId) || offers[0] || null;

  const run = async (fn, okMessage) => {
    setBusy(true);
    try {
      await fn();
      if (okMessage) toast.success(okMessage);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('requestDetail.actionError', 'Amalni bajarib bo‘lmadi'));
    } finally {
      setBusy(false);
    }
  };

  const uploadPhotos = async (fileList) => {
    const files = [...fileList].slice(0, MAX_PHOTOS - photos.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) urls.push(await uploadFile(file));
      setPhotos((prev) => [...prev, ...urls].slice(0, MAX_PHOTOS));
    } catch (err) {
      toast.error(err.response?.data?.error || t('requestDetail.photoError', 'Rasmni yuklab bo‘lmadi'));
    } finally {
      setUploading(false);
    }
  };

  const finishWork = () => {
    const question = photos.length
      ? t('requestDetail.finishConfirm', 'Ishni tugatdingizmi? Mijozga tasdiqlash uchun yuboriladi.')
      : t('requestDetail.finishConfirmNoPhoto', 'Ishni tugatdingizmi? Bajarilgan ish rasmini qo‘shsangiz, mijoz tezroq tasdiqlaydi.');
    if (!window.confirm(question)) return;
    run(
      () => updateRequestStatus(id, 'completed', '', { photos }),
      t('requestDetail.sentForConfirm', 'Mijozga tasdiqlash uchun yuborildi')
    );
  };

  const declineRequest = () => {
    const reason = window.prompt(t('requestDetail.declinePrompt', 'Nega qabul qila olmaysiz? (ixtiyoriy, mijoz ko‘radi)'), '');
    if (reason === null) return;
    run(async () => {
      await declineServiceRequest(id, reason);
      navigate('/provider-requests', { replace: true });
    }, t('requestDetail.declined', 'Mijozga xabar berildi'));
  };

  const submitPriceChange = (e) => {
    e.preventDefault();
    const value = Number(String(newPrice).replace(/\s/g, ''));
    if (!value || value <= 0) {
      toast.error(t('requestDetail.enterNewPrice', 'Yangi narxni kiriting'));
      return;
    }
    run(async () => {
      await requestPriceChange(id, value, priceReason);
      setPriceFormOpen(false);
      setNewPrice('');
      setPriceReason('');
    }, t('requestDetail.newPriceSent', 'Yangi narx mijozga yuborildi'));
  };

  const cancelRequest = () => {
    if (!window.confirm(t('requestDetail.cancelConfirm', 'So‘rovni bekor qilasizmi?'))) return;
    const reason = isProvider ? t('requestDetail.cancelByPro', 'Usta bekor qildi') : t('tracker.cancelReason', 'Mijoz bekor qildi');
    run(() => updateRequestStatus(id, 'cancelled', reason), t('requestDetail.cancelled', 'So‘rov bekor qilindi'));
  };

  const sendOffer = (e) => {
    e.preventDefault();
    const value = Number(String(offerPrice).replace(/\s/g, ''));
    if (!value || value <= 0) {
      toast.error(t('requestDetail.enterPrice', 'Narxni kiriting'));
      return;
    }
    const scheduled = request?.when && request.when !== 'now';
    const visit = scheduled ? (offerVisit || defaultVisit(request.when)) : '';
    if (scheduled && new Date(visit) < new Date()) {
      toast.error(t('requestDetail.visitPast', 'Kelish vaqti o‘tib ketgan — keyinroq vaqtni tanlang'));
      return;
    }
    run(
      () => sendServiceRequestOffer(id, {
        price: value,
        arrivalMinutes: offerMinutes,
        message: offerMessage,
        ...(visit ? { visitAt: new Date(visit).toISOString() } : {}),
      }),
      t('requestDetail.offerSent', 'Taklif yuborildi')
    );
  };

  if (loading) {
    return <div className="rd-page rd-center"><Loader2 className="rt-spin" size={28} /></div>;
  }
  if (error || !request) {
    return (
      <div className="rd-page rd-center">
        <p className="rt-closed-text">{error || t('requestDetail.notFound', 'So‘rov topilmadi')}</p>
        <button type="button" className="rt-btn rt-btn--ghost" onClick={() => safeGoBack(navigate)}>{t('common.back', 'Orqaga')}</button>
      </div>
    );
  }

  const myOffer = request.myOffer;
  const isMine = isProvider && myOffer?.status === 'accepted';
  const awaitingConfirm = Boolean(request.completionRequestedAt) && status !== 'completed' && status !== 'cancelled';
  const pricePending = request.priceChange?.status === 'pending';
  const providerNext = isMine && !awaitingConfirm ? PROVIDER_NEXT[status] : null;
  // Ish joyida (yetib kelgach, tugatishdan oldin) — narx va rasm shu bosqichda
  const atWork = isMine && ['arrived', 'in_progress'].includes(status) && !awaitingConfirm;
  const showStepper = Boolean(STEP_OF[status] || STEPS.some((s) => s.key === status)) && (!isProvider || isMine);
  const canCancel = !awaitingConfirm
    && ['open', 'accepted', 'on_way', 'arrived'].includes(status)
    && (!isProvider || isMine);
  const accProvider = acceptedOffer?.provider || {};
  const client = request.client || {};
  const clientName = client.fullName || client.full_name || t('requestDone.client', 'Mijoz');

  let title = CLIENT_TITLES.includes(status) ? t(`requestDetail.title.${status}`) : t('requestDetail.title.request', 'So‘rov');
  if (isProvider) {
    if (status === 'open') title = myOffer ? t('providerRequests.status.offerSent') : t('requestDetail.title.makeOffer', 'Taklif bering');
    else if (myOffer && !isMine) title = t('requestDetail.title.otherChosen', 'Mijoz boshqa ustani tanladi');
    else if (awaitingConfirm) title = t('requestDetail.title.awaitingClient', 'Mijoz tasdiqlashi kutilmoqda');
    else if (isMine && status === 'accepted') title = t('requestDetail.title.proChosen', 'Sizni tanlashdi — yo‘lga chiqing');
    else if (isMine && status === 'on_way') title = t('requestDetail.title.proOnWay', 'Manzilga ketyapsiz');
    else if (isMine && ['arrived', 'in_progress'].includes(status)) title = t('requestDetail.title.proAtWork', 'Ishni bajaring');
  } else if (status === 'open' && request.isDirect && offers.length === 0) {
    title = t('requestDetail.title.directWaiting', 'Usta javobini kutyapmiz');
  } else if (status === 'cancelled' && request.declinedAt) {
    title = t('requestDetail.title.declined', 'Usta qabul qila olmadi');
  } else if (awaitingConfirm) {
    title = t('requestDetail.title.confirm', 'Ish bajarildimi?');
  }
  // Xarita faqat ustaga kerak (manzilga borish uchun); mijoz o'z manzilini biladi
  const showMap = isProvider && !['completed', 'cancelled'].includes(status);

  return (
    <div className={`rd-page ${showMap ? '' : 'rd-page--nomap'}`}>
      {showMap ? (
        <div className="rd-map">
          <RequestMap lat={request.location?.lat} lng={request.location?.lng} height={150} />
          <button type="button" className="rd-back" onClick={() => safeGoBack(navigate)} aria-label={t('common.back', 'Orqaga')}>
            <ArrowLeft size={20} />
          </button>
        </div>
      ) : (
        <div className="rd-topbar">
          <button type="button" className="rd-back rd-back--static" onClick={() => safeGoBack(navigate)} aria-label={t('common.back', 'Orqaga')}>
            <ArrowLeft size={20} />
          </button>
        </div>
      )}

      <div className={`rt-panel rd-panel ${showMap ? '' : 'rt-panel--plain'}`}>
        <div className="rt-status">
          <span className="rt-status__eyebrow">
            {serviceLabel(request.category)} · #{String(request._id).slice(-6)}
          </span>
          <h1 className="rt-status__title">{title}</h1>
          {showStepper && <Stepper status={status} />}
        </div>

        <div className="rt-content rd-content">
          {/* ===== MIJOZ: takliflar ===== */}
          {!isProvider && status === 'open' && (
            offers.length === 0 ? (
              <ul className="rt-facts">
                <li><Clock size={16} /><span>{request.isDirect
                  ? t('requestDetail.waitingDirect', 'So‘rov faqat shu ustaga yuborildi. Narx taklif qilishi bilan shu yerda ko‘rinadi.')
                  : t('requestDetail.waiting', 'Ustalar javobini kutyapmiz. Taklif kelishi bilan shu yerda ko‘rinadi.')}</span></li>
              </ul>
            ) : (
              <ul className="rt-list" role="radiogroup">
                {offers.map((offer) => (
                  <li key={offer._id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedOffer?._id === offer._id}
                      className={`rt-row ${selectedOffer?._id === offer._id ? 'is-active' : ''}`}
                      onClick={() => setSelectedId(offer._id)}
                    >
                      <Avatar name={offer.provider?.name} image={offer.provider?.image} size={42} />
                      <span className="rt-row__who">
                        <strong>{offer.provider?.name || t('activeOrder.pro', 'Usta')}</strong>
                        <span className="rt-row__meta">
                          <Rating provider={offer.provider} />
                          <span>· {offer.visitAt ? formatVisit(offer.visitAt) : `${offer.arrivalMinutes || 30} ${t('common.min', 'daq')}`}</span>
                        </span>
                        <ProviderStats provider={offer.provider} />
                        {offer.message && <span className="rt-row__msg rt-row__msg--full">{offer.message}</span>}
                        {offer.provider?._id && (
                          <span
                            role="link"
                            tabIndex={0}
                            className="rd-inline-link"
                            onClick={(e) => { e.stopPropagation(); navigate(`/service-provider/${offer.provider._id}`); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); navigate(`/service-provider/${offer.provider._id}`); } }}
                          >
                            {t('requestDetail.viewProfile', 'Profil va sharhlarni ko‘rish')}
                          </span>
                        )}
                      </span>
                      <span className="rt-row__price">{price(offer.price)}<small>{t('common.sum', 'so‘m')}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {/* ===== MIJOZ: usta joyida yangi narx taklif qildi ===== */}
          {!isProvider && pricePending && (
            <div className="rd-confirm">
              <span className="rd-confirm__label">{t('requestDetail.priceChangeLabel', 'Usta narxni o‘zgartirmoqchi')}</span>
              <div className="rd-price-change">
                <s>{price(request.priceChange.oldPrice)}</s>
                <span>→</span>
                <strong>{price(request.priceChange.newPrice)} {t('common.sum', 'so‘m')}</strong>
              </div>
              <p>{t('requestDetail.reason', 'Sabab: {{reason}}', { reason: request.priceChange.reason })}</p>
            </div>
          )}

          {/* ===== MIJOZ: usta tugatgan ishni tasdiqlash ===== */}
          {!isProvider && awaitingConfirm && (
            <div className="rd-confirm">
              <p>
                {t('requestDetail.confirmText', 'Usta ishni tugatganini bildirdi. Hammasi joyidami? Tasdiqlaganingizdan keyin buyurtma yopiladi va ustani baholashingiz mumkin.')}
              </p>
              {request.completionPhotos?.length > 0 && (
                <div className="rd-photos">
                  {request.completionPhotos.map((url) => (
                    <a key={url} href={getImageUrl(url)} target="_blank" rel="noopener noreferrer">
                      <img src={getImageUrl(url)} alt={t('requestDone.photoAlt', 'Bajarilgan ish rasmi')} />
                    </a>
                  ))}
                </div>
              )}
              <p className="rd-confirm__note">
                {t('requestDetail.autoConfirm', '24 soat ichida javob bermasangiz, ish avtomatik bajarildi deb yopiladi.')}
              </p>
            </div>
          )}

          {/* ===== USTA: mijoz javobini kutish ===== */}
          {isMine && awaitingConfirm && (
            <ul className="rt-facts">
              <li><Clock size={16} /><span>{t('requestDetail.proWaiting', 'Mijoz ish bajarilganini tasdiqlashi bilan buyurtma yopiladi.')}</span></li>
            </ul>
          )}

          {/* ===== MIJOZ: tanlangan usta ===== */}
          {!isProvider && acceptedOffer && status !== 'open' && (
            <div className="rt-master">
              <Avatar name={accProvider.name} image={accProvider.image} size={48} />
              <span className="rt-row__who">
                <strong>{accProvider.name || t('activeOrder.pro', 'Usta')}</strong>
                <span className="rt-row__meta">
                  <Rating provider={accProvider} />
                  <span>· {price(acceptedOffer.price)} {t('common.sum', 'so‘m')}</span>
                </span>
                <ProviderStats provider={accProvider} />
              </span>
              {!['completed', 'cancelled'].includes(status) && (
                <span className="rt-master__actions">
                  {accProvider.phone && (
                    <a className="rt-round" href={`tel:${accProvider.phone}`} aria-label={t('common.call', 'Qo‘ng‘iroq qilish')}><Phone size={18} /></a>
                  )}
                  {accProvider.userId && (
                    <button type="button" className="rt-round" aria-label={t('requestDetail.write', 'Yozish')} onClick={() => navigate(`/chat?userId=${accProvider.userId}`)}>
                      <MessageCircle size={18} />
                    </button>
                  )}
                </span>
              )}
            </div>
          )}

          {/* ===== USTA: taklif formasi ===== */}
          {isProvider && request.canOffer && (
            <form className="rd-offer-form" id="rd-offer-form" onSubmit={sendOffer}>
              <label className="rd-field">
                <span>{t('requestDetail.yourPrice', 'Narxingiz (so‘m)')}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder={t('requestDetail.pricePh', 'Masalan: 150000')}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  required
                />
              </label>
              {request.when && request.when !== 'now' ? (
                <label className="rd-field">
                  <span>{t('requestDetail.visitQ', 'Mijoz “{{when}}” dedi — qachon borasiz?', { when: whenLabel(request.when) })}</span>
                  <input
                    type="datetime-local"
                    value={offerVisit || defaultVisit(request.when)}
                    min={defaultVisit('now').slice(0, 11) + '00:00'}
                    onChange={(e) => setOfferVisit(e.target.value)}
                    required
                  />
                </label>
              ) : (
              <div className="rd-field">
                <span>{t('requestDetail.arrivalQ', 'Qancha vaqtda yetib borasiz?')}</span>
                <div className="rd-route__list">
                  {ARRIVAL_CHOICES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`rd-chip ${offerMinutes === m ? 'is-active' : ''}`}
                      onClick={() => setOfferMinutes(m)}
                    >
                      {m} {t('common.min', 'daq')}
                    </button>
                  ))}
                </div>
              </div>
              )}
              <label className="rd-field">
                <span>{t('requestDetail.noteLabel', 'Mijozga izoh (ixtiyoriy)')}</span>
                <textarea
                  rows={2}
                  placeholder={t('requestDetail.notePh', 'Masalan: materiallar bilan, kafolat 3 oy')}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                />
              </label>
            </form>
          )}

          {/* ===== USTA: yuborilgan taklif ===== */}
          {isProvider && myOffer && (
            <div className="rt-row" role="presentation">
              <span className="rt-row__who">
                <strong>{t('requestDetail.yourOffer', 'Sizning taklifingiz')}</strong>
                <span className="rt-row__meta">
                  {myOffer.visitAt ? formatVisit(myOffer.visitAt) : `~${myOffer.arrivalMinutes} ${t('common.min', 'daq')}`}
                  {['pending', 'accepted', 'declined'].includes(myOffer.status) && ` · ${t(`requestDetail.offerStatus.${myOffer.status}`)}`}
                </span>
              </span>
              <span className="rt-row__price">{price(myOffer.price)}<small>{t('common.sum', 'so‘m')}</small></span>
            </div>
          )}

          {/* ===== USTA: mijoz bilan aloqa va yo'l ===== */}
          {isMine && !['completed', 'cancelled'].includes(status) && (
            <>
              <div className="rt-master">
                <Avatar name={clientName} image={client.avatar_url} size={48} />
                <span className="rt-row__who">
                  <strong>{clientName}</strong>
                  <span className="rt-row__meta">{t('requestDone.client', 'Mijoz')}</span>
                </span>
                <span className="rt-master__actions">
                  {client.phone && (
                    <a className="rt-round" href={`tel:${client.phone}`} aria-label={t('common.call', 'Qo‘ng‘iroq qilish')}><Phone size={18} /></a>
                  )}
                  {client._id && (
                    <button type="button" className="rt-round" aria-label={t('requestDetail.write', 'Yozish')} onClick={() => navigate(`/chat?userId=${client._id}`)}>
                      <MessageCircle size={18} />
                    </button>
                  )}
                </span>
              </div>
              {['accepted', 'on_way'].includes(status) && <RouteButtons location={request.location} />}
            </>
          )}

          {atWork && pricePending && (
            <ul className="rt-facts">
              <li>
                <Clock size={16} />
                <span>
                  {t('requestDetail.newPriceWaiting', 'Yangi narx ({{price}} so‘m) mijozga yuborildi. Javobini kutyapmiz.', { price: price(request.priceChange.newPrice) })}
                </span>
              </li>
            </ul>
          )}

          {atWork && !pricePending && (
            priceFormOpen ? (
              <form className="rd-offer-form rd-box" id="rd-price-form" onSubmit={submitPriceChange}>
                <label className="rd-field">
                  <span>{t('requestDetail.newPriceLabel', 'Yangi narx (hozir {{price}} so‘m)', { price: price(myOffer?.price) })}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                  />
                </label>
                <label className="rd-field">
                  <span>{t('requestDetail.whyChanged', 'Nega o‘zgardi? (mijoz ko‘radi)')}</span>
                  <textarea
                    rows={2}
                    placeholder={t('requestDetail.whyPh', 'Masalan: quvur ham almashtirilishi kerak ekan')}
                    value={priceReason}
                    onChange={(e) => setPriceReason(e.target.value)}
                    required
                  />
                </label>
                <div className="rd-form-actions">
                  <button type="button" className="rt-btn rt-btn--text" onClick={() => setPriceFormOpen(false)}>
                    {t('requestDetail.cancelShort', 'Bekor')}
                  </button>
                  <button type="submit" className="rt-btn rt-btn--ghost" disabled={busy}>
                    {t('requestDetail.sendToClient', 'Mijozga yuborish')}
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" className="rd-link-btn" onClick={() => setPriceFormOpen(true)}>
                {t('requestDetail.proposePrice', 'Narx o‘zgardimi? Yangi narx taklif qilish')}
              </button>
            )
          )}

          {atWork && (
            <div className="rd-box">
              <span className="rd-field__title">
                <Camera size={14} /> {t('requestDetail.photosLabel', 'Bajarilgan ish rasmi (ixtiyoriy, {{count}} tagacha)', { count: MAX_PHOTOS })}
              </span>
              <div className="rd-photos">
                {photos.map((url) => (
                  <span key={url} className="rd-photo">
                    <img src={getImageUrl(url)} alt="" />
                    <button
                      type="button"
                      aria-label={t('common.delete', 'O‘chirish')}
                      onClick={() => setPhotos((prev) => prev.filter((u) => u !== url))}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="rd-photo rd-photo--add">
                    {uploading ? <Loader2 size={20} className="rt-spin" /> : <Camera size={20} />}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      hidden
                      disabled={uploading}
                      onChange={(e) => { uploadPhotos(e.target.files); e.target.value = ''; }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* ===== Umumiy ma'lumot ===== */}
          <ul className="rt-facts rd-facts">
            {request.when && request.when !== 'now' && (
              <li><Clock size={16} /><span>{t('requestDetail.whenNeeded', 'Kerak: {{when}}', { when: whenLabel(request.when) })}</span></li>
            )}
            {request.description && <li><FileText size={16} /><span>{request.description}</span></li>}
            {request.location?.address && <li><MapPin size={16} /><span>{request.location.address}</span></li>}
            <li>
              <Clock size={16} />
              <span>{new Date(request.createdAt).toLocaleString(currentLocale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </li>
          </ul>

          {['accepted', 'declined'].includes(request.priceChange?.status) && (
            <p className="rt-closed-text">
              {request.priceChange.status === 'accepted'
                ? t('requestDetail.priceAgreed', 'Narx kelishildi: {{price}} so‘m', { price: price(request.priceChange.newPrice) })
                : t('requestDetail.priceRejected', 'Yangi narx rad etildi, narx o‘zgarmadi: {{price}} so‘m', { price: price(request.priceChange.oldPrice) })}
            </p>
          )}

          {status === 'cancelled' && request.cancelReason && (
            <p className="rt-closed-text">{t('requestDetail.reason', 'Sabab: {{reason}}', { reason: request.cancelReason })}</p>
          )}
          {status === 'completed' && request.review && (
            <p className="rd-review"><CheckCircle2 size={16} /> {t('requestDetail.rated', 'Baholangan: {{rating}} / 5', { rating: request.review.rating })}</p>
          )}
        </div>

        {/* ===== Pastki tugmalar ===== */}
        <footer className="rt-foot rd-foot">
          {!isProvider && status === 'open' && selectedOffer && (
            <button
              type="button"
              className="rt-btn rt-btn--primary"
              disabled={busy}
              onClick={() => run(() => acceptServiceRequestOffer(id, selectedOffer._id), t('requestDetail.proChosen', 'Usta tanlandi'))}
            >
              {busy ? <Loader2 size={18} className="rt-spin" /> : null}
              {t('incomingOffer.choose', 'Tanlash · {{price}} so‘m', { price: price(selectedOffer.price) })}
            </button>
          )}

          {isProvider && request.canOffer && (
            <button type="submit" form="rd-offer-form" className="rt-btn rt-btn--primary" disabled={busy}>
              {busy ? <Loader2 size={18} className="rt-spin" /> : null}
              {t('requestDetail.sendOffer', 'Taklif yuborish')}
            </button>
          )}

          {isProvider && request.canOffer && request.isDirect && (
            <button type="button" className="rt-btn rt-btn--text" onClick={declineRequest} disabled={busy}>
              {t('requestDetail.declineBtn', 'Qabul qila olmayman')}
            </button>
          )}

          {!isProvider && status === 'cancelled' && request.declinedAt && (
            <button type="button" className="rt-btn rt-btn--primary" onClick={() => navigate(`/request?category=${encodeURIComponent(request.category)}`)}>
              {t('requestDetail.findOther', 'Boshqa usta topish')}
            </button>
          )}

          {providerNext && !(pricePending && providerNext.next === 'completed') && (
            <button
              type="button"
              className="rt-btn rt-btn--primary"
              disabled={busy || uploading}
              onClick={() =>
                providerNext.next === 'completed'
                  ? finishWork()
                  : run(() => updateRequestStatus(id, providerNext.next))
              }
            >
              {busy ? <Loader2 size={18} className="rt-spin" /> : null}
              {t(`requestDetail.next.${providerNext.label}`)}
            </button>
          )}

          {!isProvider && pricePending && (
            <>
              <button
                type="button"
                className="rt-btn rt-btn--primary"
                disabled={busy}
                onClick={() => run(() => respondPriceChange(id, true), t('requestDetail.priceAccepted', 'Yangi narx qabul qilindi'))}
              >
                {t('requestDetail.agree', 'Roziman · {{price}} so‘m', { price: price(request.priceChange.newPrice) })}
              </button>
              <button
                type="button"
                className="rt-btn rt-btn--text"
                disabled={busy}
                onClick={() => run(() => respondPriceChange(id, false), t('requestDetail.priceKept', 'Narx o‘zgarmadi'))}
              >
                {t('requestDetail.decline', 'Rad etaman, eski narx qolsin')}
              </button>
            </>
          )}

          {!isProvider && awaitingConfirm && (
            <>
              <button
                type="button"
                className="rt-btn rt-btn--primary"
                disabled={busy}
                onClick={() => run(async () => {
                  await updateRequestStatus(id, 'completed');
                  navigate(`/requests/${id}/done`, { replace: true });
                })}
              >
                {busy ? <Loader2 size={18} className="rt-spin" /> : <CheckCircle2 size={18} />}
                {t('requestDetail.yesDone', 'Ha, ish bajarildi')}
              </button>
              {accProvider.userId && (
                <button
                  type="button"
                  className="rt-btn rt-btn--text"
                  onClick={() => navigate(`/chat?userId=${accProvider.userId}`)}
                >
                  {t('requestDetail.problem', 'Muammo bor — ustaga yozish')}
                </button>
              )}
            </>
          )}

          {!isProvider && status === 'completed' && !request.review && (
            <button type="button" className="rt-btn rt-btn--primary" onClick={() => navigate(`/requests/${id}/done`)}>
              {t('requestDetail.rate', 'Ustani baholash')}
            </button>
          )}

          {canCancel && (
            <button type="button" className="rt-btn rt-btn--text" onClick={cancelRequest} disabled={busy}>
              {t('requestDetail.cancelRequest', 'So‘rovni bekor qilish')}
            </button>
          )}
        </footer>
      </div>

    </div>
  );
}
