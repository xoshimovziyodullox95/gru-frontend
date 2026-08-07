import { useState } from 'react';
import { Navigation } from 'lucide-react';
import api from '../services/api';
import './SupplierSuggest.css';

export default function SupplierSuggest({ category }) {
  const [nearestSupplier, setNearestSupplier] = useState(null);
  const [loading, setLoading] = useState(false);

  const findNearestSupplier = () => {
    if (!navigator.geolocation) {
      alert("Geolokatsiya qo'llab-quvvatlanmaydi");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await api.get('/locations/nearest', {
          params: { lat: latitude, lng: longitude, productCategory: category }
        });
        setNearestSupplier(res.data);
      } catch (err) {
        console.error(err);
        alert("Yetkazib beruvchi topilmadi");
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error(err);
      alert("Geolokatsiya ruxsat berilmadi");
      setLoading(false);
    });
  };

  return (
    <div className="AiSuggestionCard">
      <button className="nearest-supplier-btn" onClick={findNearestSupplier} disabled={loading}>
        <Navigation size={16} /> {loading ? "Qidirilmoqda..." : "Eng yaqin yetkazib beruvchini top"}
      </button>
      {nearestSupplier && (
        <div className="supplier-suggestion">
          <p><strong>{nearestSupplier.supplier.title}</strong></p>
          <p>Masofa: {nearestSupplier.distance.toFixed(1)} km</p>
          <p>{nearestSupplier.supplier.address}</p>
          <a href={`tel:${nearestSupplier.supplier.phone}`}>Bog‘lanish</a>
        </div>
      )}
    </div>
  );
};