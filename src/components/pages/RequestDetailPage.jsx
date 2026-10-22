/* ============================================================
   REQUEST DETAIL PAGE — /requests/:id (mijoz), /provider-requests/:id (usta)
   Backend ko'ruvchiga qarab viewer: 'client' | 'provider' qaytaradi.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Clock, MapPin, Star, Phone, MessageCircle, Navigation,
  Loader2, CheckCircle2, FileText, Camera, X,
} from 'lucide-react';
import { toast } from 'react-toastify';

import RequestMap from '../common/RequestMap';
import RatingModal from '../common/RatingModal';
import { getSocket } from '../lib/socket';
import {
  getServiceRequestById,
  acceptServiceRequestOffer,
  sendServiceRequestOffer,
  updateRequestStatus,
  requestPriceChange,
  respondPriceChange,
} from '../services/serviceRequests';
import { uploadFile } from '../services/upload';
import { getImageUrl } from '../utils/imageUrl';
import { getRouteLinks, openRoute } from '../utils/routeLinks';
import { safeGoBack } from '../utils/navigation.js';

import '../../styles/requestTracker.css';
import '../../styles/requestDetail.css';

const POLL_MS = 10000;

const STEPS = [
  { key: 'accepted', label: 'Tanlandi' },
  { key: 'on_way', label: 'Yo‘lda' },
  { key: 'arrived', label: 'Yetib keldi' },
  { key: 'completed', label: 'Tugadi' },
];
// in_progress ham "Yetib keldi" qadamida ko'rinadi
const STEP_OF = { in_progress: 'arrived' };

// Usta bosadigan keyingi qadam. "Ishni tugatdim" so'rovni yopmaydi —
// mijoz tasdiqlagandan keyin "Tugadi" bo'ladi.
const PROVIDER_NEXT = {
  accepted: { next: 'on_way', label: 'Yo‘lga chiqdim' },
  on_way: { next: 'arrived', label: 'Yetib keldim' },
  arrived: { next: 'completed', label: 'Ishni tugatdim' },
  in_progress: { next: 'completed', label: 'Ishni tugatdim' },
};

const CLIENT_TITLES = {
  open: 'Takliflar',
  accepted: 'Usta tanlandi',
  on_way: 'Usta yo‘lda',
  arrived: 'Usta yetib keldi',
  in_progress: 'Usta ishlayapti',
  completed: 'Ish yakunlandi',
  cancelled: 'So‘rov bekor qilindi',
};

const ARRIVAL_CHOICES = [15, 30, 45, 60];

const price = (v) => Number(v || 0).toLocaleString('uz-UZ');

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
  if (!provider?.ratingsCount) return <span className="rt-rating rt-rating--new">yangi</span>;
  return (
    <span className="rt-rating">
      <Star size={12} /> {Number(provider.averageRating).toFixed(1)}
      <em>({provider.ratingsCount})</em>
    </span>
  );
}

function ProviderStats({ provider }) {
  const done = provider?.completedJobs || 0;
  const cancelled = provider?.cancelledJobs || 0;
  if (!done && !cancelled) return null;
  return (
    <span className="rd-stats">
      {done > 0 && <span>{done} ta ish bajargan</span>}
      {cancelled > 0 && <span className="rd-stats__warn">{cancelled} marta bekor qilgan</span>}
    </span>
  );
}

const MAX_PHOTOS = 3;

function Stepper({ status }) {
  const current = STEPS.findIndex((s) => s.key === (STEP_OF[status] || status));
  return (
    <ol className="rd-steps">
      {STEPS.map((step, i) => (
        <li key={step.key} className={i < current ? 'is-done' : i === current ? 'is-current' : ''}>
          <span className="rd-steps__dot" />
          <span className="rd-steps__label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

function RouteButtons({ location }) {
  const links = getRouteLinks(location?.lat, location?.lng);
  if (!links.length) return null;
  return (
    <div className="rd-route">
      <span className="rd-route__title"><Navigation size={14} /> Yo‘lni ochish</span>
      <div className="rd-route__list">
        {links.map((link) => (
          <button key={link.key} type="button" className="rd-chip" onClick={() => openRoute(link)}>
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [ratingOpen, setRatingOpen] = useState(false);

  // Usta taklif formasi
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMinutes, setOfferMinutes] = useState(30);
  const [offerMessage, setOfferMessage] = useState('');

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
      setError(err.response?.data?.error || 'So‘rovni yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  }, [id]);

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
      toast.error(err.response?.data?.error || 'Amalni bajarib bo‘lmadi');
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
      toast.error(err.response?.data?.error || 'Rasmni yuklab bo‘lmadi');
    } finally {
      setUploading(false);
    }
  };

  const finishWork = () =>
    run(
      () => updateRequestStatus(id, 'completed', '', { photos }),
      'Mijozga tasdiqlash uchun yuborildi'
    );

  const submitPriceChange = (e) => {
    e.preventDefault();
    const value = Number(String(newPrice).replace(/\s/g, ''));
    if (!value || value <= 0) {
      toast.error('Yangi narxni kiriting');
      return;
    }
    run(async () => {
      await requestPriceChange(id, value, priceReason);
      setPriceFormOpen(false);
      setNewPrice('');
      setPriceReason('');
    }, 'Yangi narx mijozga yuborildi');
  };

  const cancelRequest = () => {
    if (!window.confirm('So‘rovni bekor qilasizmi?')) return;
    const reason = isProvider ? 'Usta bekor qildi' : 'Mijoz bekor qildi';
    run(() => updateRequestStatus(id, 'cancelled', reason), 'So‘rov bekor qilindi');
  };

  const sendOffer = (e) => {
    e.preventDefault();
    const value = Number(String(offerPrice).replace(/\s/g, ''));
    if (!value || value <= 0) {
      toast.error('Narxni kiriting');
      return;
    }
    run(
      () => sendServiceRequestOffer(id, { price: value, arrivalMinutes: offerMinutes, message: offerMessage }),
      'Taklif yuborildi'
    );
  };

  if (loading) {
    return <div className="rd-page rd-center"><Loader2 className="rt-spin" size={28} /></div>;
  }
  if (error || !request) {
    return (
      <div className="rd-page rd-center">
        <p className="rt-closed-text">{error || 'So‘rov topilmadi'}</p>
        <button type="button" className="rt-btn rt-btn--ghost" onClick={() => safeGoBack(navigate)}>Orqaga</button>
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
  const clientName = client.fullName || client.full_name || 'Mijoz';

  let title = CLIENT_TITLES[status] || 'So‘rov';
  if (isProvider) {
    if (status === 'open') title = myOffer ? 'Taklifingiz yuborildi' : 'Taklif bering';
    else if (myOffer && !isMine) title = 'Mijoz boshqa ustani tanladi';
    else if (awaitingConfirm) title = 'Mijoz tasdiqlashi kutilmoqda';
  } else if (awaitingConfirm) {
    title = 'Ish bajarildimi?';
  }
  // Xarita faqat ustaga kerak (manzilga borish uchun); mijoz o'z manzilini biladi
  const showMap = isProvider && !['completed', 'cancelled'].includes(status);

  return (
    <div className="rd-page">
      {showMap ? (
        <div className="rd-map">
          <RequestMap lat={request.location?.lat} lng={request.location?.lng} height={150} />
          <button type="button" className="rd-back" onClick={() => safeGoBack(navigate)} aria-label="Orqaga">
            <ArrowLeft size={20} />
          </button>
        </div>
      ) : (
        <div className="rd-topbar">
          <button type="button" className="rd-back rd-back--static" onClick={() => safeGoBack(navigate)} aria-label="Orqaga">
            <ArrowLeft size={20} />
          </button>
        </div>
      )}

      <div className={`rt-panel rd-panel ${showMap ? '' : 'rt-panel--plain'}`}>
        <div className="rt-status">
          <span className="rt-status__eyebrow">
            {request.category} · #{String(request._id).slice(-6)}
          </span>
          <h1 className="rt-status__title">{title}</h1>
          {showStepper && <Stepper status={status} />}
        </div>

        <div className="rt-content rd-content">
          {/* ===== MIJOZ: takliflar ===== */}
          {!isProvider && status === 'open' && (
            offers.length === 0 ? (
              <ul className="rt-facts">
                <li><Clock size={16} /><span>Ustalar javobini kutyapmiz. Taklif kelishi bilan shu yerda ko‘rinadi.</span></li>
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
                        <strong>{offer.provider?.name || 'Usta'}</strong>
                        <span className="rt-row__meta">
                          <Rating provider={offer.provider} />
                          <span>· {offer.arrivalMinutes || 30} daq</span>
                        </span>
                        <ProviderStats provider={offer.provider} />
                        {offer.message && <span className="rt-row__msg">{offer.message}</span>}
                      </span>
                      <span className="rt-row__price">{price(offer.price)}<small>so‘m</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {/* ===== MIJOZ: usta joyida yangi narx taklif qildi ===== */}
          {!isProvider && pricePending && (
            <div className="rd-confirm">
              <span className="rd-confirm__label">Usta narxni o‘zgartirmoqchi</span>
              <div className="rd-price-change">
                <s>{price(request.priceChange.oldPrice)}</s>
                <span>→</span>
                <strong>{price(request.priceChange.newPrice)} so‘m</strong>
              </div>
              <p>Sabab: {request.priceChange.reason}</p>
            </div>
          )}

          {/* ===== MIJOZ: usta tugatgan ishni tasdiqlash ===== */}
          {!isProvider && awaitingConfirm && (
            <div className="rd-confirm">
              <p>
                Usta ishni tugatganini bildirdi. Hammasi joyidami? Tasdiqlaganingizdan keyin
                buyurtma yopiladi va ustani baholashingiz mumkin.
              </p>
              {request.completionPhotos?.length > 0 && (
                <div className="rd-photos">
                  {request.completionPhotos.map((url) => (
                    <a key={url} href={getImageUrl(url)} target="_blank" rel="noopener noreferrer">
                      <img src={getImageUrl(url)} alt="Bajarilgan ish" />
                    </a>
                  ))}
                </div>
              )}
              <p className="rd-confirm__note">
                24 soat ichida javob bermasangiz, ish avtomatik bajarildi deb yopiladi.
              </p>
            </div>
          )}

          {/* ===== USTA: mijoz javobini kutish ===== */}
          {isMine && awaitingConfirm && (
            <ul className="rt-facts">
              <li><Clock size={16} /><span>Mijoz ish bajarilganini tasdiqlashi bilan buyurtma yopiladi.</span></li>
            </ul>
          )}

          {/* ===== MIJOZ: tanlangan usta ===== */}
          {!isProvider && acceptedOffer && status !== 'open' && (
            <div className="rt-master">
              <Avatar name={accProvider.name} image={accProvider.image} size={48} />
              <span className="rt-row__who">
                <strong>{accProvider.name || 'Usta'}</strong>
                <span className="rt-row__meta">
                  <Rating provider={accProvider} />
                  <span>· {price(acceptedOffer.price)} so‘m</span>
                </span>
                <ProviderStats provider={accProvider} />
              </span>
              {!['completed', 'cancelled'].includes(status) && (
                <span className="rt-master__actions">
                  {accProvider.phone && (
                    <a className="rt-round" href={`tel:${accProvider.phone}`} aria-label="Qo‘ng‘iroq"><Phone size={18} /></a>
                  )}
                  {accProvider.userId && (
                    <button type="button" className="rt-round" aria-label="Yozish" onClick={() => navigate(`/chat?userId=${accProvider.userId}`)}>
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
                <span>Narxingiz (so‘m)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="Masalan: 150000"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  required
                />
              </label>
              <div className="rd-field">
                <span>Qancha vaqtda yetib borasiz?</span>
                <div className="rd-route__list">
                  {ARRIVAL_CHOICES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`rd-chip ${offerMinutes === m ? 'is-active' : ''}`}
                      onClick={() => setOfferMinutes(m)}
                    >
                      {m} daq
                    </button>
                  ))}
                </div>
              </div>
              <label className="rd-field">
                <span>Mijozga izoh (ixtiyoriy)</span>
                <textarea
                  rows={2}
                  placeholder="Masalan: materiallar bilan, kafolat 3 oy"
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
                <strong>Sizning taklifingiz</strong>
                <span className="rt-row__meta">
                  ~{myOffer.arrivalMinutes} daq
                  {myOffer.status === 'pending' && ' · javob kutilmoqda'}
                  {myOffer.status === 'accepted' && ' · qabul qilindi'}
                  {myOffer.status === 'declined' && ' · tanlanmadi'}
                </span>
              </span>
              <span className="rt-row__price">{price(myOffer.price)}<small>so‘m</small></span>
            </div>
          )}

          {/* ===== USTA: mijoz bilan aloqa va yo'l ===== */}
          {isMine && !['completed', 'cancelled'].includes(status) && (
            <>
              <div className="rt-master">
                <Avatar name={clientName} image={client.avatar_url} size={48} />
                <span className="rt-row__who">
                  <strong>{clientName}</strong>
                  <span className="rt-row__meta">Mijoz</span>
                </span>
                <span className="rt-master__actions">
                  {client.phone && (
                    <a className="rt-round" href={`tel:${client.phone}`} aria-label="Qo‘ng‘iroq"><Phone size={18} /></a>
                  )}
                  {client._id && (
                    <button type="button" className="rt-round" aria-label="Yozish" onClick={() => navigate(`/chat?userId=${client._id}`)}>
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
                  Yangi narx ({price(request.priceChange.newPrice)} so‘m) mijozga yuborildi. Javobini kutyapmiz.
                </span>
              </li>
            </ul>
          )}

          {atWork && !pricePending && (
            priceFormOpen ? (
              <form className="rd-offer-form rd-box" id="rd-price-form" onSubmit={submitPriceChange}>
                <label className="rd-field">
                  <span>Yangi narx (hozir {price(myOffer?.price)} so‘m)</span>
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
                  <span>Nega o‘zgardi? (mijoz ko‘radi)</span>
                  <textarea
                    rows={2}
                    placeholder="Masalan: quvur ham almashtirilishi kerak ekan"
                    value={priceReason}
                    onChange={(e) => setPriceReason(e.target.value)}
                    required
                  />
                </label>
                <div className="rd-form-actions">
                  <button type="button" className="rt-btn rt-btn--text" onClick={() => setPriceFormOpen(false)}>
                    Bekor
                  </button>
                  <button type="submit" className="rt-btn rt-btn--ghost" disabled={busy}>
                    Mijozga yuborish
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" className="rd-link-btn" onClick={() => setPriceFormOpen(true)}>
                Narx o‘zgardimi? Yangi narx taklif qilish
              </button>
            )
          )}

          {atWork && (
            <div className="rd-box">
              <span className="rd-field__title">
                <Camera size={14} /> Bajarilgan ish rasmi (ixtiyoriy, {MAX_PHOTOS} tagacha)
              </span>
              <div className="rd-photos">
                {photos.map((url) => (
                  <span key={url} className="rd-photo">
                    <img src={getImageUrl(url)} alt="" />
                    <button
                      type="button"
                      aria-label="O‘chirish"
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
            {request.description && <li><FileText size={16} /><span>{request.description}</span></li>}
            {request.location?.address && <li><MapPin size={16} /><span>{request.location.address}</span></li>}
            <li>
              <Clock size={16} />
              <span>{new Date(request.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </li>
          </ul>

          {['accepted', 'declined'].includes(request.priceChange?.status) && (
            <p className="rt-closed-text">
              {request.priceChange.status === 'accepted'
                ? `Narx kelishildi: ${price(request.priceChange.newPrice)} so‘m`
                : `Yangi narx rad etildi, narx o‘zgarmadi: ${price(request.priceChange.oldPrice)} so‘m`}
            </p>
          )}

          {status === 'cancelled' && request.cancelReason && (
            <p className="rt-closed-text">Sabab: {request.cancelReason}</p>
          )}
          {status === 'completed' && request.review && (
            <p className="rd-review"><CheckCircle2 size={16} /> Baholangan: {request.review.rating} / 5</p>
          )}
        </div>

        {/* ===== Pastki tugmalar ===== */}
        <footer className="rt-foot rd-foot">
          {!isProvider && status === 'open' && selectedOffer && (
            <button
              type="button"
              className="rt-btn rt-btn--primary"
              disabled={busy}
              onClick={() => run(() => acceptServiceRequestOffer(id, selectedOffer._id), 'Usta tanlandi')}
            >
              {busy ? <Loader2 size={18} className="rt-spin" /> : null}
              Tanlash · {price(selectedOffer.price)} so‘m
            </button>
          )}

          {isProvider && request.canOffer && (
            <button type="submit" form="rd-offer-form" className="rt-btn rt-btn--primary" disabled={busy}>
              {busy ? <Loader2 size={18} className="rt-spin" /> : null}
              Taklif yuborish
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
              {providerNext.label}
            </button>
          )}

          {!isProvider && pricePending && (
            <>
              <button
                type="button"
                className="rt-btn rt-btn--primary"
                disabled={busy}
                onClick={() => run(() => respondPriceChange(id, true), 'Yangi narx qabul qilindi')}
              >
                Roziman · {price(request.priceChange.newPrice)} so‘m
              </button>
              <button
                type="button"
                className="rt-btn rt-btn--text"
                disabled={busy}
                onClick={() => run(() => respondPriceChange(id, false), 'Narx o‘zgarmadi')}
              >
                Rad etaman, eski narx qolsin
              </button>
            </>
          )}

          {!isProvider && awaitingConfirm && (
            <>
              <button
                type="button"
                className="rt-btn rt-btn--primary"
                disabled={busy}
                onClick={() => run(() => updateRequestStatus(id, 'completed'), 'Rahmat! Buyurtma yopildi')}
              >
                {busy ? <Loader2 size={18} className="rt-spin" /> : <CheckCircle2 size={18} />}
                Ha, ish bajarildi
              </button>
              {accProvider.userId && (
                <button
                  type="button"
                  className="rt-btn rt-btn--text"
                  onClick={() => navigate(`/chat?userId=${accProvider.userId}`)}
                >
                  Muammo bor — ustaga yozish
                </button>
              )}
            </>
          )}

          {!isProvider && status === 'completed' && !request.review && (
            <button type="button" className="rt-btn rt-btn--primary" onClick={() => setRatingOpen(true)}>
              Ustani baholash
            </button>
          )}

          {canCancel && (
            <button type="button" className="rt-btn rt-btn--text" onClick={cancelRequest} disabled={busy}>
              So‘rovni bekor qilish
            </button>
          )}
        </footer>
      </div>

      <RatingModal
        isOpen={ratingOpen}
        request={request}
        onClose={() => setRatingOpen(false)}
        onSubmitted={() => { setRatingOpen(false); load(); }}
      />
    </div>
  );
}
