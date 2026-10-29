import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getServiceProviders } from '../services/serviceProviders';
import ServiceProviderCard from '../marketplace/ServiceProviderCard';
import '../../styles/marketplaceHub.css';

import { T } from '../utils/T';
const formatSlug = (slug = '') => slug.replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function MarketplaceServiceList() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServiceProviders({ category: slug, limit: 200 })
      .then(res => setItems(Array.isArray(res.data) ? res.data : res.data?.providers || []))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="mph-loading">{T('Yuklanmoqda...')}</div>;

  return (
    <div className="mph-page">
      <button className="mph-back" onClick={() => navigate('/marketplace/services')}><ArrowLeft size={18} /> {T('Orqaga')}</button>
      <h2 className="mph-subtitle">{t(`svc.cat.${slug}`, formatSlug(slug))}</h2>
      <div className="uc-grid">
        {items.map(s => (
          <ServiceProviderCard key={s._id} id={s._id} name={s.name} company={s.company} image={s.image} price_range={s.price_range} description={s.description} />
        ))}
      </div>
    </div>
  );
}
