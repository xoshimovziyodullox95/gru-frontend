import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { getMyOrders } from '../services/orders';
import '../../styles/myOrders.css';
import { formatPrice } from '../utils/formatPrice';

const STATUS_INFO = {
  yangi: { label: 'Yangi', color: '#94A3B8', icon: Clock },
  qabul_qilindi: { label: 'Qabul qilindi', color: '#fbbf24', icon: Package },
  yetkazilmoqda: { label: 'Yetkazilmoqda', color: '#60a5fa', icon: Truck },
  yetkazildi: { label: 'Yetkazildi', color: '#4ade80', icon: CheckCircle2 },
};

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="StatusScreen">Yuklanmoqda...</div>;

  return (
    <div className="mo-page">
      <button className="BackActionBtn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Orqaga
      </button>
      <h1 className="mo-title">Buyurtmalarim ({orders.length})</h1>

      {orders.length === 0 ? (
        <div className="mo-empty">Hozircha buyurtma yo'q</div>
      ) : (
        <div className="mo-list">
          {orders.map((o) => {
            const info = STATUS_INFO[o.status] || STATUS_INFO.yangi;
            const Icon = info.icon;
            return (
              <div key={o._id} className="mo-item">
                <div className="mo-item-info">
                  <span className="mo-item-title">{o.title}</span>
                <span className="mo-item-meta">{o.quantity} ta &middot; {formatPrice(o.price, o.currency)}</span>
                  <span className="mo-item-seller">{o.sellerId?.fullName || 'Sotuvchi'}</span>
                </div>
                <span className="mo-status-badge" style={{ color: info.color, borderColor: info.color }}>
                  <Icon size={13} /> {info.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}