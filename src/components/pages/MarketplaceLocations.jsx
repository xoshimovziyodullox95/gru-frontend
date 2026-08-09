// src/components/pages/MarketplaceLocations.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { getLocations } from '../services/locations';
import UniversalCard from './UniversalCard';
import '../../styles/marketplaceHub.css';

export default function MarketplaceLocations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocations({ limit: 200 })
      .then(res => setLocations(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="mph-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="mph-page">
      <button className="mph-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> {t('common.back')}
      </button>
      <h2 className="mph-subtitle">{t('common.locationsTitle')}</h2>
      <div className="uc-grid">
        {locations.map(loc => (
          <UniversalCard
            key={loc._id}
            id={loc._id}
            type="location"
            title={loc.title}
            image={loc.images?.[0] || '/images/placeholder.jpg'}
            price={loc.price_range}
            currency={loc.currency}
            link={`/location/${loc._id}`}
          />
        ))}
      </div>
    </div>
  );
}