// src/pages/SubcategoryPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 🔥 QO'SHILDI
import { useAuth } from '../context/AuthContext';
import { getRandomLocationsWithFallback, getAllLocations } from '../services/locations';
import { getEquipment, getAllEquipment } from '../services/equipment';
import { getLevel2 } from '../services/categories';
import {
  MapPin, Ruler, ArrowLeft, Building2, Tag, Crown,
  Store, UtensilsCrossed, Sprout, Heart, Gamepad2, Sparkles,
  Cpu, Sofa, Package, ListFilter
} from 'lucide-react';
import UniversalCard from './UniversalCard';
import { CATEGORY_CATALOGS } from '../utils/foodCategories'; // 🔥 TO'G'RI IMPORT
import '../../styles/subcategory.css';

// ===== YO'NALISH ICONLARI =====
const level1Icons = {
  "Do'konlar": Store,
  "Restoran/Kafe": UtensilsCrossed,
  "Agro": Sprout,
  "Klinika": Heart,
  "Ko'ngilochar": Gamepad2,
  "Yangi biznes": Sparkles,
};

// ===== TUR ICONLARI =====
const typeIcons = {
  location: MapPin,
  texnika: Cpu,
  mebel: Sofa,
  boshqa: Package,
  oziqovqat: UtensilsCrossed,
};

export default function SubcategoryPage() {
  const { level1, level2 } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation(); // 🔥 QO'SHILDI

  const [locations, setLocations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [subInfo, setSubInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // FILTR STATE
  const [typeFilter, setTypeFilter] = useState('all');
  const [foodCatFilter, setFoodCatFilter] = useState('');

  const isPremium = user?.isPremium || user?.user_metadata?.isPremium || false;
  const LIMIT = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const decodedLevel1 = decodeURIComponent(level1);
        const decodedLevel2 = decodeURIComponent(level2);

        const resSub = await getLevel2(decodedLevel1);
        const found = resSub.data.find(item => (item.level2 || item.key) === decodedLevel2);
        setSubInfo(found || null);

        let locs = { data: [] };
        let eqs = { data: [] };

        if (decodedLevel1 === "Yangi biznes") {
          const [allLocs, allEqs] = await Promise.all([
            getAllLocations(LIMIT),
            getAllEquipment(LIMIT),
          ]);
          locs = allLocs;
          eqs = allEqs;
        } else {
          const [filteredLocs, filteredEqs] = await Promise.all([
            getRandomLocationsWithFallback(decodedLevel1, null, LIMIT),
            getEquipment({ level1: decodedLevel1 }),
          ]);
          locs = filteredLocs;
          eqs = filteredEqs;
        }

        setLocations(locs.data || []);
        setEquipment(eqs.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [level1, level2]);

  if (loading) return <div className="sub-loading-spinner">Yuklanmoqda...</div>;

  const decodedLevel1 = decodeURIComponent(level1);
  const decodedLevel2 = decodeURIComponent(level2);

  // ===== JORIY YO'NALISHGA MOS KATALOG =====
  const activeCatalog = CATEGORY_CATALOGS[decodedLevel1] || null;

  // ===== FILTRLANGAN MA'LUMOTLAR =====
  const filteredLocations = typeFilter === 'all' || typeFilter === 'location' ? locations : [];

  const filteredEquipment = equipment.filter(eq => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'location') return false;
    if (eq.productType !== typeFilter) return false;
    if (activeCatalog && typeFilter === activeCatalog.productType && foodCatFilter) {
      return eq.attributes?.foodCategory === foodCatFilter;
    }
    return true;
  });

  // ===== FILTR TUGMALARINI YASASH =====
  const Level1Icon = level1Icons[decodedLevel1] || Building2;

  // Asosiy tugmalar (tarjima bilan)
  const filterButtons = [
    { key: 'all', label: t('filters.all', 'Hammasi'), icon: ListFilter },
    { key: 'location', label: t('filters.locations', 'Joylar'), icon: MapPin },
    { key: 'texnika', label: t('filters.equipment', 'Texnika'), icon: Cpu },
  ];

  // Agar joriy yo'nalishda katalog mavjud bo'lsa, uni tugma sifatida qo'shamiz
  if (activeCatalog) {
    const catalogLabel = activeCatalog.productType === 'oziqovqat' 
      ? t('filters.food', 'Oziq-ovqat') 
      : t('filters.catalog', 'Katalog');
    const CatalogIcon = activeCatalog.productType === 'oziqovqat' ? UtensilsCrossed : Package;
    filterButtons.push({
      key: activeCatalog.productType,
      label: catalogLabel,
      icon: CatalogIcon,
    });
  }

  filterButtons.push(
    { key: 'mebel', label: t('filters.furniture', 'Mebel'), icon: Sofa }
  );

  return (
    <div className="sub-page">
      <div className="sub-header">
        <Link to={`/category/${encodeURIComponent(level1)}`} className="sub-back-btn">
          <ArrowLeft size={20} /> {t('common.back', 'Orqaga')}
        </Link>
        <div className="sub-hero">
          {subInfo?.level2_image && (
            <img src={subInfo.level2_image} alt={decodedLevel2} className="sub-hero-img" />
          )}
          <div className="sub-hero-content">
            <h1 className="sub-title">{decodedLevel2}</h1>
            {isPremium ? (
              subInfo?.capex_min && subInfo?.capex_max && (
                <div className="sub-invest">
                  <Tag size={16} /> {t('subcategory.investment', 'Investitsiya')}: ${subInfo.capex_min} – ${subInfo.capex_max}
                </div>
              )
            ) : (
              <div className="sub-premium-lock">
                <Crown size={18} />
                <span>{t('subcategory.premiumLock', 'Narx va hisob-kitoblar premium aʼzolar uchun')}</span>
                <Link to="/premium" className="sub-premium-link">⭐ {t('subcategory.premiumLink', 'Premium boʻlish')}</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sub-container">
        {/* ===== FILTR TUGMALARI (gorizontal skroll) ===== */}
        <div className="sub-type-filter">
          {filterButtons.map(btn => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.key}
                className={typeFilter === btn.key ? 'active' : ''}
                onClick={() => {
                  setTypeFilter(btn.key);
                  setFoodCatFilter('');
                }}
              >
                <Icon size={16} />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===== KATALOG FILTRI (faqat joriy yo'nalishning katalogi) ===== */}
        {activeCatalog && typeFilter === activeCatalog.productType && (
          <div className="sub-food-cat-filter">
            <button
              className={foodCatFilter === '' ? 'active' : ''}
              onClick={() => setFoodCatFilter('')}
            >
              {t('filters.all', 'Barchasi')}
            </button>
            {Object.keys(activeCatalog.catalog).map(catKey => (
              <button
                key={catKey}
                className={foodCatFilter === catKey ? 'active' : ''}
                onClick={() => setFoodCatFilter(catKey)}
              >
                {t(`catalogs.${decodedLevel1}.${catKey}`, catKey)}
              </button>
            ))}
          </div>
        )}

        {/* ===== NATIJALAR (GURUHLANGAN) ===== */}
        {filteredLocations.length === 0 && filteredEquipment.length === 0 ? (
          <div className="sub-no-results">
            <div className="empty-icon-wrapper">
              <Building2 size={48} />
            </div>
            <h3>{t('subcategory.noDataTitle', 'Maʼlumot yoʻq')}</h3>
            <p>{t('subcategory.noDataDesc', 'Bu bo\'lim bo\'yicha hozircha hech narsa topilmadi.')}</p>
          </div>
        ) : (
          <>
            {filteredLocations.length > 0 && (
              <div className="sub-group">
                <div className="sub-group-header">
                  <MapPin size={18} />
                  <h3 className="sub-group-title">{t('subcategory.locations', 'Joylar')}</h3>
                  <span className="sub-group-count">{filteredLocations.length}</span>
                </div>
                <div className="uc-grid">
                  {filteredLocations.map(loc => {
                    const locationId = loc._id || loc.id;
                    if (!locationId) return null;
                    return (
                      <UniversalCard
                        key={locationId}
                        id={locationId}
                        type="location"
                        title={loc.title}
                        image={loc.images?.[0] || '/images/placeholder-location.jpg'}
                        price={loc.price_range}
                        currency={loc.currency}
                        link={`/location/${locationId}`}
                        createdAt={loc.createdAt}
                        meta={[
                          { icon: MapPin, text: loc.address || t('subcategory.noAddress', 'Manzil mavjud emas') },
                          { icon: Ruler, text: loc.sqm ? `${loc.sqm} m²` : '—' },
                        ]}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {filteredEquipment.length > 0 && (
              <div className="sub-group">
                <div className="sub-group-header">
                  <Package size={18} />
                  <h3 className="sub-group-title">{t('subcategory.products', 'Tovarlar')}</h3>
                  <span className="sub-group-count">{filteredEquipment.length}</span>
                </div>
                <div className="uc-grid">
                  {filteredEquipment.map(eq => {
                    const eqId = eq._id || eq.id;
                    if (!eqId) return null;
                    return (
                      <UniversalCard
                        key={eqId}
                        id={eqId}
                        type="equipment"
                        title={eq.title}
                        image={eq.images?.[0] || '/images/placeholder-equipment.jpg'}
                        price={eq.price}
                        currency={eq.currency}
                        link={`/equipment/${eqId}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}