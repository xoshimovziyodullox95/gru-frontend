// src/pages/SubcategoryPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRandomLocationsWithFallback, getAllLocations } from '../services/locations';
import { getEquipment, getAllEquipment } from '../services/equipment';
import { getLevel2 } from '../services/categories';
import { MapPin, Ruler, ArrowLeft, Building2, Tag, Crown } from 'lucide-react';
import UniversalCard from './UniversalCard';
import '../../styles/subcategory.css';

export default function SubcategoryPage() {
  const { level1, level2 } = useParams();
  const { user } = useAuth();

  const [locations, setLocations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [subInfo, setSubInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPremium = user?.isPremium || user?.user_metadata?.isPremium || false;
  const LIMIT = 20; // kerakli miqdorga o‘zgartiring

  useEffect(() => {
    const fetchData = async () => {
      try {
        const decodedLevel1 = decodeURIComponent(level1);
        const decodedLevel2 = decodeURIComponent(level2);

        // Kategoriya ma'lumotlari (sarlavha uchun)
        const resSub = await getLevel2(decodedLevel1);
        const found = resSub.data.find(item => (item.level2 || item.key) === decodedLevel2);
        setSubInfo(found || null);

        let locs = { data: [] };
        let eqs = { data: [] };

        if (decodedLevel1 === "Yangi biznes") {
          // 🔥 Yangi biznes – barcha yo‘nalishlardagi barcha lokatsiya va texnikalar
          const [allLocs, allEqs] = await Promise.all([
            getAllLocations(LIMIT),   // barcha lokatsiyalar (filtrsiz)
            getAllEquipment(LIMIT),   // barcha texnikalar (filtrsiz)
          ]);
          locs = allLocs;
          eqs = allEqs;
        } else {
          // 🔥 Boshqa yo‘nalishlar – faqat shu level1 ga tegishli barcha lokatsiya va texnikalar
          const [filteredLocs, filteredEqs] = await Promise.all([
            getRandomLocationsWithFallback(decodedLevel1, null, LIMIT),
            getEquipment({ level1: decodedLevel1 }), // category filtrlanmaydi
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

  const decodedLevel2 = decodeURIComponent(level2);

  return (
    <div className="sub-page">
      <div className="sub-header">
        <Link to={`/category/${encodeURIComponent(level1)}`} className="sub-back-btn">
          <ArrowLeft size={20} /> Orqaga
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
                  <Tag size={16} /> Investitsiya: ${subInfo.capex_min} – ${subInfo.capex_max}
                </div>
              )
            ) : (
              <div className="sub-premium-lock">
                <Crown size={18} />
                <span>Narx va hisob-kitoblar premium aʼzolar uchun</span>
                <Link to="/premium" className="sub-premium-link">⭐ Premium boʻlish</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sub-container">
        {locations.length === 0 && equipment.length === 0 ? (
          <div className="sub-no-results">
            <Building2 size={48} />
            <p>Bu yo'nalish bo'yicha hozircha ma'lumot mavjud emas.</p>
            <span>Tez orada qo'shiladi</span>
          </div>
        ) : (
          <div className="uc-grid">
            {locations.map(loc => {
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
                  link={`/location/${locationId}`}
                  createdAt={loc.createdAt}
                  meta={[
                    { icon: MapPin, text: loc.address || 'Manzil mavjud emas' },
                    { icon: Ruler, text: loc.sqm ? `${loc.sqm} m²` : '—' },
                  ]}
                />
              );
            })}
            {equipment.map(eq => {
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
        )}
      </div>
    </div>
  );
}