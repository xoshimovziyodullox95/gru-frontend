// src/components/marketplace/MarketplaceFilters.jsx
// Filtrlar: e'lon turi, tovar kategoriyasi (+ ichki bo'lim) va xizmat yo'nalishi.
// Bank xizmatlari olib tashlangan — bo'lim "Tez kunda".
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProductCategories } from '../utils/productCategories';
import { getServiceTaxonomy } from '../services/serviceProviders';
import { directionLabel } from '../utils/i18nHelpers';

export default function MarketplaceFilters({
  selectedTypes,
  onToggleType,
  selectedLevel1s,
  onToggleLevel1,
  selectedSubs = new Set(),
  onToggleSub,
  selectedServiceCats,
  onToggleServiceCat,
  onClearAll,
}) {
  const { t } = useTranslation();
  const { categories } = useProductCategories();
  const [serviceDirections, setServiceDirections] = useState([]);

  useEffect(() => {
    // Xizmat yo'nalishlari backend taksonomiyasidan (ustalar shu bo'yicha ro'yxatdan o'tadi)
    getServiceTaxonomy()
      .then((res) => setServiceDirections(res.data?.directions || Object.keys(res.data?.taxonomy || {})))
      .catch(() => {});
  }, []);

  const typeOptions = [
    { value: 'equipment', label: t('marketplaceFilters.typeEquipment') },
    { value: 'service', label: t('marketplaceFilters.typeService') },
    { value: 'location', label: t('marketplaceFilters.typeLocation') },
  ];

  const hasActiveFilters =
    selectedTypes.size > 0 || selectedLevel1s.size > 0 || selectedSubs.size > 0 || selectedServiceCats.size > 0;

  // Ichki bo'limlar faqat bitta kategoriya tanlanganda ko'rinadi
  const activeCategory = selectedLevel1s.size === 1
    ? categories.find((cat) => selectedLevel1s.has(cat.id))
    : null;

  return (
    <aside className="mp-filters-panel">
      {/* TURI */}
      <div className="mp-filters-section">
        <h4>{t('marketplaceFilters.types')}</h4>
        {typeOptions.map((opt) => (
          <label key={opt.value} className="mp-filter-checkbox">
            <input
              type="checkbox"
              checked={selectedTypes.has(opt.value)}
              onChange={() => onToggleType(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      {/* XIZMAT YO'NALISHI */}
      {serviceDirections.length > 0 && (
        <div className="mp-filters-section">
          <h4>{t('marketplaceFilters.serviceTags')}</h4>
          <div className="mp-filters-scroll">
            {serviceDirections.map((slug) => (
              <label key={slug} className="mp-filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedServiceCats.has(slug)}
                  onChange={() => onToggleServiceCat(slug)}
                />
                <span>{directionLabel(slug)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TOVAR KATEGORIYASI */}
      <div className="mp-filters-section">
        <h4>{t('marketplaceFilters.category', 'Kategoriya')}</h4>
        <div className="mp-filters-scroll">
          {categories.map((cat) => (
            <label key={cat.id} className="mp-filter-checkbox">
              <input
                type="checkbox"
                checked={selectedLevel1s.has(cat.id)}
                onChange={() => onToggleLevel1(cat.id)}
              />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {activeCategory && onToggleSub && (
        <div className="mp-filters-section">
          <h4>{activeCategory.name}</h4>
          <div className="mp-filters-scroll">
            {activeCategory.subs.map((sub) => (
              <label key={sub.id} className="mp-filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSubs.has(sub.id)}
                  onChange={() => onToggleSub(sub.id)}
                />
                <span>{sub.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button className="mp-filters-clear" onClick={onClearAll}>
          <X size={14} /> {t('marketplaceFilters.clear')}
        </button>
      )}
    </aside>
  );
}
