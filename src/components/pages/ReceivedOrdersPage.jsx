// src/components/pages/ReceivedOrdersPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, MapPin, Phone, Clock, Truck, PackageCheck, User } from 'lucide-react';
import { getReceivedOrders, updateOrderStatus } from '../services/orders';
import { formatPrice } from '../utils/formatPrice';
import '../../styles/myOrders.css';

const STATUS_FLOW = {
  yangi: { next: 'qabul_qilindi', label: 'Qabul qilish', icon: Clock, color: '#3b82f6' },
  qabul_qilindi: { next: 'yetkazilmoqda', label: 'Yetkazishni boshlash', icon: PackageCheck, color: '#f59e0b' },
  yetkazilmoqda: { next: 'yetkazildi', label: "Yetkazildi deb belgilash", icon: Truck, color: '#8b5cf6' },
  yetkazildi: { next: null, label: null, icon: CheckCircle2, color: '#22c55e' },
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
      .then((res) => setOrders(res.data.orders || res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdvance = async (order) => {
    const nextStatus = STATUS_FLOW[order.status]?.next;
    if (!nextStatus) return;
    setUpdatingId(order._id);
    try {
      const res = await updateOrderStatus(order._id, nextStatus);
      setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data.order || res.data : o)));
    } catch (err) {
      alert('Xatolik yuz berdi');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mo-loading">
        <Loader2 size={36} className="mo-spin" />
        <span>Yuklanmoqda...</span>
      </div>
    );
  }

  const active = orders.filter((o) => o.status !== 'yetkazildi');
  const archived = orders.filter((o) => o.status === 'yetkazildi');

  return (
    <div className="mo-page">
      <button className="mo-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Orqaga
      </button>

      <div className="mo-header">
        <h1 className="mo-title">📦 Kelgan buyurtmalar</h1>
        <span className="mo-badge">{active.length} ta</span>
      </div>

      {active.length === 0 ? (
        <div className="mo-empty">
          <PackageCheck size={48} className="mo-empty-icon" />
          <h3>Hozircha yangi buyurtma yo'q</h3>
          <p>Buyurtmalar kelganda bu yerda ko‘rinadi</p>
        </div>
      ) : (
        <div className="mo-list">
          {active.map((o) => {
            const flow = STATUS_FLOW[o.status];
            const StatusIcon = flow.icon;
            const statusColor = flow.color;
            return (
              <div key={o._id} className="mo-item">
                <div className="mo-item-left">
                  <img
                    src={o.image || '/images/placeholder-equipment.jpg'}
                    alt={o.title}
                    className="mo-item-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-equipment.jpg'; }}
                  />
                  <div className="mo-item-info">
                    <span className="mo-item-title">{o.title}</span>
                    <span className="mo-item-meta">{o.quantity} ta · {formatPrice(o.price, o.currency)}</span>

                    <div className="mo-buyer-row">
                      <img
                        src={o.buyerId?.avatar_url || '/images/placeholder.jpg'}
                        alt={o.buyerId?.fullName || 'Mijoz'}
                        className="mo-buyer-avatar"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }}
                      />
                      <span className="mo-item-seller">
                        <User size={12} /> {o.buyerId?.fullName || 'Mijoz'}
                      </span>
                      {o.buyerId?.phone && (
                        <a href={`tel:${o.buyerId.phone}`} className="mo-buyer-phone">
                          <Phone size={12} /> {o.buyerId.phone}
                        </a>
                      )}
                    </div>

                    {o.buyerLocation?.lat && (
                      <a
                        href={`https://www.google.com/maps?q=${o.buyerLocation.lat},${o.buyerLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mo-location-link"
                      >
                        <MapPin size={12} /> {o.buyerLocation.address || 'Xaritada ko\'rish'}
                      </a>
                    )}

                    <div className="mo-status-chip" style={{ '--status-color': statusColor }}>
                      <StatusIcon size={12} />
                      <span>{STATUS_LABELS[o.status]}</span>
                    </div>
                  </div>
                </div>

                {flow?.next && (
                  <button
                    className="mo-advance-btn"
                    disabled={updatingId === o._id}
                    onClick={() => handleAdvance(o)}
                  >
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
          <div className="mo-archive-header">
            <h3 className="mo-archive-title">✅ Arxiv</h3>
            <span className="mo-archive-count">{archived.length} ta</span>
          </div>
          <div className="mo-list mo-list-archived">
            {archived.map((o) => (
              <div key={o._id} className="mo-item mo-item-archived">
                <div className="mo-item-left">
                  <img
                    src={o.image || '/images/placeholder-equipment.jpg'}
                    alt={o.title}
                    className="mo-item-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-equipment.jpg'; }}
                  />
                  <div className="mo-item-info">
                    <span className="mo-item-title">{o.title}</span>
                    <span className="mo-item-meta">{o.quantity} ta · {formatPrice(o.price, o.currency)}</span>

                    <div className="mo-buyer-row">
                      <img
                        src={o.buyerId?.avatar_url || '/images/placeholder.jpg'}
                        alt={o.buyerId?.fullName || 'Mijoz'}
                        className="mo-buyer-avatar"
                      />
                      <span className="mo-item-seller"><User size={12} /> {o.buyerId?.fullName || 'Mijoz'}</span>
                    </div>

                    {o.buyerLocation?.lat && (
                      <a
                        href={`https://www.google.com/maps?q=${o.buyerLocation.lat},${o.buyerLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mo-location-link"
                      >
                        <MapPin size={12} /> {o.buyerLocation.address || 'Xaritada ko\'rish'}
                      </a>
                    )}

                    <div className="mo-status-chip delivered">
                      <CheckCircle2 size={12} />
                      <span>Yetkazildi</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}