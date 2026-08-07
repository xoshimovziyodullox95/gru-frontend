import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Package, DollarSign } from 'lucide-react';
import { getSupplierStats } from '../services/user';
import '../../styles/supplierStats.css';

export default function SupplierStatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupplierStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats({ totalOrders: 0, totalIncome: 0, orders: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="StatusScreen">Yuklanmoqda...</div>;

  return (
    <div className="ss-page">
      <button className="BackActionBtn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Orqaga
      </button>
      <h1 className="ss-title"><TrendingUp size={22} /> Postavshik statistikasi</h1>

      <div className="ss-stats-row">
        <div className="ss-stat-card">
          <Package size={22} />
          <div><span className="ss-stat-value">{stats.totalOrders}</span><span className="ss-stat-label">Jami buyurtmalar</span></div>
        </div>
        <div className="ss-stat-card">
          <DollarSign size={22} />
          <div><span className="ss-stat-value">${stats.totalIncome.toLocaleString()}</span><span className="ss-stat-label">Taxminiy kirim</span></div>
        </div>
      </div>

      <h3 className="ss-archive-title">Buyurtmalar arxivi</h3>
      {stats.orders.length === 0 ? (
        <div className="ss-empty">Hozircha buyurtma yo'q</div>
      ) : (
        <div className="ss-orders-list">
          {stats.orders.map((o) => (
            <div key={o._id} className="ss-order-item">
              <span className="ss-order-title">{o.orderInfo?.title}</span>
              <span className="ss-order-buyer">{o.fromUserId?.fullName || 'Mijoz'}</span>
              <span className="ss-order-qty">{o.orderInfo?.quantity} ta</span>
              <span className="ss-order-date">{new Date(o.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}