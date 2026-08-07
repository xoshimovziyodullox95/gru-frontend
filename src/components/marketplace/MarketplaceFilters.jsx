// src/components/marketplace/MarketplaceFilters.jsx
import { useEffect, useState, useRef } from 'react';
import { X, ChevronRight, Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLevel1 } from '../services/categories';

function ProviderLogo({ src, alt, size = 'lg' }) {
  const [errored, setErrored] = useState(false);
  const className = size === 'sm' ? 'mp-provider-logo-sm' : 'mp-provider-logo';

  const initials = (alt || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (!src || errored) {
    return (
      <div className={`${className} mp-provider-logo-fallback`}>
        {initials || <Landmark size={size === 'sm' ? 14 : 26} />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

export default function MarketplaceFilters({
  selectedTypes,
  onToggleType,
  selectedLevel1s,
  onToggleLevel1,
  selectedServiceCats,
  onToggleServiceCat,
  onClearAll,
}) {
  const { t } = useTranslation();
  const [level1List, setLevel1List] = useState([]);
  const [openProviderId, setOpenProviderId] = useState(null);
  const providerRefs = useRef({});

  useEffect(() => {
    getLevel1().then((res) => setLevel1List(res.data)).catch(() => {});
  }, []);

  const typeOptions = [
    { value: 'location', label: t('marketplaceFilters.typeLocation') },
    { value: 'equipment', label: t('marketplaceFilters.typeEquipment') },
    { value: 'service', label: t('marketplaceFilters.typeService') },
  ];

  // ========== BANK XIZMATLARI ==========
  // MUHIM: slug'lar backend'dagi subCategory bilan AYNAN MOS bo'lishi kerak!
  const providerGroups = [
    {
      id: 'bank-services',
      name: t('marketplaceFilters.bankServices', 'Bank xizmatlari'),
      flyoutTitle: 'Universal Bank',
      logo: '/images/logo/universalbank.jpg',
      services: [
        { slug: 'credit', label: t('services.credit') },
        
        { slug: 'pko', label: t('services.pko') },
        { slug: 'qr_payment', label: t('services.qrPayment') },    // ✅ pastki chiziq
        { slug: 'deposits', label: t('services.deposits') },
        { slug: 'cards', label: t('services.cards') },
        { slug: 'money_transfers', label: t('services.moneyTransfers') }, // ✅ pastki chiziq
      ],
    },
  ];

  // ========== BOSHQA XIZMATLAR ==========
// ========== BOSHQA XIZMATLAR ==========
const otherServiceCategories = [
  { slug: 'repair', label: t('services.repair', "Qurilish va santexnika") },
  { slug: 'marketing', label: t('services.smm', 'Marketing') },
  { slug: 'event', label: t('services.event') },
  { slug: 'accounting', label: t('services.accounting') },
  { slug: 'website', label: t('services.website') },
  { slug: 'internet', label: t('services.internet') },
];

  const hasActiveFilters =
    selectedTypes.size > 0 || selectedLevel1s.size > 0 || selectedServiceCats.size > 0;

  const toggleProvider = (id) => {
    setOpenProviderId((prev) => (prev === id ? null : id));
  };

  const countSelectedInProvider = (provider) =>
    provider.services.filter((s) => selectedServiceCats.has(s.slug)).length;

  const handleServiceCatChange = (slug) => {
    console.log('🔵 CHECKBOX BOSILDI, slug:', slug);
    console.log('🔵 HAMMA TANLANGANLAR:', [...selectedServiceCats]);
    onToggleServiceCat(slug);
  };

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

      {/* YO'NALISH */}
      <div className="mp-filters-section">
        <h4>{t('marketplaceFilters.direction')}</h4>
        <div className="mp-filters-scroll">
          {level1List.map((l) => (
            <label key={l.key} className="mp-filter-checkbox">
              <input
                type="checkbox"
                checked={selectedLevel1s.has(l.key)}
                onChange={() => onToggleLevel1(l.key)}
              />
              <span>{t(`categories.${l.key}`, { defaultValue: l.name || l.key })}</span>
            </label>
          ))}
        </div>
      </div>

      {/* XIZMAT TURLARI */}
      <div className="mp-filters-section">
        <h4>{t('marketplaceFilters.serviceTags')}</h4>

        {providerGroups.map((provider) => {
          const selectedCount = countSelectedInProvider(provider);
          const isOpen = openProviderId === provider.id;
          return (
            <div
              className="mp-provider-group"
              key={provider.id}
              ref={(el) => (providerRefs.current[provider.id] = el)}
            >
              <button
                type="button"
                className={`mp-filter-provider-btn ${isOpen ? 'active' : ''}`}
                onClick={() => toggleProvider(provider.id)}
              >
                <ProviderLogo src={provider.logo} alt={provider.name} size="sm" />
                <span>{provider.name}</span>
                {selectedCount > 0 && (
                  <span className="mp-provider-badge">{selectedCount}</span>
                )}
                <ChevronRight
                  size={15}
                  className={`mp-provider-chevron ${isOpen ? 'open' : ''}`}
                />
              </button>

              {isOpen && (
                <>
                  <div className="mp-provider-overlay" onClick={() => setOpenProviderId(null)} />
                  <div className="mp-provider-flyout">
                    <div className="mp-provider-flyout-header">
                      <button
                        type="button"
                        className="mp-provider-flyout-close"
                        onClick={() => setOpenProviderId(null)}
                        aria-label="Yopish"
                      >
                        <X size={16} />
                      </button>
                      <ProviderLogo src={provider.logo} alt={provider.flyoutTitle} size="lg" />
                      <span className="mp-provider-flyout-title">{provider.flyoutTitle}</span>
                    </div>
                    <div className="mp-provider-flyout-list">
                      {provider.services.map((s) => (
                        <label key={s.slug} className="mp-filter-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedServiceCats.has(s.slug)}
                            onChange={() => handleServiceCatChange(s.slug)}
                          />
                          <span>{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div className="mp-filters-scroll">
          {otherServiceCategories.map((s) => (
            <label key={s.slug} className="mp-filter-checkbox">
              <input
                type="checkbox"
                checked={selectedServiceCats.has(s.slug)}
                onChange={() => handleServiceCatChange(s.slug)}
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button className="mp-filters-clear" onClick={onClearAll}>
          <X size={14} /> {t('marketplaceFilters.clear')}
        </button>
      )}
    </aside>
  );
}