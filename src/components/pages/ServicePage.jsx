import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft, Search, SlidersHorizontal,
  ShieldCheck, Flame
} from 'lucide-react';
import { getServiceProviders } from '../services/serviceProviders';
import ServiceProviderCard from '../marketplace/ServiceProviderCard';
import '../../styles/servicePage.css'

const categoryNames = {
  'repair': "Qurilish va santexnika",
  'marketing': 'Marketing',
  'event': 'Event tashkil qilish',
  'accounting': 'Buxgalteriya',
  'website': 'Sayt yaratish',
  'internet': 'Internet',
};

function SkeletonCard() {
  return (
    <div className="sp-skeleton">
      <div className="sp-skeleton-img" />
      <div className="sp-skeleton-body">
        <div className="sp-skeleton-line sp-skeleton-line--lg" />
        <div className="sp-skeleton-line sp-skeleton-line--md" />
        <div className="sp-skeleton-line sp-skeleton-line--sm" />
      </div>
    </div>
  );
}

export default function ServicePage() {
  const { slug } = useParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterTop, setFilterTop] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [sort, setSort] = useState('rating');

  useEffect(() => {
    setLoading(true);
    getServiceProviders({ category: slug })
      .then(res => {
        setProviders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  const filtered = providers
    .filter(p => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q);
      const matchTop = !filterTop || p.is_top;
      const matchV = !filterVerified || p.is_verified;
      return matchQ && matchTop && matchV;
    })
    .sort((a, b) => {
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  return (
    <div className="sp-page">
      <div className="sp-container">
        <div className="sp-header">
          <button className="sp-back-btn" onClick={() => window.history.back()}>
            <ArrowLeft size={16} />
            Orqaga
          </button>

          <div className="sp-title-row">
            <h1 className="sp-title">{categoryNames[slug] || slug}</h1>
            {!loading && (
              <span className="sp-count">{providers.length} ta xizmat</span>
            )}
          </div>

          <div className="sp-controls">
            <div className="sp-search-wrap">
              <Search size={15} className="sp-search-icon" />
              <input
                className="sp-search"
                type="text"
                placeholder="Xizmat yoki kompaniya qidiring..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            <button
              className={`sp-filter-btn ${filterTop ? 'sp-filter-btn--active' : ''}`}
              onClick={() => setFilterTop(v => !v)}
            >
              <Flame size={14} />
              Top
            </button>

            <button
              className={`sp-filter-btn ${filterVerified ? 'sp-filter-btn--active' : ''}`}
              onClick={() => setFilterVerified(v => !v)}
            >
              <ShieldCheck size={14} />
              Tasdiqlangan
            </button>

            <div className="sp-sort-wrap">
              <SlidersHorizontal size={14} className="sp-sort-icon" />
              <select
                className="sp-sort"
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                <option value="rating">Reyting</option>
                <option value="name">Nom</option>
              </select>
            </div>
          </div>

          {!loading && (
            <p className="sp-results-label">
              {filtered.length} ta natija ko'rsatilmoqda
            </p>
          )}
        </div>

        {loading ? (
          <div className="uc-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="sp-empty">
            <Search size={40} strokeWidth={1.2} />
            <p>Hech narsa topilmadi</p>
            <span>Qidiruvni yoki filtrlarni o'zgartiring</span>
          </div>
        ) : (
          <div className="uc-grid">
            {filtered.map(provider => (
<ServiceProviderCard
  key={provider._id}
  id={provider._id}
  name={provider.name}
  company={provider.company}
  image={provider.image}
  price_range={provider.price_range}
  description={provider.description}
/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}