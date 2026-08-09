// src/components/pages/MarketplaceProductList.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { getEquipment } from '../services/equipment';
import UniversalCard from '../pages/UniversalCard';
import { CATEGORY_CATALOGS } from '../utils/foodCategories';
import '../../styles/marketplaceHub.css';

export default function MarketplaceProductList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tur nomlari
  const TYPE_LABELS = {
    texnika: t('productTypes.texnika'),
    mebel: t('productTypes.mebel'),
    boshqa: t('productTypes.boshqa'),
    oziqovqat: t('productTypes.oziqovqat'),
  };

  useEffect(() => {
    setLoading(true);
    getEquipment({ productType: type, limit: 200 })
      .then(res => {
        const onlyThisType = (res.data || []).filter(e => e.productType === type);
        setItems(onlyThisType);
      })
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) {
    return <div className="mph-loading">{t('common.loading')}</div>;
  }

  // ===== OZIQ-OVQAT — KATALOG RO'YXATI =====
  if (type === 'oziqovqat') {
    return (
      <div className="mph-page">
        <button className="mph-back" onClick={() => navigate('/marketplace/products')}>
          <ArrowLeft size={18} /> {t('common.back')}
        </button>
        <h2 className="mph-subtitle">{t('marketplace.products.catalogTitle')}</h2>

        <div className="mph-catalog-list">
          {Object.entries(CATEGORY_CATALOGS).map(([key, cat]) => {
            const count = items.filter(e => e.attributes?.foodCategory === key).length;
            return (
              <button
                key={key}
                className="mph-catalog-list-item"
                onClick={() => navigate(`/marketplace/products/oziqovqat/${key}`)}
              >
                <img
                  src={cat.image || '/images/placeholder.jpg'}
                  alt={cat.label}
                  className="mph-catalog-list-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/placeholder.jpg';
                  }}
                />
                <div className="mph-catalog-list-info">
                  <span className="mph-catalog-list-name">
                    {t(`catalog.${key}.label`, cat.label)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== TEXNIKA / MEBEL / BOSHQA =====
  return (
    <div className="mph-page">
      <button className="mph-back" onClick={() => navigate('/marketplace/products')}>
        <ArrowLeft size={18} /> {t('common.back')}
      </button>
      <h2 className="mph-subtitle">{TYPE_LABELS[type] || type}</h2>
      {items.length === 0 ? (
        <div className="mph-loading">{t('marketplace.products.empty')}</div>
      ) : (
        <div className="uc-grid">
          {items.map(eq => (
            <UniversalCard
              key={eq._id}
              id={eq._id}
              type="equipment"
              title={eq.title}
              image={eq.images?.[0] || '/images/placeholder-equipment.jpg'}
              price={eq.price}
              currency={eq.currency}
              link={`/equipment/${eq._id}`}
              maxQuantity={eq.stockQuantity}
            />
          ))}
        </div>
      )}
    </div>
  );
}