import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { getReceivedOrders, updateOrderStatus } from '../services/orders';
import '../../styles/myOrders.css';
import { formatPrice } from '../utils/formatPrice';

const STATUS_FLOW = {
  yangi: { next: 'qabul_qilindi', label: 'Qabul qilish' },
  qabul_qilindi: { next: 'yetkazilmoqda', label: 'Yetkazishni boshlash' },
  yetkazilmoqda: { next: 'yetkazildi', label: "Yetkazildi deb belgilash" },
  yetkazildi: { next: null, label: null },
};

const STATUS_LABELS = {
  yangi: 'Yangi',
  qabul_qilindi: 'Qabul qilindi',
  yetkazilmoqda: 'Yetkazilmoqda',
  yetkazildi: 'Yetkazildi',
};

export default function ReceivedOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    getReceivedOrders()
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdvance = async (order) => {
    const nextStatus = STATUS_FLOW[order.status]?.next;
    if (!nextStatus) return;
    setUpdatingId(order._id);
    try {
      const res = await updateOrderStatus(order._id, nextStatus);
      setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data : o)));
    } catch (err) {
      alert('Xatolik yuz berdi');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="StatusScreen">Yuklanmoqda...</div>;

  const active = orders.filter((o) => o.status !== 'yetkazildi');
  const archived = orders.filter((o) => o.status === 'yetkazildi');

  return (
    <div className="mo-page">
      <button className="BackActionBtn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Orqaga
      </button>
      <h1 className="mo-title">Kelgan buyurtmalar ({active.length})</h1>

      {active.length === 0 ? (
        <div className="mo-empty">Hozircha yangi buyurtma yo'q</div>
      ) : (
        <div className="mo-list">
          {active.map((o) => {
            const flow = STATUS_FLOW[o.status];
            return (
              <div key={o._id} className="mo-item">
                <div className="mo-item-info">
                  <span className="mo-item-title">{o.title}</span>
   <span className="mo-item-meta">{o.quantity} ta &middot; {formatPrice(o.price, o.currency)}</span>
                  <span className="mo-item-seller">Xaridor: {o.buyerId?.fullName || 'Mijoz'}</span>
                  <span className="mo-current-status">Holat: {STATUS_LABELS[o.status]}</span>
                </div>
                {flow?.next && (
                  <button className="mo-advance-btn" disabled={updatingId === o._id} onClick={() => handleAdvance(o)}>
                    {updatingId === o._id ? <Loader2 size={14} className="mo-spin" /> : flow.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <>
          <h3 className="mo-archive-title">Arxiv ({archived.length})</h3>
          <div className="mo-list">
            {archived.map((o) => (
              <div key={o._id} className="mo-item mo-item-archived">
                <div className="mo-item-info">
                  <span className="mo-item-title">{o.title}</span>
   <span className="mo-item-meta">{o.quantity} ta &middot; {formatPrice(o.price, o.currency)}</span>
                  <span className="mo-item-seller">Xaridor: {o.buyerId?.fullName || 'Mijoz'}</span>
                </div>
                <span className="mo-status-badge" style={{ color: '#4ade80', borderColor: '#4ade80' }}>
                  <CheckCircle2 size={13} /> Yetkazildi
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}