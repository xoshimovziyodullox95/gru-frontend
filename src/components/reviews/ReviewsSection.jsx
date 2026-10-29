// Detail sahifadagi "Sharhlar" bloki (Uzum uslubida): o'rtacha baho, taqsimot,
// mijozlar rasmlari, 3 ta so'nggi sharh va "Barcha sharhlar" sahifasiga o'tish.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, MessageSquarePlus, Star } from 'lucide-react';

import Stars from './Stars';
import ReviewCard, { PhotoViewer } from './ReviewCard';
import ReviewForm from './ReviewForm';
import { useReviewEligibility, ELIGIBILITY_HINTS } from './useReviewEligibility';
import { getReviews, reviewsPath } from '../services/reviews';
import { useMyMongoId } from '../hooks/useMyMongoId';
import { getImageUrl } from '../utils/imageUrl';
import { T } from '../utils/T';
import '../../styles/reviews.css';

export function RatingSummary({ summary }) {
  const max = Math.max(1, ...Object.values(summary.distribution));
  return (
    <div className="rv-summary">
      <div className="rv-summary__score">
        <strong>{summary.avg ? summary.avg.toFixed(1) : '—'}</strong>
        <Stars value={summary.avg} size={16} />
        <span>{T('{{count}} ta sharh', { count: summary.count })}</span>
      </div>
      <div className="rv-summary__bars">
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n} className="rv-bar">
            <span className="rv-bar__label">{n} <Star size={11} /></span>
            <span className="rv-bar__track"><i style={{ width: `${(summary.distribution[n] / max) * 100}%` }} /></span>
            <span className="rv-bar__count">{summary.distribution[n]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReviewsSection({ type, id, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const myId = useMyMongoId();
  const eligibility = useReviewEligibility(type, id);
  const [data, setData] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewer, setViewer] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getReviews(type, id, { limit: 6 });
      setData(res.data);
    } catch {
      setData({ items: [], total: 0, summary: { count: 0, avg: 0, withPhotos: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } });
    }
  }, [type, id]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!data || eligibility.reason === 'not_reviewable') return null;

  const { summary, items } = data;
  const photos = items.flatMap((r) => r.photos || []).slice(0, 8);
  const openAll = () => navigate(reviewsPath(type, id), { state: { title } });
  const startWrite = () => {
    if (eligibility.reason === 'guest') return navigate('/login', { state: { from: location.pathname } });
    setFormOpen(true);
  };
  const guest = eligibility.reason === 'guest';
  // Mehmonga tovar/xizmat uchun tugma emas, kim yoza olishi haqida izoh ko'rsatamiz
  const hint = ELIGIBILITY_HINTS[eligibility.reason]
    || (guest && type !== 'location' ? ELIGIBILITY_HINTS[type === 'equipment' ? 'not_bought' : 'not_used'] : null);
  const showWrite = eligibility.canReview || (guest && type === 'location');

  return (
    <section className="rv-section-block" aria-label={T('Sharhlar')}>
      <header className="rv-block-head">
        <h3>{T('Sharhlar')} {summary.count > 0 && <span>{summary.count}</span>}</h3>
        {summary.count > 0 && (
          <button type="button" className="rv-link" onClick={openAll}>{T('Hammasi')} <ChevronRight size={16} /></button>
        )}
      </header>

      {summary.count > 0 ? (
        <>
          <RatingSummary summary={summary} />

          {photos.length > 0 && (
            <div className="rv-photo-strip" aria-label={T('Xaridorlar rasmlari')}>
              {photos.map((src, i) => (
                <button key={src} type="button" onClick={() => setViewer(i)}><img src={getImageUrl(src)} alt="" loading="lazy" /></button>
              ))}
            </div>
          )}

          <div className="rv-carousel">
            {items.slice(0, 3).map((review) => (
              <ReviewCard key={review._id} review={review} myId={myId} isOwner={eligibility.isOwner} compact onDeleted={load} />
            ))}
          </div>

          <button type="button" className="rv-btn rv-btn--ghost rv-btn--block" onClick={openAll}>
            {T('Barcha sharhlar ({{count}})', { count: summary.count })}
          </button>
        </>
      ) : (
        <div className="rv-empty">
          <Star size={26} />
          <strong>{T('Hali sharh yo‘q')}</strong>
          <p>{T(hint || (type === 'location' ? 'Bu joy haqida birinchi bo‘lib fikr bildiring' : type === 'service_provider' ? 'Birinchi sharhni xizmatdan foydalangan mijoz yozadi' : 'Birinchi sharhni sotib olgan xaridor yozadi'))}</p>
        </div>
      )}

      {showWrite && (
        <button type="button" className="rv-btn rv-btn--primary rv-btn--block" onClick={startWrite}>
          <MessageSquarePlus size={17} /> {T('Sharh yozish')}
        </button>
      )}
      {summary.count > 0 && hint && <p className="rv-hint">{T(hint)}</p>}

      {formOpen && (
        <ReviewForm
          type={type}
          id={id}
          title={title}
          onClose={() => setFormOpen(false)}
          onCreated={() => { setFormOpen(false); eligibility.refresh(); load(); }}
        />
      )}
      {viewer !== null && <PhotoViewer photos={photos} index={viewer} onClose={() => setViewer(null)} />}
    </section>
  );
}
