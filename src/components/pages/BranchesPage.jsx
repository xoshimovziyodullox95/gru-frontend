import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Building2 } from 'lucide-react';
import { getMyLocations } from '../services/user';
import '../../styles/branchesPage.css';

export default function BranchesPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyLocations()
      .then((res) => setLocations(res.data))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = locations.reduce((acc, loc) => {
    const key = loc.region || "Belgilanmagan";
    if (!acc[key]) acc[key] = [];
    acc[key].push(loc);
    return acc;
  }, {});

  if (loading) return <div className="StatusScreen">Yuklanmoqda...</div>;

  return (
    <div className="bp-page">
      <button className="BackActionBtn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Orqaga
      </button>
      <h1 className="bp-title"><Building2 size={22} /> Mening filiallarim ({locations.length})</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="bp-empty">Hozircha filial qo'shilmagan</div>
      ) : (
        Object.entries(grouped).map(([region, locs]) => (
          <div key={region} className="bp-region-block">
            <h3 className="bp-region-title">{region} <span>({locs.length})</span></h3>
            <div className="bp-locations-grid">
              {locs.map((loc) => (
                <div key={loc._id} className="bp-location-card" onClick={() => navigate(`/location/${loc._id}`)}>
                  <img src={loc.images?.[0] || '/images/placeholder.jpg'} alt={loc.title} />
                  <div className="bp-location-info">
                    <h4>{loc.title}</h4>
                    <p><MapPin size={13} /> {loc.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}