// src/pages/MarketplacePage.jsx
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';
import { getBankServices } from '../services/bankServices';
import ServiceProviderCard from '../marketplace/ServiceProviderCard';
import { formatPrice } from '../utils/formatPrice';

import {
  ArrowLeft, MapPin, Ruler, Tag,
  Search, Store, Loader2, Inbox, SlidersHorizontal, X
} from 'lucide-react';
import UniversalCard from '../pages/UniversalCard';
import BankServiceCard from '../marketplace/BankServiceCard';
import MarketplaceFilters from '../marketplace/MarketplaceFilters';
import '../../styles/marketplace.css';

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [selectedLevel1s, setSelectedLevel1s] = useState(new Set());
  const [selectedServiceCats, setSelectedServiceCats] = useState(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ========== MA'LUMOTLARNI YUKLASH ==========
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [locRes, eqRes, servRes, bankRes] = await Promise.all([
          getLocations(),
          getEquipment(),
          getServiceProviders(),
          getBankServices()
        ]);

        console.log('📦 BANK SERVICES RESPONSE:', bankRes.data);

        const locations = locRes.data.map(item => ({
          id: item._id,
          type: 'location',
          level1: item.level1,
          title: item.title,
          description: item.description || 'Joy haqida ma\'lumot',
          price: item.price_range || item.price_per_month || 'Narxi mavjud emas',
          image: item.images?.[0] || '/images/placeholder.jpg',
          link: `/location/${item._id}`,
          createdAt: item.createdAt,
          meta: [
            { icon: MapPin, text: item.address || 'Manzil mavjud emas' },
            ...(item.sqm ? [{ icon: Ruler, text: `${item.sqm} m²` }] : []),
          ],
        }));

        const equipment = eqRes.data.map(item => ({
          id: item._id,
          type: 'equipment',
          level1: item.level1,
          title: item.title,
          description: item.description || 'Texnika haqida ma\'lumot',
          price: formatPrice(item.price, item.currency) || 'Narxi mavjud emas',
          image: item.images?.[0] || '/images/placeholder-equipment.jpg',
          link: `/equipment/${item._id}`,
          createdAt: item.createdAt,
          meta: [],
          maxQuantity: typeof item.stockQuantity === 'number' ? item.stockQuantity : undefined,
        }));

const services = servRes.data.map(item => ({
  id: item._id,
  type: 'service',
  level1: item.level1,
  serviceTags: [item.service_category],   // <-- TUZATILDI: massiv ichiga category qo'yildi
  title: item.name,
  company: item.company,
  description: item.description || 'Xizmat haqida ma\'lumot',
  price: item.price_range || 'Narxi mavjud emas',
  image: item.image || '/images/service-providers/default.jpg',
  link: `/service-provider/${item._id}`,
  createdAt: item.createdAt,
  isTop: item.is_top,
  isVerified: item.is_verified,
  rating: item.rating,
  meta: item.speciality ? [{ icon: Tag, text: item.speciality }] : [],
}));

        // ========== BANK / QR XIZMATLAR ==========
        const bankServices = (bankRes.data || [])
          .filter(item => item.category === 'bank_service')
          .map(item => ({
            id: item._id,
            type: 'bank_service',
            serviceName: item.serviceName,
            provider: item.provider,
            providerLogo: item.providerLogo || '/images/logo/default.png',
            description: item.description || '',
            commission: item.commission || '0%',
            subCategory: item.subCategory || 'other', // 🔥 muhim: 'qr-payment' yoki 'credit' va h.k.
            createdAt: item.createdAt,
          }));

        console.log('📦 BANK SERVICES FORMATLANGAN:', bankServices);

        const all = [...locations, ...equipment, ...services, ...bankServices];
        const shuffled = all.sort(() => Math.random() - 0.5);
        setItems(shuffled);
      } catch (err) {
        console.error('Marketplace yuklash xatosi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ========== FILTRLASH ==========
  const filteredItems = useMemo(() => {
    console.log('🟢 FILTREDITEMS USEMEMO ISHGA TUSHDI');
    console.log('📌 TANLANGAN SERVICE CATS:', [...selectedServiceCats]);
    console.log('📌 BARCHA ITEMS TURLARI:', items.map(i => ({ type: i.type, title: i.title, subCategory: i.subCategory })));

    let result = items;

    // 1. TYPE bo'yicha filtr
    if (selectedTypes.size > 0) {
      result = result.filter((item) => selectedTypes.has(item.type));
    }

    // 2. LEVEL1 bo'yicha filtr
    if (selectedLevel1s.size > 0) {
      result = result.filter((item) => selectedLevel1s.has(item.level1));
    }

    // 3. SERVICE TAGS / subCategory bo'yicha filtr
    if (selectedServiceCats.size > 0) {
      result = result.filter((item) => {
        // Bank xizmatlari uchun
        if (item.type === 'bank_service') {
          const match = selectedServiceCats.has(item.subCategory);
          console.log(`📌 bank_service: ${item.serviceName}, subCategory: ${item.subCategory}, match: ${match}`);
          return match;
        }
        // Oddiy service'lar uchun (serviceTags)
        if (item.type === 'service') {
          return (item.serviceTags || []).some((tag) => selectedServiceCats.has(tag));
        }
        // Boshqa turlar (location, equipment) – service tag filtriga tushmaydi
        return false;
      });
    }

    // 4. Qidiruv bo'yicha filtr
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => {
        if (item.type === 'bank_service') {
          return (
            item.serviceName?.toLowerCase().includes(term) ||
            item.provider?.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
          );
        }
        return (
          item.title?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.type?.toLowerCase().includes(term) ||
          (item.meta && item.meta.some(m => m.text.toLowerCase().includes(term)))
        );
      });
    }

    console.log('📊 FILTR NATIJASI:', result.length, 'ta item');
    return result;
  }, [items, searchTerm, selectedTypes, selectedLevel1s, selectedServiceCats]);

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
  };

  const toggleServiceCat = (slug) => {
    console.log('🔄 TOGGLE SERVICE CAT:', slug);
    setSelectedServiceCats((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      console.log('🔄 YANGI TANLANGANLAR:', [...next]);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedTypes(new Set());
    setSelectedLevel1s(new Set());
    setSelectedServiceCats(new Set());
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
        <Link to="/" className="marketplace-back-btn">
          <ArrowLeft size={20} />
          <span>{t('marketplacePage.back')}</span>
        </Link>

        <h1 className="marketplace-page-title">
          <Store size={24} />
          {t('marketplacePage.title')}
        </h1>

        <div className="marketplace-search-bar">
          <Search size={18} className="marketplace-search-icon" />
          <input
            type="text"
            placeholder={t('marketplacePage.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        <button className="mp-mobile-filter-btn" onClick={() => setShowMobileFilters(true)}>
          <SlidersHorizontal size={16} /> {t('marketplacePage.filterButton')}
        </button>
      </div>

      <div className="marketplace-body">
        <MarketplaceFilters
          selectedTypes={selectedTypes}
          onToggleType={toggleType}
          selectedLevel1s={selectedLevel1s}
          onToggleLevel1={toggleLevel1}
          selectedServiceCats={selectedServiceCats}
          onToggleServiceCat={toggleServiceCat}
          onClearAll={clearAllFilters}
        />

        <div className="marketplace-content">
          {filteredItems.length === 0 ? (
            <div className="marketplace-empty">
              <Inbox size={48} />
              <p>{t('marketplacePage.empty')}</p>
              {(searchTerm || selectedTypes.size > 0 || selectedLevel1s.size > 0 || selectedServiceCats.size > 0) && (
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
  if (item.type === 'bank_service') {
    return (
      <BankServiceCard
        key={`bank_service-${item.id}`}
        id={item.id}
        serviceName={item.serviceName}
        provider={item.provider}
        providerLogo={item.providerLogo}
        description={item.description}
        commission={item.commission}
      />
    );
  }

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