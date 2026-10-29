/* ============================================================
   REQUEST DONE PAGE — /requests/:id/done (mijoz), /provider-requests/:id/done (usta)
   Ish yakunlangach: kvitansiya, ish rasmlari, mijoz uchun baholash.
   Avval bu RatingModal (oyna) edi.
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Star, MapPin, Clock, Loader2, Home, Wrench, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';

import { getServiceRequestById, submitServiceReview } from '../services/serviceRequests';
import { getImageUrl } from '../utils/imageUrl';
import { serviceLabel } from '../utils/i18nHelpers';

import '../../styles/requestDone.css';

// Teglar kalit bilan saqlanadi; izohga joriy tildagi matni yoziladi
const GOOD_TAGS = ['fast', 'quality', 'polite', 'clean', 'fairPrice'];
const BAD_TAGS = ['late', 'lowQuality', 'priceUp', 'rude', 'unfinished'];
const LOCALES = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

const price = (v) => Number(v || 0).toLocaleString('uz-UZ');

function duration(from, to, t) {
  if (!from || !to) return null;
  const minutes = Math.max(1, Math.round((new Date(to) - new Date(from)) / 60000));
  if (minutes < 60) return t('requestDone.minutes', '{{count}} daqiqa', { count: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m
    ? t('requestDone.hoursMinutes', '{{h}} soat {{m}} daqiqa', { h, m })
    : t('requestDone.hours', '{{count}} soat', { count: h });
}

function Avatar({ name, image }) {
  const [broken, setBroken] = useState(false);
  if (image && !broken) {
    return <img className="rdn-avatar" src={getImageUrl(image)} alt="" onError={() => setBroken(true)} />;
  }
  return <span className="rdn-avatar rdn-avatar--letter">{(name || 'U').trim()[0]?.toUpperCase()}</span>;
}

function Stars({ value, onChange, size = 40, readOnly = false }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={`rdn-stars ${readOnly ? 'is-readonly' : ''}`} role={readOnly ? 'img' : 'radiogroup'} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role={readOnly ? undefined : 'radio'}
          aria-checked={readOnly ? undefined : value === n}
          aria-label={t('requestDone.stars', '{{count}} yulduz', { count: n })}
          disabled={readOnly}
          className={n <= shown ? 'is-on' : ''}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => onChange?.(n)}
        >
          <Star size={size} strokeWidth={1.6} />
        </button>
      ))}
    </div>
  );
}

export default function RequestDonePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'uz').split('-')[0];

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getServiceRequestById(id);
      setRequest(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || t('requestDone.loadError', 'Ma’lumotni yuklab bo‘lmadi'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  // Ish hali yakunlanmagan bo'lsa — oddiy tafsilotlar sahifasiga
  useEffect(() => {
    if (!request || request.status === 'completed') return;
    const base = request.viewer === 'provider' ? '/provider-requests' : '/requests';
    navigate(`${base}/${id}`, { replace: true });
  }, [request, id, navigate]);

  const toggleTag = (tag) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const pickRating = (n) => {
    // Baho yaxshi/yomon tomonga o'zgarsa, mos kelmaydigan teglar tozalanadi
    if ((n >= 4) !== (rating >= 4)) setTags([]);
    setRating(n);
  };

  const submit = async () => {
    if (!rating) return;
    setSending(true);
    try {
      const text = [tags.map((tag) => t(`requestDone.tag.${tag}`)).join(', '), comment.trim()].filter(Boolean).join('. ');
      await submitServiceReview(id, rating, text);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('requestDone.sendError', 'Bahoni yuborib bo‘lmadi'));
    } finally {
      setSending(false);
    }
  };

  if (loading || !request || request.status !== 'completed') {
    return <div className="rdn-page rdn-center"><Loader2 size={28} className="rdn-spin" /></div>;
  }

  const isProvider = request.viewer === 'provider';
  const accepted = !isProvider
    ? (request.offers || []).find((o) => String(o._id) === String(request.acceptedOfferId))
    : null;
  const person = isProvider
    ? { name: request.client?.fullName || request.client?.full_name || t('requestDone.client', 'Mijoz'), image: request.client?.avatar_url, role: t('requestDone.client', 'Mijoz') }
    : { name: accepted?.provider?.name || t('requestDone.provider', 'Usta'), image: accepted?.provider?.image, role: t('requestDone.provider', 'Usta') };
  const total = isProvider ? request.myOffer?.price : accepted?.price;
  const workTime = duration(request.arrivedAt || request.startedAt || request.acceptedAt, request.completedAt, t);
  const priceChanged = request.priceChange?.status === 'accepted';
  const review = request.review;
  const tagOptions = rating >= 4 ? GOOD_TAGS : BAD_TAGS;

  return (
    <div className="rdn-page">
      <button type="button" className="rdn-close" onClick={() => navigate('/home')} aria-label={t('requestDone.close', 'Yopish')}>
        <X size={20} />
      </button>

      <div className="rdn-wrap">
        {/* ---------- Muvaffaqiyat ---------- */}
        <header className="rdn-hero">
          <svg className="rdn-check" viewBox="0 0 80 80" aria-hidden="true">
            <circle className="rdn-check__ring" cx="40" cy="40" r="36" />
            <path className="rdn-check__tick" d="M25 41 L36 52 L56 30" />
          </svg>
          <h1>{isProvider ? t('requestDone.titleProvider', 'Ish yakunlandi') : t('requestDone.title', 'Ish bajarildi')}</h1>
          <p>
            {new Date(request.completedAt || request.closedAt || request.createdAt).toLocaleString(LOCALES[lang] || 'uz-UZ', {
              day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </header>

        {/* ---------- Kvitansiya ---------- */}
        <section className="rdn-receipt">
          <div className="rdn-person">
            <Avatar name={person.name} image={person.image} />
            <div>
              <span className="rdn-label">{person.role}</span>
              <strong>{person.name}</strong>
            </div>
          </div>

          <dl className="rdn-rows">
            <div><dt><Wrench size={14} /> {t('requestDone.service', 'Xizmat')}</dt><dd>{serviceLabel(request.category)}</dd></div>
            {request.location?.address && (
              <div><dt><MapPin size={14} /> {t('requestDone.address', 'Manzil')}</dt><dd>{request.location.address}</dd></div>
            )}
            {workTime && <div><dt><Clock size={14} /> {t('requestDone.duration', 'Ish davomiyligi')}</dt><dd>{workTime}</dd></div>}
            {priceChanged && (
              <div><dt>{t('requestDone.initialPrice', 'Dastlabki narx')}</dt><dd className="rdn-strike">{price(request.priceChange.oldPrice)} {t('requestDone.sum', 'so‘m')}</dd></div>
            )}
          </dl>

          <div className="rdn-total">
            <span>{isProvider ? t('requestDone.earned', 'Ishlab topildi') : t('requestDone.total', 'Jami to‘lov')}</span>
            <strong>{price(total)} <small>{t('requestDone.sum', 'so‘m')}</small></strong>
          </div>
          {priceChanged && <p className="rdn-hint">{t('requestDone.priceAgreed', 'Narx ish joyida kelishilgan: {{reason}}', { reason: request.priceChange.reason })}</p>}
        </section>

        {/* ---------- Ish rasmlari ---------- */}
        {request.completionPhotos?.length > 0 && (
          <section className="rdn-block">
            <h2>{t('requestDone.photos', 'Bajarilgan ish')}</h2>
            <div className="rdn-photos">
              {request.completionPhotos.map((url) => (
                <a key={url} href={getImageUrl(url)} target="_blank" rel="noopener noreferrer">
                  <img src={getImageUrl(url)} alt={t('requestDone.photoAlt', 'Bajarilgan ish rasmi')} />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Baho ---------- */}
        {review ? (
          <section className="rdn-block rdn-review">
            <h2>{isProvider ? t('requestDone.clientRating', 'Mijoz bahosi') : t('requestDone.thanks', 'Bahoingiz uchun rahmat')}</h2>
            <Stars value={review.rating} readOnly size={28} />
            {review.comment && <p>“{review.comment}”</p>}
          </section>
        ) : isProvider ? (
          <section className="rdn-block rdn-review">
            <h2>{t('requestDone.clientRating', 'Mijoz bahosi')}</h2>
            <p className="rdn-hint">{t('requestDone.notRated', 'Mijoz hali baholamadi. Baholaganda bildirishnoma keladi.')}</p>
          </section>
        ) : (
          <section className="rdn-block rdn-rate">
            <h2>{t('requestDone.rateTitle', '{{name}}ni baholang', { name: person.name })}</h2>
            <p className="rdn-hint">{t('requestDone.rateHint', 'Bahoingiz boshqa mijozlarga to‘g‘ri usta tanlashda yordam beradi')}</p>
            <Stars value={rating} onChange={pickRating} />
            <span className={`rdn-rate__label ${rating ? 'is-visible' : ''}`}>{rating ? t(`requestDone.rating.${rating}`) : '·'}</span>

            {rating > 0 && (
              <>
                <div className="rdn-tags">
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`rdn-tag ${tags.includes(tag) ? 'is-on' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {t(`requestDone.tag.${tag}`)}
                    </button>
                  ))}
                </div>
                <textarea
                  className="rdn-comment"
                  rows={3}
                  maxLength={500}
                  placeholder={rating >= 4 ? t('requestDone.likedPh', 'Nima yoqdi? (ixtiyoriy)') : t('requestDone.dislikedPh', 'Nima yoqmadi? (ixtiyoriy)')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </>
            )}
          </section>
        )}
      </div>

      {/* ---------- Pastki tugmalar ---------- */}
      <footer className="rdn-foot">
        {!isProvider && !review && (
          <button type="button" className="rdn-btn rdn-btn--primary" disabled={!rating || sending} onClick={submit}>
            {sending ? <Loader2 size={18} className="rdn-spin" /> : null}
            {rating ? t('requestDone.send', 'Bahoni yuborish') : t('requestDone.pickStars', 'Yulduzni tanlang')}
          </button>
        )}
        {(!isProvider && review) && (
          <button type="button" className="rdn-btn rdn-btn--primary" onClick={() => navigate('/request')}>
            <Wrench size={18} /> {t('requestDone.again', 'Yana usta chaqirish')}
          </button>
        )}
        {isProvider && (
          <button type="button" className="rdn-btn rdn-btn--primary" onClick={() => navigate('/provider-requests')}>
            <Inbox size={18} /> {t('requestDone.newRequests', 'Yangi so‘rovlar')}
          </button>
        )}
        <button type="button" className="rdn-btn rdn-btn--ghost" onClick={() => navigate('/home')}>
          <Home size={18} /> {t('requestDone.home', 'Bosh sahifa')}
        </button>
      </footer>
    </div>
  );
}
