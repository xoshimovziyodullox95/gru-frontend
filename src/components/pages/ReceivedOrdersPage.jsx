// src/components/pages/ReceivedOrdersPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, MapPin, Clock, X, MessageCircle } from 'lucide-react';
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

  // Muddat tanlash modali uchun state
  const [deliveryModal, setDeliveryModal] = useState(null); // { order }
  const [deliveryValue, setDeliveryValue] = useState('');
  const [deliveryUnit, setDeliveryUnit] = useState('kun');

  useEffect(() => {
    getReceivedOrders()
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdvance = async (order) => {
    const nextStatus = STATUS_FLOW[order.status]?.next;
    if (!nextStatus) return;

    // 🔥 "Qabul qilish" bosilganda — avval muddat so'raymiz
    if (nextStatus === 'qabul_qilindi') {
      setDeliveryModal({ order });
      setDeliveryValue('');
      setDeliveryUnit('kun');
      return;
    }

    await doAdvance(order, nextStatus, null);
  };

  const doAdvance = async (order, nextStatus, deliveryEstimate) => {
    setUpdatingId(order._id);
    try {
      const res = await updateOrderStatus(order._id, nextStatus, deliveryEstimate);
      setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data : o)));
    } catch (err) {
      alert('Xatolik yuz berdi');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelivery = async () => {
    if (!deliveryValue || Number(deliveryValue) <= 0) {
      alert('Muddatni kiriting');
      return;
    }
    const order = deliveryModal.order;
    setDeliveryModal(null);
    await doAdvance(order, 'qabul_qilindi', { value: Number(deliveryValue), unit: deliveryUnit });
  };

  if (loading) return <div className="StatusScreen">Yuklanmoqda...</div>;

  const active = orders.filter((o) => o.status !== 'yetkazildi');
  const archived = orders.filter((o) => o.status === 'yetkazildi');

  const renderOrderCard = (o, archived = false) => {
    const flow = STATUS_FLOW[o.status];
    return (
      <div key={o._id} className={`mo-item ${archived ? 'mo-item-archived' : ''}`}>
        <img
          src={o.image || '/images/placeholder-equipment.jpg'}
          alt={o.title}
          className="mo-item-img"
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-equipment.jpg'; }}
        />
        <div className="mo-item-info">
          <span className="mo-item-title">{o.title}</span>
          <span className="mo-item-meta">{o.quantity} ta &middot; {formatPrice(o.price, o.currency)}</span>

          <div className="mo-buyer-row">
            <img src={o.buyerId?.avatar_url || '/images/placeholder.jpg'} alt="" className="mo-buyer-avatar" />
            <span className="mo-item-seller">{o.buyerId?.fullName || o.buyerId?.full_name || 'Mijoz'}</span>
          </div>

          {/* 🔥 TUMAN */}
          {o.district && (
            <span className="mo-district-badge"><MapPin size={12} /> {o.district}</span>
          )}

          {/* 🔥 SKLAD HOLATI */}
          {o.stockCheck?.inStock === false && (
            <span className="mo-stock-warning">⚠ Skladda yetarli emas (bor: {o.stockCheck.available})</span>
          )}

          {/* 🔥 YETKAZISH MUDDATI */}
          {o.deliveryEstimate?.value && (
            <span className="mo-delivery-estimate">
              <Clock size={12} /> {o.deliveryEstimate.value} {o.deliveryEstimate.unit === 'soat' ? 'soatda' : 'kunda'} yetkaziladi
            </span>
          )}

          {o.buyerLocation?.lat && (
            <a
              href={`https://www.google.com/maps?q=${o.buyerLocation.lat},${o.buyerLocation.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="mo-location-link"
            >
              <MapPin size={13} /> {o.buyerLocation.address || "Xaritada ko'rish"}
            </a>
          )}

          {!archived && <span className="mo-current-status">Holat: {STATUS_LABELS[o.status]}</span>}
        </div>

        {!archived ? (
          <div className="mo-item-actions-col">
            <button
              className="mo-chat-btn"
              onClick={() => navigate(`/chat?userId=${o.buyerId?._id}`)}
            >
              <MessageCircle size={14} /> Chat
            </button>
            {flow?.next && (
              <button className="mo-advance-btn" disabled={updatingId === o._id} onClick={() => handleAdvance(o)}>
                {updatingId === o._id ? <Loader2 size={14} className="mo-spin" /> : flow.label}
              </button>
            )}
          </div>
        ) : (
          <span className="mo-status-badge" style={{ color: '#4ade80', borderColor: '#4ade80' }}>
            <CheckCircle2 size={13} /> Yetkazildi
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mo-page">
      <button className="BackActionBtn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Orqaga
      </button>
      <h1 className="mo-title">Kelgan buyurtmalar ({active.length})</h1>

      {active.length === 0 ? (
        <div className="mo-empty">Hozircha yangi buyurtma yo'q</div>
      ) : (
        <div className="mo-list">{active.map((o) => renderOrderCard(o, false))}</div>
      )}

      {archived.length > 0 && (
        <>
          <h3 className="mo-archive-title">Arxiv ({archived.length})</h3>
          <div className="mo-list">{archived.map((o) => renderOrderCard(o, true))}</div>
        </>
      )}

      {/* 🔥 MUDDAT TANLASH MODALI */}
      {deliveryModal && (
        <div className="mo-modal-overlay" onClick={() => setDeliveryModal(null)}>
          <div className="mo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mo-modal-header">
              <h3><Clock size={18} /> Yetkazish muddatini tanlang</h3>
              <button onClick={() => setDeliveryModal(null)}><X size={18} /></button>
            </div>
            <p className="mo-modal-desc">"{deliveryModal.order.title}" buyurtmasini necha kun/soatda yetkazasiz?</p>
            <div className="mo-modal-form">
              <input
                type="number"
                min="1"
                placeholder="Son"
                value={deliveryValue}
                onChange={(e) => setDeliveryValue(e.target.value)}
                autoFocus
              />
              <select value={deliveryUnit} onChange={(e) => setDeliveryUnit(e.target.value)}>
                <option value="kun">kun</option>
                <option value="soat">soat</option>
              </select>
            </div>
            <button className="mo-modal-confirm" onClick={confirmDelivery}>Tasdiqlash va qabul qilish</button>
          </div>
        </div>
      )}
    </div>
  );
}