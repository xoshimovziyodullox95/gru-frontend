// src/pages/MarketplacePage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUrlParam, useUrlSet, useScrollRestore } from '../hooks/useUrlState';
import { useTranslation } from 'react-i18next';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';
import { useProductCategories } from '../utils/productCategories';
import { formatPrice } from '../utils/formatPrice';
import { safeGoBack } from '../utils/navigation';
import useEscapeClose from '../hooks/useEscapeClose';
import { conditionOptions, getFilterFacets, itemGender } from '../utils/listingSpec';

import {
  MapPin, Ruler, Tag, ArrowLeft, ArrowUpDown,
  Search, Loader2, Inbox, SlidersHorizontal, X
} from 'lucide-react';
import UniversalCard from '../pages/UniversalCard';
import MarketplaceFilters from '../marketplace/MarketplaceFilters';
import SearchOverlay from '../common/SearchOverlay';
import '../../styles/marketplace.css';
import '../../styles/marketplaceResults.css';

import { T } from '../utils/T';
import { searchWords, wordHits } from '../utils/searchMatch';
const searchableText = (value) => (typeof value === 'string' ? value.toLocaleLowerCase('uz-UZ') : '');
// Saralash uchun narxning birinchi sonini olamiz ("100 000 - 300 000 so'm" → 100000)
const priceNumber = (value) => {
  if (typeof value === 'number') return value;
  const match = String(value || '').replace(/\s/g, '').match(/\d+(?:[.,]\d+)?/);
  return match ? parseFloat(match[0].replace(',', '.')) : null;
};
const SORTS = ['new', 'cheap', 'expensive'];

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
  const [selectedConds, setSelectedConds] = useUrlSet('cond');
  const [selectedGenders, setSelectedGenders] = useUrlSet('gender');
  const [selectedSizes, setSelectedSizes] = useUrlSet('size');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sort, setSort] = useUrlParam('sort');
  useEscapeClose(showMobileFilters, () => setShowMobileFilters(false));
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
          priceValue: priceNumber(item.price_per_month ?? item.price_range),
          subtitle: item.address || '',
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
          priceValue: priceNumber(item.price),
          image: item.images?.[0] || '/images/zumo-placeholder.svg',
          link: `/equipment/${item._id}`,
          createdAt: item.createdAt,
          condition: item.condition,
          attrs: item.attributes || {},
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
  priceValue: priceNumber(item.price_range),
  subtitle: item.company || item.speciality || '',
  image: item.image || '/images/service-providers/default.jpg',
  link: `/service-provider/${item._id}`,
  createdAt: item.createdAt,
  isTop: item.is_top,
  isVerified: item.is_verified,
  rating: Array.isArray(item.ratings) && item.ratings.length
    ? item.ratings.reduce((sum, r) => sum + Number(r.value || 0), 0) / item.ratings.length
    : Number(item.rating || item.averageRating) || 0,
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
  const { list: filteredItems, similar: similarItems, similarKind } = useMemo(() => {
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

    // Holati, jins va o'lcham — faqat tovar e'lonlarida bor
    if (selectedConds.size > 0) {
      result = result.filter((item) => item.type === 'equipment' && selectedConds.has(item.condition));
    }
    if (selectedGenders.size > 0) {
      result = result.filter((item) => item.type === 'equipment' && selectedGenders.has(itemGender(item)));
    }
    if (selectedSizes.size > 0) {
      result = result.filter((item) => item.type === 'equipment' && selectedSizes.has(item.attrs?.size));
    }

    // 3. Xizmat yo'nalishi bo'yicha (mutaxassisning level1 si — yo'nalish slug'i)
    if (selectedServiceCats.size > 0) {
      result = result.filter((item) => item.type === 'service' && selectedServiceCats.has(item.level1));
    }

    // 4. Qidiruv: hamma so'z mos kelgani — aniq natija. Hech biri yo'q bo'lsa — o'xshashlari (pastda)
    let similar = [];
    let similarKind = 'similar';
    const words = searchWords(searchTerm);
    if (words.length) {
      const haystack = (item) => [
        item.title, item.description, item.level1, categoryNames.get(item.level1),
        categoryNames.get(`${item.level1}/${item.sub}`), ...(item.serviceTags || []),
        ...((item.meta || []).map((meta) => meta.text)),
      ].map(searchableText).join(' ');
      const titleHits = (item, fuzzy) => wordHits(item.title, words, fuzzy);
      const exact = result.filter((item) => wordHits(haystack(item), words) === words.length);
      if (!exact.length) {
        // Hech bo'lmasa bitta so'z (xato yozilganini ham — so'z boshi bo'yicha) mos kelganlar, ko'p moslari oldinda
        similar = result
          .map((item) => ({ item, score: wordHits(haystack(item), words, true) * 2 + titleHits(item, true) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 24)
          .map((x) => x.item);
        // O'xshashi ham yo'q — bo'sh sahifa o'rniga shu bo'limdagi eng yangi e'lonlar
        if (!similar.length) { similar = result.slice(0, 12); similarKind = 'latest'; }
      }
      result = exact.sort((a, b) => titleHits(b) - titleHits(a));
    }

    // 5. Saralash — narxi yo'qlar oxirida
    if (sort === 'cheap' || sort === 'expensive') {
      const dir = sort === 'cheap' ? 1 : -1;
      result = [...result].sort((a, b) => {
        if (a.priceValue == null) return 1;
        if (b.priceValue == null) return -1;
        return (a.priceValue - b.priceValue) * dir;
      });
    }

    return { list: result, similar, similarKind };
  }, [items, searchTerm, selectedTypes, selectedLevel1s, selectedSubs, selectedServiceCats, selectedConds, selectedGenders, selectedSizes, categoryNames, sort]);

  const activeFilterCount = selectedTypes.size + selectedLevel1s.size + selectedSubs.size + selectedServiceCats.size
    + selectedConds.size + selectedGenders.size + selectedSizes.size;

  // Kategoriyaga qarab qo'shimcha filtrlar: holati (hammasida), jins va o'lcham (kiyim, bolalar)
  const toggleIn = (setter) => (value) => setter((prev) => {
    const next = new Set(prev);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  });
  const facets = useMemo(() => {
    const list = [];
    const onlyFood = selectedLevel1s.size > 0 && [...selectedLevel1s].every((id) => id === 'oziqovqat');
    const equipmentAllowed = selectedTypes.size === 0 || selectedTypes.has('equipment');
    if (equipmentAllowed && !onlyFood) {
      list.push({ key: 'cond', title: T('Holati'), options: conditionOptions(), selected: selectedConds, onToggle: toggleIn(setSelectedConds) });
    }
    if (equipmentAllowed) {
      const f = getFilterFacets(selectedLevel1s, selectedSubs);
      if (f.gender.length) {
        list.push({ key: 'gender', title: T('Kimlar uchun'), options: f.gender, selected: selectedGenders, onToggle: toggleIn(setSelectedGenders) });
      }
      f.sizeGroups.forEach((g) => {
        const title = f.sizeGroups.length > 1
          ? `${T('O‘lcham')} · ${g.kind === 'shoes' ? T('Poyabzal') : g.kind === 'kids' ? T('Bolalar') : T('Kiyim')}`
          : T('O‘lcham');
        list.push({ key: `size-${g.kind}`, title, options: g.options, selected: selectedSizes, onToggle: toggleIn(setSelectedSizes) });
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel1s, selectedSubs, selectedTypes, selectedConds, selectedGenders, selectedSizes, categories]);
  const sortLabels = {
    new: t('marketplacePage.sortNew', 'Avval yangilari'),
    cheap: t('marketplacePage.sortCheap', 'Avval arzonlari'),
    expensive: t('marketplacePage.sortExpensive', 'Avval qimmatlari'),
  };
  const currentSort = SORTS.includes(sort) ? sort : 'new';
  const cycleSort = () => {
    const next = SORTS[(SORTS.indexOf(currentSort) + 1) % SORTS.length];
    setSort(next === 'new' ? '' : next);
  };
  const typeChips = [
    { value: '', label: t('marketplacePage.all', 'Hammasi') },
    { value: 'equipment', label: t('marketplaceFilters.typeEquipment') },
    { value: 'service', label: t('marketplaceFilters.typeService') },
    { value: 'location', label: t('marketplaceFilters.typeLocation') },
  ];
  const singleType = selectedTypes.size === 1 ? [...selectedTypes][0] : '';
  const pickType = (value) => setSelectedTypes(value ? new Set([value]) : new Set());
  const pageTitle = activeCategory?.name
    || (singleType ? typeChips.find((c) => c.value === singleType)?.label : null)
    || t('marketplacePage.title');

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
    setSelectedGenders(new Set());
    setSelectedSizes(new Set()); // o'lcham/jins kategoriyaga xos — eskisi qolib natijani yashirmasin
  };

  const toggleSub = (sub) => {
    setSelectedGenders(new Set());
    setSelectedSizes(new Set());
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
    setSelectedConds(new Set());
    setSelectedGenders(new Set());
    setSelectedSizes(new Set());
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
      <div className="mpx-top">
        <button type="button" className="mpx-icon-btn" onClick={() => safeGoBack(navigate)} aria-label={t('common.back', 'Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <div className="mpx-search" role="button" tabIndex={0} onClick={() => setIsSearchOpen(true)} onKeyDown={(e) => e.key === 'Enter' && setIsSearchOpen(true)}>
          <Search size={17} className="mpx-search__icon" />
          <span className={`mpx-search__text ${searchTerm ? 'has-value' : ''}`}>
            {searchTerm || t('marketplacePage.searchPlaceholder')}
          </span>
          {searchTerm && (
            <button
              type="button"
              className="mpx-search__clear"
              onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
              aria-label={t('marketplacePage.clearSearch')}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <button type="button" className={`mpx-icon-btn ${activeFilterCount ? 'is-on' : ''}`} onClick={() => setShowMobileFilters(true)} aria-label={t('marketplacePage.filterButton')}>
          <SlidersHorizontal size={19} />
          {activeFilterCount > 0 && <span className="mpx-icon-btn__badge">{activeFilterCount}</span>}
        </button>
      </div>

      <div className="mpx-chips">
        {typeChips.map((chip) => {
          const on = chip.value ? singleType === chip.value : selectedTypes.size === 0;
          return (
            <button key={chip.value || 'all'} type="button" aria-pressed={on} className={`mpx-chip ${on ? 'is-on' : ''}`} onClick={() => pickType(chip.value)}>
              {chip.label}
            </button>
          );
        })}
        {[...selectedLevel1s].map((id) => (
          <button key={id} type="button" className="mpx-chip is-on mpx-chip--removable" onClick={() => toggleLevel1(id)}>
            {categoryNames.get(id) || id} <X size={13} />
          </button>
        ))}
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
          facets={facets}
          onClearAll={clearAllFilters}
        />

        <div className="marketplace-content">
          <div className="mpx-bar">
            <h1 className="mpx-title">
              {pageTitle} <span className="mpx-count">{filteredItems.length}</span>
            </h1>
            <button type="button" className="mpx-sort" onClick={cycleSort}>
              <ArrowUpDown size={14} /> {sortLabels[currentSort]}
            </button>
          </div>
          {activeCategory && activeCategory.subs.length > 0 && (
            <div className="mp-subcats" role="group" aria-label={activeCategory.name}>
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
          {filteredItems.length === 0 && similarItems.length > 0 ? (
            <div className="mpx-similar">
              <div className="mpx-similar__note">
                <Search size={18} />
                <div>
                  <strong>{T('«{{q}}» bo‘yicha aniq natija topilmadi', { q: searchTerm.trim() })}</strong>
                  <span>{similarKind === 'latest' ? T('O‘xshashi ham yo‘q. Balki bular qiziqtirar:') : T('Shunga o‘xshash e’lonlar:')}</span>
                </div>
              </div>
              <div className="uc-grid">
                {similarItems.map((item) => (
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
                    rating={item.rating}
                    subtitle={item.subtitle}
                  />
                ))}
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="marketplace-empty">
              <Inbox size={48} />
              <p>{t('marketplacePage.empty')}</p>
              {(searchTerm || activeFilterCount > 0) && (
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
              {filteredItems.map((item) => (
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
                  rating={item.rating}
                  subtitle={item.subtitle}
                />
              ))}
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
              facets={facets}
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
