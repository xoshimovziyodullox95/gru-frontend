// src/pages/UserProfilePage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserById } from '../services/user'; // user service kerak
import { getLocationsByUserId, getEquipmentByUserId } from '../services/locations'; // yoki alohida funksiyalar
import { MapPin, Package, Calendar, User, Mail, Briefcase } from 'lucide-react';
import '../../styles/userProfile.css';

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await getUserById(userId);
        setUser(userRes.data);
        // e'lonlarni yuklash
        const locRes = await getLocationsByUserId(userId);
        setLocations(locRes.data || []);
        const eqRes = await getEquipmentByUserId(userId);
        setEquipment(eqRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  if (loading) return <div>Yuklanmoqda...</div>;
  if (!user) return <div>Foydalanuvchi topilmadi</div>;

  return (
    <div className="user-profile-wrapper">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Orqaga
      </button>
      <div className="user-profile-header">
        <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=00E5FF&color=fff&size=120`} alt="Avatar" className="profile-avatar" />
        <h1>{user.full_name || 'Ism sharif'}</h1>
        <p className="user-email"><Mail size={16} /> {user.email}</p>
        <p className="user-stats">
          <span><MapPin size={16} /> {locations.length} ta lokatsiya</span>
          <span><Package size={16} /> {equipment.length} ta texnika</span>
        </p>
      </div>

      <div className="user-listings">
        <h2>Lokatsiyalar ({locations.length})</h2>
        <div className="listing-grid">
          {locations.map(loc => (
            <div key={loc._id} className="listing-card" onClick={() => navigate(`/location/${loc._id}`)}>
              <img src={loc.images?.[0] || '/images/placeholder.jpg'} alt={loc.title} />
              <h4>{loc.title}</h4>
              <p>{loc.address}</p>
            </div>
          ))}
        </div>

        <h2>Texnikalar ({equipment.length})</h2>
        <div className="listing-grid">
          {equipment.map(eq => (
            <div key={eq._id} className="listing-card" onClick={() => navigate(`/equipment/${eq._id}`)}>
              <img src={eq.images?.[0] || '/images/placeholder.jpg'} alt={eq.title} />
              <h4>{eq.title}</h4>
              <p>{eq.price} so'm</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}