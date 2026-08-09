// src/components/pages/MarketplaceProductTypes.jsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Cpu, UtensilsCrossed, Sofa, Box } from 'lucide-react';
import '../../styles/marketplaceHub.css';

const TYPES = [
  { id: 'texnika', icon: Cpu },
  { id: 'oziqovqat', icon: UtensilsCrossed },
  { id: 'mebel', icon: Sofa },
  { id: 'boshqa', icon: Box },
];

export default function MarketplaceProductTypes() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Agar t funksiya bo'lmasa, fallback
  const translate = (key) => (typeof t === 'function' ? t(key) : key);

  return (
    <div className="mph-page">
      <button className="mph-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> {translate('common.back')}
      </button>
      <h2 className="mph-subtitle">{translate('productTypes.title')}</h2>
      <div className="mph-main-grid">
        {TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              className="mph-main-card"
              onClick={() => navigate(`/marketplace/products/${type.id}`)}
            >
              <Icon size={32} />
              <span>{translate(`productTypes.${type.id}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}