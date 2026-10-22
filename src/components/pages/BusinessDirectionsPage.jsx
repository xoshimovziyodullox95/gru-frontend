import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Inbox, ArrowUp, ChevronLeft, ChevronRight, Sprout, UtensilsCrossed, HeartPulse, Wrench, GraduationCap, Store, PartyPopper, Lightbulb, Boxes, Package } from 'lucide-react';
import { getLevel1 } from '../services/categories';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import MarketplaceLayout from '../marketplace/MarketplaceLayout';
import SearchOverlay from '../common/SearchOverlay';
import UniversalCard from './UniversalCard';
import { useAuth } from '../context/AuthContext';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import '../../styles/businessDirections.css';

const CATEGORY_META = {
  Agro: { icon: Sprout, color: '#20b86a' },
  'Restoran/Kafe': { icon: UtensilsCrossed, color: '#ec405d' },
  Klinika: { icon: HeartPulse, color: '#315fe1' },
  Service: { icon: Wrench, color: '#0da99d' },
  "Ta'lim": { icon: GraduationCap, color: '#7547d8' },
  "Do'konlar": { icon: Store, color: '#ed690d' },
  "Ko'ngilochar": { icon: PartyPopper, color: '#c826a5' },
  'Yangi biznes': { icon: Lightbulb, color: '#edae00' },
};

const asArray = (response) => {
  const candidates = [response?.data, response?.data?.items, response?.data?.data, response?.items];
  return candidates.find(Array.isArray) || [];
};

export default function BusinessDirectionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [directions, setDirections] = useState([]);
  const [listings, setListings] = useState([]);
  const recentListings = useMemo(() => getRecentlyViewed(user?._id || user?.id), [user?._id, user?.id]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const recentCarouselRef = useRef(null);

  const scrollRecent = (direction) => {
    const carousel = recentCarouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({ left: direction * Math.max(carousel.clientWidth * 0.8, 260), behavior: 'smooth' });
  };

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getLevel1(), getLocations({ limit: 60 }), getEquipment({ limit: 60 })])
      .then(([cats, locations, equipment]) => {
        if (!mounted) return;
        setDirections(asArray(cats.status === 'fulfilled' ? cats.value : null));
        const places = asArray(locations.status === 'fulfilled' ? locations.value : null).map((item) => ({ ...item, listingType: 'location' }));
        const goods = asArray(equipment.status === 'fulfilled' ? equipment.value : null).map((item) => ({ ...item, listingType: 'equipment' }));
        setListings([...places, ...goods]);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop((window.scrollY || 0) > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const visibleListings = useMemo(() => listings.filter((item) => {
    const term = searchTerm.trim().toLocaleLowerCase();
    const searchMatch = !term || `${item.title || item.name || ''} ${item.description || ''} ${item.category || ''} ${item.region || ''}`.toLocaleLowerCase().includes(term);
    return searchMatch;
  }), [listings, searchTerm]);

  return (
    <MarketplaceLayout homePath="/business-directions">
      <div className="biz-dir-page">
        <button type="button" className="biz-dir-search-trigger" onClick={() => setIsSearchOpen(true)}>
          <Search size={18} /><span className={searchTerm ? 'has-value' : ''}>{searchTerm || t('common.searchPlaceholder', 'Nima qidiryapsiz?')}</span>
          {searchTerm && <span className="biz-dir-search-trigger__clear" onClick={(event) => { event.stopPropagation(); setSearchTerm(''); }}>✕</span>}
        </button>
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSearch={setSearchTerm}
          suggestions={[
            ...directions.map((item) => ({
              id: item.key,
              label: t(`categories.${item.key}`, { defaultValue: item.name || item.key }),
              kind: 'category',
              hint: t('businessDirections.categoriesSubtitle', 'Yo‘nalish'),
            })),
            ...listings.map((item) => ({
              id: item._id,
              label: item.title || item.name,
              kind: 'listing',
              hint: item.listingType === 'location' ? t('marketplace.types.location', 'Joy') : t('marketplace.types.equipment', 'Tovar'),
            })).filter((item) => item.label),
          ]}
          onSelectSuggestion={(suggestion) => {
            if (suggestion.kind === 'category') {
              navigate(`/category/${encodeURIComponent(suggestion.id)}`, { state: { from: '/business-directions' } });
              return;
            }
            setSearchTerm(suggestion.label);
          }}
          storageKey="zumo_recent_search_business"
          placeholder={t('common.searchPlaceholder', 'Nima qidiryapsiz?')}
          initialValue={searchTerm}
        />

        <section className="biz-dir-cats-section" aria-label={t('businessDirections.categoriesSubtitle', 'Yo‘nalishlar')}>
          <p className="biz-dir-cats-subtitle">{t('businessDirections.categoriesSubtitle', 'Yo‘nalish bo‘yicha e’lonlarni tanlang')}</p>
          <div className="biz-dir-cats-grid">
            {directions.map((item) => {
              const categoryMeta = CATEGORY_META[item.key] || { icon: Boxes, color: 'var(--cyan)' };
              const Icon = categoryMeta.icon;
              return <button key={item.key} type="button" className="biz-dir-cat-card" onClick={() => navigate(`/category/${encodeURIComponent(item.key)}`, { state: { from: '/business-directions' } })}><span className="biz-dir-cat-card__icon" style={{ '--category-color': categoryMeta.color }}><Icon size={24} /></span><span className="biz-dir-cat-card__name">{t(`categories.${item.key}`, { defaultValue: item.name || item.key })}</span></button>;
            })}
          </div>
        </section>

            {user && recentListings.length > 0 && <section className="biz-dir-recent" aria-label={t('businessDirections.recentTitle', 'Oxirgi ko‘rilgan e’lonlar')}>
        <div className="biz-dir-recent__heading"><div className="biz-dir-results-header"><h2>{t('businessDirections.recentTitle', 'Oxirgi ko‘rilgan e’lonlar')}</h2></div><div className="biz-dir-recent__controls"><button type="button" onClick={() => scrollRecent(-1)} aria-label={t('common.previous', 'Oldingilari')}><ChevronLeft size={20} /></button><button type="button" onClick={() => scrollRecent(1)} aria-label={t('common.next', 'Keyingilari')}><ChevronRight size={20} /></button></div></div>
        <div className="biz-dir-recent__carousel" ref={recentCarouselRef}>{recentListings.map((item) => <div className="biz-dir-recent__item" key={`${item.type}-${item.id}`}><UniversalCard
          id={item.id}
          type={item.type}
          title={item.title}
          image={item.image}
          price={item.price}
          currency={item.currency}
          link={item.link}
          maxQuantity={item.maxQuantity}
        /></div>)}</div>
      </section>}

        <div className="biz-dir-results-header">
          <h2><Package size={19} />{t('businessDirections.adsTitle', 'E’lonlar')}</h2>
        </div>

        {loading ? <div className="biz-dir-loading"><Loader2 size={32} className="biz-dir-spinner" /><span>{t('businessDirections.loading', 'Yuklanmoqda...')}</span></div>
          : visibleListings.length === 0 ? <div className="biz-dir-empty"><Inbox size={48} /><p>{t('businessDirections.noAds', 'Bu yo‘nalishda hozircha e’lon yo‘q')}</p></div>
            : <div className="biz-dir-grid">{visibleListings.map((item) => {
              const isLocation = item.listingType === 'location';
              const price = isLocation
                ? (item.price_per_month ? `${item.price_per_month} ${item.currency || "so'm"}/oy` : item.price_range || '')
                : item.price;
              return <UniversalCard
                key={`${item.listingType}-${item._id}`}
                id={item._id}
                type={isLocation ? 'location' : 'equipment'}
                title={item.title || item.name || t('common.untitled', 'E’lon')}
                image={item.images?.[0] || item.image || item.imageUrl || ''}
                price={price}
                currency={item.currency}
                link={isLocation ? `/location/${item._id}` : `/equipment/${item._id}`}
                maxQuantity={item.stockQuantity}
              />;
            })}</div>}
      </div>
      {showScrollTop && <button type="button" className="biz-dir-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={t('common.scrollTop', 'Tepaga qaytish')}><ArrowUp size={20} /></button>}
    </MarketplaceLayout>
  );
}
