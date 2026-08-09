// src/components/pages/MarketplaceServiceCats.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Hammer, Megaphone, Calendar, Calculator, Monitor, Wifi } from 'lucide-react';
import { getServiceProviders } from '../services/serviceProviders';
import '../../styles/marketplaceHub.css';

const SERVICE_CATS = [
  { slug: 'repair', icon: Hammer },
  { slug: 'marketing', icon: Megaphone },
  { slug: 'event', icon: Calendar },
  { slug: 'accounting', icon: Calculator },
  { slug: 'website', icon: Monitor },
  { slug: 'internet', icon: Wifi },
];

export default function MarketplaceServiceCats() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [services, setServices] = useState([]);

  useEffect(() => {
    getServiceProviders({ limit: 200 }).then(res => setServices(res.data || []));
  }, []);

  return (
    <div className="mph-page">
      <button className="mph-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> {t('common.back')}
      </button>
      <h2 className="mph-subtitle">{t('marketplace.services.catsTitle')}</h2>
      <div className="mph-service-cats-grid">
        {SERVICE_CATS.map(sc => {
          const count = services.filter(s => s.service_category === sc.slug).length;
          const Icon = sc.icon;
          return (
            <button
              key={sc.slug}
              className="mph-service-cat-card"
              onClick={() => navigate(`/marketplace/services/${sc.slug}`)}
            >
              <Icon size={28} className="mph-service-cat-icon" />
              <span className="mph-service-cat-name">{t(`serviceCats.${sc.slug}`)}</span>
              {count > 0 && <small>({count})</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}