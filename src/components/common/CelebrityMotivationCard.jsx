// src/components/common/CelebrityMotivationCard.jsx
import { useEffect, useState } from 'react';
import { ShieldCheck, Quote, Award, TrendingUp } from 'lucide-react';
import { getCelebrityByCategory } from '../services/celebrities';

const CATEGORY_LABELS = {
  agriculture: "Qishloq xo'jaligi",
  shops: "Do'konlar",
  clinic: "Klinika",
  entertainment: "Ko'ngilochar",
  restaurant: "Restoran & Kafe",
  services: "Xizmatlar",
  education: "Ta'lim",
  startup: "Yangi biznes",
};

/**
 * CelebrityMotivationCard — endi qayta ishlatiladigan umumiy komponent.
 * Location, Equipment va ServiceProvider detail sahifalarida bir xil
 * ishlatiladi. Har safar sahifa ochilganda backend TASODIFIY bitta
 * mashhur odamni qaytaradi ($sample orqali).
 */
export default function CelebrityMotivationCard({ category }) {
  const [celebrity, setCelebrity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getCelebrityByCategory(category);
        if (!cancelled) setCelebrity(res.data);
      } catch (err) {
        if (!cancelled) setCelebrity(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [category]);

  if (loading) return <div className="celebrity-card celebrity-skeleton" />;
  if (!celebrity) return null;

  return (
    <div className="celebrity-card">
      <div className="celebrity-photo-wrap">
        <img
          src={celebrity.photo}
          alt={celebrity.name}
          className="celebrity-photo"
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-avatar.jpg'; }}
        />
        <span className="celebrity-category-tag">{CATEGORY_LABELS[category] || celebrity.categoryLabel}</span>
      </div>
      <div className="celebrity-info">
        <div className="celebrity-name-row">
          <h3>{celebrity.name}</h3>
          {celebrity.verified && <ShieldCheck size={16} className="celebrity-verified" />}
        </div>
        {celebrity.title && <p className="celebrity-title">{celebrity.title}</p>}

        {celebrity.quote && (
          <div className="celebrity-quote">
            <Quote size={16} className="celebrity-quote-icon" />
            <p>{celebrity.quote}</p>
          </div>
        )}

        {celebrity.achievement && (
          <div className="celebrity-achievement">
            <Award size={15} />
            <span>{celebrity.achievement}</span>
          </div>
        )}

      </div>
    </div>
  );
}