// src/components/pages/MarketplaceCatalogItems.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { getEquipment } from '../services/equipment';
import UniversalCard from './UniversalCard';
import { CATEGORY_CATALOGS } from '../utils/foodCategories';
import '../../styles/marketplaceHub.css';

export default function MarketplaceCatalogItems() {
  const { catalog } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [allItems, setAllItems] = useState([]);
  const [subFilter, setSubFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const catalogInfo = CATEGORY_CATALOGS[catalog];

  useEffect(() => {
    setLoading(true);
    getEquipment({ productType: 'oziqovqat', limit: 200 })
      .then(res => {
        const onlyOziqovqat = (res.data || []).filter(e => e.productType === 'oziqovqat');
        const filtered = onlyOziqovqat.filter(e => e.attributes?.foodCategory === catalog);
        setAllItems(filtered);
      })
      .finally(() => setLoading(false));
  }, [catalog]);

  if (loading) {
    return <div className="mph-loading">{t('common.loading')}</div>;
  }
  if (!catalogInfo) {
    return <div className="mph-loading">{t('marketplace.catalog.notFound')}</div>;
  }

  const displayedItems = subFilter
    ? allItems.filter(e => e.attributes?.foodSubcategory === subFilter)
    : allItems;

  // Katalog nomini tarjima qilish (agar mavjud bo'lmasa, catalogInfo.label ishlatiladi)
  const catalogLabel = t(`catalog.${catalog}.label`, catalogInfo.label);
  // Subkatalog nomlarini tarjima qilish
  const subItems = Object.entries(catalogInfo.items).map(([subKey, subLabel]) => ({
    key: subKey,
    label: t(`catalog.${catalog}.subs.${subKey}`, subLabel),
  }));

  return (
    <div className="mph-page">
      <button className="mph-back" onClick={() => navigate('/marketplace/products/oziqovqat')}>
        <ArrowLeft size={18} /> {t('common.back')}
      </button>
      <h2 className="mph-subtitle">{catalogLabel}</h2>

      <div className="sub-food-cat-filter">
        <button
          className={subFilter === '' ? 'active' : ''}
          onClick={() => setSubFilter('')}
        >
          {t('marketplace.catalog.all')}
        </button>
        {subItems.map(({ key, label }) => (
          <button
            key={key}
            className={subFilter === key ? 'active' : ''}
            onClick={() => setSubFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {displayedItems.length === 0 ? (
        <div className="mph-loading">{t('marketplace.catalog.empty')}</div>
      ) : (
        <div className="uc-grid">
          {displayedItems.map(eq => (
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