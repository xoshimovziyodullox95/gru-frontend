// Sarlavha ostidagi "★ 4.8 · 12 ta sharh ›" qatori — bosilsa barcha sharhlar sahifasi
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { getReviews, reviewsPath } from '../services/reviews';
import { T } from '../utils/T';

export default function RatingLink({ type, id, title }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let alive = true;
    getReviews(type, id, { limit: 1 })
      .then((res) => alive && setSummary(res.data.summary))
      .catch(() => alive && setSummary(null));
    return () => { alive = false; };
  }, [type, id]);

  if (!summary) return null;

  return (
    <button type="button" className="dp-rating-link" onClick={() => navigate(reviewsPath(type, id), { state: { title } })}>
      <Star size={15} className="dp-star" />
      {summary.count > 0 ? (
        <>
          <strong>{summary.avg.toFixed(1)}</strong>
          <span>{T('{{count}} ta sharh', { count: summary.count })}</span>
        </>
      ) : (
        <span>{T('Hali sharh yo‘q')}</span>
      )}
      <ChevronRight size={15} />
    </button>
  );
}
