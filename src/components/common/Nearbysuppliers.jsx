import { useEffect, useState } from 'react';
import { MapPin, Plus, Navigation, Sparkles } from 'lucide-react';
import { getNearbyEquipment } from '../services/equipment';
import { getNearbySummary } from '../services/aiChat';
import './summary.css'

/**
 * NearbySuppliers — ikki qatlamdan iborat:
 * 1) ANIQ hisoblangan (haversine) ro'yxat — bu HAQIQIY manba, xarid
 *    qilish/kalkulyatorga qo'shish shu yerdan bo'ladi.
 * 2) AI xulosasi — yuqoridagi ro'yxatni tabiiy tilda izohlaydi, lekin
 *    hech qanday yangi raqam/joy o'ylab topmaydi (backend'dagi qat'iy
 *    prompt shuni ta'minlaydi).
 */
export default function NearbySuppliers({ location, selectedItems, onAdd }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!location?.lat || !location?.lng || selectedItems.length === 0) {
      setResults([]);
      setAiSummary(null);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await getNearbyEquipment({
          lat: location.lat,
          lng: location.lng,
          level1: location.level1,
          radiusKm: 15,
          excludeIds: selectedItems.map((i) => i.id).join(','),
        });
        setResults(res.data);

        // 🔥 Faqat haqiqiy natija bo'lsa, AI'dan tabiiy tildagi
        // xulosani so'raymiz — bo'sh ro'yxat uchun AI chaqirilmaydi.
        if (res.data.length > 0) {
          setAiLoading(true);
          try {
            const summaryRes = await getNearbySummary({
              locationTitle: location.title,
              level1: location.level1,
              selectedItems,
              nearbyResults: res.data,
            });
            setAiSummary(summaryRes.data.summary);
          } catch (err) {
            console.error('AI xulosa xatosi:', err);
            setAiSummary(null);
          } finally {
            setAiLoading(false);
          }
        } else {
          setAiSummary(null);
        }
      } catch (err) {
        console.error('Yaqin takliflarni yuklashda xatolik:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng, location?.level1, selectedItems.length]);

  if (selectedItems.length === 0) return null;
  if (!loading && results.length === 0) return null;

  return (
    <div className="nearby-suppliers-panel">
      <h4><Navigation size={15} /> Sizga yaqin bo'lgan takliflar</h4>

      {loading ? (
        <p className="nearby-suppliers-loading">Qidirilmoqda...</p>
      ) : (
        <>
          {/* AI XULOSASI — faqat yuqoridagi haqiqiy ro'yxatni izohlaydi */}
          {aiLoading ? (
            <div className="nearby-ai-summary nearby-ai-loading">
              <Sparkles size={14} /> AI tahlil qilmoqda...
            </div>
          ) : aiSummary ? (
            <div className="nearby-ai-summary">
              <Sparkles size={14} className="nearby-ai-icon" />
              <p>{aiSummary}</p>
            </div>
          ) : null}

          <div className="nearby-suppliers-list">
            {results.map((item) => (
              <div key={item._id} className="nearby-supplier-item">
                <img
                  src={item.images?.[0] || '/images/placeholder-equipment.jpg'}
                  alt={item.title}
                  onError={(e) => { e.target.src = '/images/placeholder-equipment.jpg'; }}
                />
                <div className="nearby-supplier-info">
                  <span className="nearby-supplier-title">{item.title}</span>
                  <span className="nearby-supplier-meta">
                    <MapPin size={11} /> {item.ownerLocation?.title || item.owner?.fullName || 'Nomsiz'} — {item.distanceKm} km
                  </span>
                  <span className="nearby-supplier-price">${item.price?.toLocaleString()}</span>
                </div>
                <button
                  className="nearby-supplier-add-btn"
                  onClick={() => onAdd({ id: item._id, title: item.title, price: item.price })}
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}