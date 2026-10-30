// src/pages/MarketplacePage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUrlParam, useUrlSet, useScrollRestore } from '../hooks/useUrlState';
import { useTranslation } from 'react-i18next';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';
import { useProductCategories } from '../utils/productCategories';
import ServiceProviderCard from '../marketplace/ServiceProviderCard';
import { formatPrice } from '../utils/formatPrice';

import {
  MapPin, Ruler, Tag, ArrowLeft,
  Search, Store, Loader2, Inbox, SlidersHorizontal, X
} from 'lucide-react';
import UniversalCard from '../pages/UniversalCard';
import MarketplaceFilters from '../marketplace/MarketplaceFilters';
import SearchOverlay from '../common/SearchOverlay';
import '../../styles/marketplace.css';

import { T } from '../utils/T';
const searchableText = (value) => (typeof value === 'string' ? value.toLocaleLowerCase('uz-UZ') : '');

export default function MarketplacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  // Tovar kategoriyalari (OLX kabi) — filtr, ichki bo'limlar va qidiruv uchun
  const { categories } = useProductCategories();
  const [loading, setLoading] = useState(true);
  // Filtrlar URL'da — e'londan orqaga qaytganda saqlanib qoladi
  const [searchTerm, setSearchTerm] = useUrlParam('q');
  const [selectedTypes, setSelectedTypes] = useUrlSet('type');
  const [selectedLevel1s, setSelectedLevel1s] = useUrlSet('level1');
  const [selectedServiceCats, setSelectedServiceCats] = useUrlSet('svc');
  const [selectedSubs, setSelectedSubs] = useUrlSet('sub');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(() => searchParams.get('openSearch') === '1');

  // ?openSearch=1 bir martalik: URL'dan olib tashlaymiz, aks holda e'londan "orqaga"
  // qaytganda sahifa qayta ochilib qidiruv yana avtomatik chiqib ketadi
  useEffect(() => {
    if (searchParams.get('openSearch') !== '1') return;
    const next = new URLSearchParams(searchParams);
    next.delete('openSearch');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // ========== MA'LUMOTLARNI YUKLASH ==========
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [locRes, eqRes, servRes] = await Promise.all([
          getLocations(),
          getEquipment(),
          getServiceProviders(),
        ]);

        const asArray = (response) => {
          const data = response?.data ?? response;
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.data)) return data.data;
          if (Array.isArray(data?.items)) return data.items;
          if (Array.isArray(data?.results)) return data.results;
          return [];
        };
        const locations = asArray(locRes).map(item => ({
          id: item._id,
          type: 'location',
          level1: item.level1,
          title: item.title,
          description: item.description || T('Joy haqida ma\'lumot'),
          price: item.price_range || item.price_per_month || 'Narxi mavjud emas',
          image: item.images?.[0] || '/images/zumo-placeholder.svg',
          link: `/location/${item._id}`,
          createdAt: item.createdAt,
          meta: [
            { icon: MapPin, text: item.address || T('Manzil mavjud emas') },
            ...(item.sqm ? [{ icon: Ruler, text: `${item.sqm} m²` }] : []),
          ],
        }));

        const equipment = asArray(eqRes).map(item => ({
          id: item._id,
          type: 'equipment',
          level1: item.level1,
          sub: item.category,
          title: item.title,
          description: item.description || T('Texnika haqida ma\'lumot'),
          price: formatPrice(item.price, item.currency) || 'Narxi mavjud emas',
          image: item.images?.[0] || '/images/zumo-placeholder.svg',
          link: `/equipment/${item._id}`,
          createdAt: item.createdAt,
          meta: [],
          maxQuantity: typeof item.stockQuantity === 'number' ? item.stockQuantity : undefined,
          saleMode: item.saleMode,
        }));

const services = asArray(servRes).map(item => ({
  id: item._id,
  type: 'service',
  level1: item.level1,
  serviceTags: [item.service_category],   // <-- TUZATILDI: massiv ichiga category qo'yildi
  title: item.name,
  company: item.company,
  description: item.description || T('Xizmat haqida ma\'lumot'),
  price: item.price_range || 'Narxi mavjud emas',
  image: item.image || '/images/service-providers/default.jpg',
  link: `/service-provider/${item._id}`,
  createdAt: item.createdAt,
  isTop: item.is_top,
  isVerified: item.is_verified,
  rating: item.rating,
  meta: item.speciality ? [{ icon: Tag, text: item.speciality }] : [],
}));

        const all = [...equipment, ...services, ...locations];
        setItems(all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      } catch (err) {
        console.error('Marketplace yuklash xatosi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Kategoriya va ichki bo'lim nomlari (joriy tilda) — qidiruv shular bo'yicha ham ishlaydi
  const categoryNames = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat.id, cat.name);
      cat.subs.forEach((sub) => map.set(`${cat.id}/${sub.id}`, `${cat.name} ${sub.name}`));
    });
    return map;
  }, [categories]);

  // Bitta kategoriya tanlangan bo'lsa — uning ichki bo'limlari chip bo'lib chiqadi
  const activeCategory = selectedLevel1s.size === 1
    ? categories.find((cat) => selectedLevel1s.has(cat.id)) || null
    : null;

  // ========== FILTRLASH ==========
  const filteredItems = useMemo(() => {
    let result = items;

    // 1. TYPE bo'yicha filtr
    if (selectedTypes.size > 0) {
      result = result.filter((item) => selectedTypes.has(item.type));
    }

    // 2. Tovar kategoriyasi va ichki bo'lim bo'yicha
    if (selectedLevel1s.size > 0) {
      result = result.filter((item) => selectedLevel1s.has(item.level1));
    }
    if (selectedSubs.size > 0) {
      result = result.filter((item) => item.type === 'equipment' && selectedSubs.has(item.sub));
    }

    // 3. Xizmat yo'nalishi bo'yicha (ustaning level1 si — yo'nalish slug'i)
    if (selectedServiceCats.size > 0) {
      result = result.filter((item) => item.type === 'service' && selectedServiceCats.has(item.level1));
    }

    // 4. Qidiruv bo'yicha filtr
    if (searchTerm.trim()) {
      const term = searchableText(searchTerm);
      result = result.filter(item => {
        return (
          searchableText(item.title).includes(term) ||
          searchableText(item.description).includes(term) ||
          searchableText(item.level1).includes(term) ||
          searchableText(categoryNames.get(item.level1)).includes(term) ||
          searchableText(categoryNames.get(`${item.level1}/${item.sub}`)).includes(term) ||
          searchableText(item.type).includes(term) ||
          (item.serviceTags || []).some((tag) => searchableText(tag).includes(term)) ||
          (item.meta && item.meta.some((meta) => searchableText(meta.text).includes(term)))
        );
      });
    }

    return result;
  }, [items, searchTerm, selectedTypes, selectedLevel1s, selectedSubs, selectedServiceCats, categoryNames]);

  useScrollRestore(!loading);

  // ========== YORDAMCHI FUNKSIYALAR ==========
  const toggleType = (type) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const toggleLevel1 = (level1) => {
    setSelectedLevel1s((prev) => {
      const next = new Set(prev);
      next.has(level1) ? next.delete(level1) : next.add(level1);
      return next;
    });
    setSelectedSubs(new Set()); // ichki bo'lim boshqa kategoriyaga tegishli bo'lib qolmasin
  };

  const toggleSub = (sub) => {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      next.has(sub) ? next.delete(sub) : next.add(sub);
      return next;
    });
  };

  const toggleServiceCat = (slug) => {
    setSelectedServiceCats((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedTypes(new Set());
    setSelectedLevel1s(new Set());
    setSelectedServiceCats(new Set());
    setSelectedSubs(new Set());
    setSearchTerm('');
  };

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="marketplace-loading">
        <Loader2 size={32} className="marketplace-spinner" />
        <span>{t('marketplacePage.loading')}</span>
      </div>
    );
  }

  // ========== RENDER ==========
  return (
    <div className="marketplace-page">
      <div className="marketplace-page-header">
        <h1 className="marketplace-page-title">
          <Store size={24} />
          {t('marketplacePage.title')}
        </h1>

        <button type="button" className="marketplace-back-btn" onClick={() => navigate('/marketplace')}>
          <ArrowLeft size={18} />
          <span>{t('common.back', 'Orqaga')}</span>
        </button>

        <div className="marketplace-search-bar">
          <Search size={18} className="marketplace-search-icon" />
          <input
            type="text"
            placeholder={t('marketplacePage.searchPlaceholder')}
            value={searchTerm}
            onClick={() => setIsSearchOpen(true)}
            readOnly
            className="marketplace-search-input"
          />
          {searchTerm && (
            <button
              className="marketplace-search-clear"
              onClick={() => setSearchTerm('')}
              aria-label={t('marketplacePage.clearSearch')}
            >
              ✕
            </button>
          )}
        </div>

        <button type="button" className="mp-mobile-filter-btn" onClick={() => setShowMobileFilters(true)}>
          <SlidersHorizontal size={16} /> {t('marketplacePage.filterButton')}
        </button>
      </div>
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={setSearchTerm}
        storageKey="zumo_recent_search_marketplace"
        placeholder={t('marketplacePage.searchPlaceholder')}
        initialValue={searchTerm}
        suggestions={[
          ...categories.map((category) => ({
            id: category.id,
            label: category.name,
            kind: 'category',
            hint: t('mkt.categories', 'Kategoriya'),
          })),
          ...items.map((item) => ({
            id: item.id,
            label: item.title,
            kind: 'listing',
            hint: categoryNames.get(item.level1) || t(`marketplace.types.${item.type}`, { defaultValue: item.type }),
          })).filter((item) => item.label),
        ]}
        onSelectSuggestion={(suggestion) => {
          if (suggestion.kind === 'category') {
            setSelectedLevel1s(new Set([suggestion.id]));
            setSelectedSubs(new Set());
            setSearchTerm('');
            return;
          }
          setSearchTerm(suggestion.label);
        }}
      />

      <div className="marketplace-body">
        <MarketplaceFilters
          selectedTypes={selectedTypes}
          onToggleType={toggleType}
          selectedLevel1s={selectedLevel1s}
          onToggleLevel1={toggleLevel1}
          selectedSubs={selectedSubs}
          onToggleSub={toggleSub}
          selectedServiceCats={selectedServiceCats}
          onToggleServiceCat={toggleServiceCat}
          onClearAll={clearAllFilters}
        />

        <div className="marketplace-content">
          {activeCategory && (
            <div className="mp-subcats" role="group" aria-label={activeCategory.name}>
              <h2 className="mp-subcats__title">
                <activeCategory.icon size={18} /> {activeCategory.name}
              </h2>
              <div className="mp-subcats__chips">
                <button
                  type="button"
                  className={`mp-subcat ${selectedSubs.size === 0 ? 'is-on' : ''}`}
                  onClick={() => setSelectedSubs(new Set())}
                >
                  {T('Hammasi')}
                </button>
                {activeCategory.subs.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className={`mp-subcat ${selectedSubs.has(sub.id) ? 'is-on' : ''}`}
                    onClick={() => toggleSub(sub.id)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {filteredItems.length === 0 ? (
            <div className="marketplace-empty">
              <Inbox size={48} />
              <p>{t('marketplacePage.empty')}</p>
              {(searchTerm || selectedTypes.size > 0 || selectedLevel1s.size > 0 || selectedSubs.size > 0 || selectedServiceCats.size > 0) && (
                <button
                  className="marketplace-clear-search-btn"
                  onClick={clearAllFilters}
                >
                  {t('marketplacePage.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <div className="uc-grid">
             {filteredItems.map(item => {
  if (item.type === 'service') {
    return (
      <ServiceProviderCard
        key={`service-${item.id}`}
        id={item.id}
        name={item.title}
        company={item.company}
        image={item.image}
        price_range={item.price}
        description={item.description}
      />
    );
  }

  return (
    <UniversalCard
      key={`${item.type}-${item.id}`}
      id={item.id}
      type={item.type}
      title={item.title}
      image={item.image}
      price={item.price}
      link={item.link}
      isTop={item.isTop}
      isVerified={item.isVerified}
      maxQuantity={item.maxQuantity}
      saleMode={item.saleMode}
    />
  );
})}
            </div>
          )}
        </div>
      </div>

      {showMobileFilters && (
        <div className="mp-mobile-filter-overlay" onClick={() => setShowMobileFilters(false)}>
          <div className="mp-mobile-filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mp-mobile-filter-header">
              <h3>{t('marketplacePage.mobileFilterTitle')}</h3>
              <button onClick={() => setShowMobileFilters(false)}><X size={20} /></button>
            </div>
            <MarketplaceFilters
              selectedTypes={selectedTypes}
              onToggleType={toggleType}
              selectedLevel1s={selectedLevel1s}
              onToggleLevel1={toggleLevel1}
              selectedSubs={selectedSubs}
              onToggleSub={toggleSub}
              selectedServiceCats={selectedServiceCats}
              onToggleServiceCat={toggleServiceCat}
              onClearAll={clearAllFilters}
            />
            <button className="mp-mobile-filter-apply" onClick={() => setShowMobileFilters(false)}>
              {t('marketplacePage.showResults')} ({filteredItems.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
