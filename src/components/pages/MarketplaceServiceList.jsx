import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getServiceProviders } from '../services/serviceProviders';
import ServiceProviderCard from '../marketplace/ServiceProviderCard';
import '../../styles/marketplaceHub.css';

const LABELS = {
  repair: "Qurilish va santexnika", marketing: 'SMM va marketing', event: 'Event tashkil qilish',
  accounting: 'Buxgalteriya', website: 'Sayt yaratish', internet: 'Internet',
};

export default function MarketplaceServiceList() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServiceProviders({ limit: 200 })
      .then(res => setItems((res.data || []).filter(s => s.service_category === slug)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="mph-loading">Yuklanmoqda...</div>;

  return (
    <div className="mph-page">
      <button className="mph-back" onClick={() => navigate('/marketplace/services')}><ArrowLeft size={18} /> Orqaga</button>
      <h2 className="mph-subtitle">{LABELS[slug]}</h2>
      <div className="uc-grid">
        {items.map(s => (
          <ServiceProviderCard key={s._id} id={s._id} name={s.name} company={s.company} image={s.image} price_range={s.price_range} description={s.description} />
        ))}
      </div>
    </div>
  );
}