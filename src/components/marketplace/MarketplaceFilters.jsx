// src/components/marketplace/MarketplaceFilters.jsx
// Filtrlar: e'lon turi, tovar kategoriyasi (+ ichki bo'lim) va xizmat yo'nalishi.
// Katakchalar o'rniga chiplar — Uzum/Ozon kabi bir bosishda tanlanadi.
import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProductCategories } from '../utils/productCategories';
import { getServiceTaxonomy } from '../services/serviceProviders';
import { directionLabel } from '../utils/i18nHelpers';

function ChipGroup({ title, options, selected, onToggle }) {
  if (!options.length) return null;
  return (
    <div className="mp-filters-section mpf-section">
      <h4>{title}</h4>
      <div className="mpf-chips">
        {options.map((opt) => {
          const on = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              className={`mpf-chip ${on ? 'is-on' : ''}`}
              onClick={() => onToggle(opt.value)}
            >
              {on && <Check size={14} strokeWidth={2.6} />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MarketplaceFilters({
  selectedTypes,
  onToggleType,
  selectedLevel1s,
  onToggleLevel1,
  selectedSubs = new Set(),
  onToggleSub,
  selectedServiceCats,
  onToggleServiceCat,
  facets = [],
  onClearAll,
}) {
  const { t } = useTranslation();
  const { categories } = useProductCategories();
  const [serviceDirections, setServiceDirections] = useState([]);

  useEffect(() => {
    // Xizmat yo'nalishlari backend taksonomiyasidan (mutaxassislar shu bo'yicha ro'yxatdan o'tadi)
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
    selectedTypes.size > 0 || selectedLevel1s.size > 0 || selectedSubs.size > 0 || selectedServiceCats.size > 0
    || facets.some((f) => f.selected.size > 0);

  // Ichki bo'limlar faqat bitta kategoriya tanlanganda ko'rinadi
  const activeCategory = selectedLevel1s.size === 1
    ? categories.find((cat) => selectedLevel1s.has(cat.id))
    : null;

  return (
    <aside className="mp-filters-panel">
      <ChipGroup title={t('marketplaceFilters.types')} options={typeOptions} selected={selectedTypes} onToggle={onToggleType} />

      <ChipGroup
        title={t('marketplaceFilters.category', 'Kategoriya')}
        options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
        selected={selectedLevel1s}
        onToggle={onToggleLevel1}
      />

      {activeCategory && onToggleSub && (
        <ChipGroup
          title={activeCategory.name}
          options={activeCategory.subs.map((sub) => ({ value: sub.id, label: sub.name }))}
          selected={selectedSubs}
          onToggle={onToggleSub}
        />
      )}

      {facets.map((f) => (
        <ChipGroup key={f.key} title={f.title} options={f.options} selected={f.selected} onToggle={f.onToggle} />
      ))}

      <ChipGroup
        title={t('marketplaceFilters.serviceTags')}
        options={serviceDirections.map((slug) => ({ value: slug, label: directionLabel(slug) }))}
        selected={selectedServiceCats}
        onToggle={onToggleServiceCat}
      />

      {hasActiveFilters && (
        <button type="button" className="mp-filters-clear mpf-clear" onClick={onClearAll}>
          <X size={15} /> {t('marketplaceFilters.clear')}
        </button>
      )}
    </aside>
  );
}
