// Barcha sharhlar sahifasi: /reviews/:type/:id
// Filtr (rasmli, 5★…1★), saralash, sahifalab yuklash va sharh yozish.
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, MessageSquarePlus, Star } from 'lucide-react';

import ReviewCard from '../reviews/ReviewCard';
import ReviewForm from '../reviews/ReviewForm';
import { RatingSummary } from '../reviews/ReviewsSection';
import { useReviewEligibility, ELIGIBILITY_HINTS } from '../reviews/useReviewEligibility';
import { getReviews } from '../services/reviews';
import { useMyMongoId } from '../hooks/useMyMongoId';
import { safeGoBack } from '../utils/navigation';
import { T } from '../utils/T';
import '../../styles/reviews.css';

const SORTS = [
  { id: 'new', label: 'Yangilari' },
  { id: 'helpful', label: 'Foydalilari' },
  { id: 'high', label: 'Yuqori baho' },
  { id: 'low', label: 'Past baho' },
];

export default function ReviewsPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const title = location.state?.title;
  const myId = useMyMongoId();
  const eligibility = useReviewEligibility(type, id);

  const [filter, setFilter] = useState({ rating: 0, withPhotos: false, sort: 'new' });
  const [state, setState] = useState({ items: [], page: 0, pages: 1, total: 0, summary: null, loading: true });
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async (page = 1) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await getReviews(type, id, {
        page,
        sort: filter.sort,
        rating: filter.rating || undefined,
        withPhotos: filter.withPhotos ? 1 : undefined,
      });
      setState((s) => ({
        items: page === 1 ? data.items : [...s.items, ...data.items],
        page: data.page,
        pages: data.pages,
        total: data.total,
        summary: data.summary,
        loading: false,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [type, id, filter]);

  useEffect(() => {
    const timer = setTimeout(() => load(1), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const summary = state.summary;
  const chip = (active, onClick, children, key) => (
    <button key={key} type="button" className={`rv-chip ${active ? 'is-on' : ''}`} onClick={onClick}>{children}</button>
  );
  const hint = ELIGIBILITY_HINTS[eligibility.reason];

  return (
    <div className="rv-page">
      <header className="rv-page__top">
        <button type="button" className="rv-icon-btn" onClick={() => safeGoBack(navigate)} aria-label={T('Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>{T('Sharhlar')}</h1>
          {title && <p>{title}</p>}
        </div>
      </header>

      <div className="rv-page__wrap">
        {summary && summary.count > 0 && <RatingSummary summary={summary} />}

        {summary && summary.count > 0 && (
          <div className="rv-chips" role="toolbar" aria-label={T('Filtr')}>
            {chip(!filter.rating && !filter.withPhotos, () => setFilter((f) => ({ ...f, rating: 0, withPhotos: false })), T('Hammasi'))}
            {summary.withPhotos > 0 && chip(filter.withPhotos, () => setFilter((f) => ({ ...f, withPhotos: !f.withPhotos })), (
              <><Camera size={14} /> {T('Rasmli')} · {summary.withPhotos}</>
            ))}
            {[5, 4, 3, 2, 1].map((n) => summary.distribution[n] > 0 && chip(
              filter.rating === n,
              () => setFilter((f) => ({ ...f, rating: f.rating === n ? 0 : n })),
              <>{n} <Star size={12} /> · {summary.distribution[n]}</>,
              n
            ))}
          </div>
        )}

        {summary && summary.count > 1 && (
          <label className="rv-sort">
            <span>{T('Saralash')}</span>
            <select value={filter.sort} onChange={(e) => setFilter((f) => ({ ...f, sort: e.target.value }))}>
              {SORTS.map((s) => <option key={s.id} value={s.id}>{T(s.label)}</option>)}
            </select>
          </label>
        )}

        <div className="rv-list">
          {state.items.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              myId={myId}
              isOwner={eligibility.isOwner}
              onDeleted={() => { load(1); eligibility.refresh(); }}
            />
          ))}
        </div>

        {state.loading && <div className="rv-loading"><Loader2 size={22} className="rv-spin" /></div>}

        {!state.loading && state.items.length === 0 && (
          <div className="rv-empty">
            <Star size={26} />
            <strong>{summary?.count ? T('Bu filtr bo‘yicha sharh yo‘q') : T('Hali sharh yo‘q')}</strong>
            {hint && <p>{T(hint)}</p>}
          </div>
        )}

        {!state.loading && state.page < state.pages && (
          <button type="button" className="rv-btn rv-btn--ghost rv-btn--block" onClick={() => load(state.page + 1)}>
            {T('Ko‘proq ko‘rsatish')}
          </button>
        )}
      </div>

      {(eligibility.canReview || (eligibility.reason === 'guest' && type === 'location')) && (
        <div className="rv-page__cta">
          <button
            type="button"
            className="rv-btn rv-btn--primary rv-btn--block"
            onClick={() => (eligibility.reason === 'guest'
              ? navigate('/login', { state: { from: location.pathname } })
              : setFormOpen(true))}
          >
            <MessageSquarePlus size={17} /> {T('Sharh yozish')}
          </button>
        </div>
      )}

      {formOpen && (
        <ReviewForm
          type={type}
          id={id}
          title={title}
          onClose={() => setFormOpen(false)}
          onCreated={() => { setFormOpen(false); eligibility.refresh(); load(1); }}
        />
      )}
    </div>
  );
}
