import { safeGoBack } from '../utils/navigation.js';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, Landmark, Loader2, MessageCircle } from 'lucide-react';
import { getMyOrders, cancelOrder, getMyBankApplications } from '../services/orders';
import '../../styles/myOrders.css';
import { formatPrice } from '../utils/formatPrice';

const STATUS_INFO = {
  yangi: { label: 'Sotuvchi javobini kutmoqda', tone: 'wait', icon: Clock },
  qabul_qilindi: { label: 'Qabul qilindi', tone: 'active', icon: Package },
  yetkazilmoqda: { label: 'Yetkazilmoqda', tone: 'active', icon: Truck },
  yetkazildi: { label: 'Yetkazildi', tone: 'done', icon: CheckCircle2 },
  rad_etildi: { label: 'Sotuvchi rad etdi', tone: 'closed', icon: XCircle },
  bekor_qilindi: { label: 'Bekor qilindi', tone: 'closed', icon: XCircle },
};

const BANK_STATUS_INFO = {
  new: { label: 'Yuborildi', tone: 'wait', icon: Clock },
  in_progress: { label: 'Ko‘rib chiqilmoqda', tone: 'active', icon: Loader2 },
  approved: { label: 'Tasdiqlandi', tone: 'done', icon: CheckCircle2 },
  rejected: { label: 'Rad etildi', tone: 'closed', icon: XCircle },
};

function StatusBadge({ info }) {
  const Icon = info.icon;
  return (
    <span className={`mo-status-badge mo-tone-${info.tone}`}>
      <Icon size={13} /> {info.label}
    </span>
  );
}

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'bank' ? 'bank' : 'orders';

  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    Promise.allSettled([getMyOrders(), getMyBankApplications()])
      .then(([ordersRes, appsRes]) => {
        if (ordersRes.status === 'fulfilled') {
          const data = ordersRes.value.data;
          setOrders(Array.isArray(data) ? data : data?.orders || []);
        }
        if (appsRes.status === 'fulfilled') {
          setApplications(appsRes.value.data?.applications || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (order) => {
    if (!window.confirm(`"${order.title}" buyurtmasini bekor qilasizmi?`)) return;
    setCancellingId(order._id);
    try {
      const res = await cancelOrder(order._id);
      setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data.order : o)));
    } catch (err) {
      alert(err.response?.data?.error || 'Bekor qilib bo‘lmadi');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <div className="StatusScreen">Yuklanmoqda...</div>;

  return (
    <div className="mo-page">
      <button className="BackActionBtn" onClick={() => safeGoBack(navigate)}>
        <ArrowLeft size={16} /> Orqaga
      </button>
      <h1 className="mo-title">Buyurtmalarim</h1>

      <div className="mo-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`mo-tab ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setSearchParams({})}
        >
          <Package size={15} /> Tovarlar ({orders.length})
        </button>
        <button
          type="button"
          role="tab"
          className={`mo-tab ${tab === 'bank' ? 'active' : ''}`}
          onClick={() => setSearchParams({ tab: 'bank' })}
        >
          <Landmark size={15} /> Bank arizalari ({applications.length})
        </button>
      </div>

      {tab === 'orders' && (
        orders.length === 0 ? (
          <div className="mo-empty">
            Hozircha buyurtma yo‘q
            <button type="button" className="mo-advance-btn" onClick={() => navigate('/marketplace')}>
              Bozorga o‘tish
            </button>
          </div>
        ) : (
          <div className="mo-list">
            {orders.map((o) => {
              const info = STATUS_INFO[o.status] || STATUS_INFO.yangi;
              return (
                <div key={o._id} className={`mo-item ${info.tone === 'closed' ? 'mo-item-archived' : ''}`}>
                  <img
                    src={o.image || '/images/zumo-placeholder.svg'}
                    alt=""
                    className="mo-item-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/zumo-placeholder.svg'; }}
                  />
                  <div className="mo-item-info">
                    <span className="mo-item-title">{o.title}</span>
                    <span className="mo-item-meta">{o.quantity} ta &middot; {formatPrice(o.price, o.currency)}</span>
                    <span className="mo-item-seller">{o.sellerId?.fullName || o.sellerId?.full_name || 'Sotuvchi'}</span>
                    {o.deliveryEstimate?.value && o.status !== 'yetkazildi' && (
                      <span className="mo-delivery-estimate">
                        <Clock size={12} /> {o.deliveryEstimate.value} {o.deliveryEstimate.unit === 'soat' ? 'soatda' : 'kunda'} yetkaziladi
                      </span>
                    )}
                    {o.closeReason && <span className="mo-close-reason">Sabab: {o.closeReason}</span>}
                    <StatusBadge info={info} />
                  </div>
                  <div className="mo-item-actions-col">
                    {o.sellerId?._id && (
                      <button className="mo-chat-btn" onClick={() => navigate(`/chat?userId=${o.sellerId._id}`)}>
                        <MessageCircle size={14} /> Chat
                      </button>
                    )}
                    {o.status === 'yangi' && (
                      <button
                        className="mo-reject-btn"
                        disabled={cancellingId === o._id}
                        onClick={() => handleCancel(o)}
                      >
                        {cancellingId === o._id ? <Loader2 size={14} className="mo-spin" /> : 'Bekor qilish'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'bank' && (
        applications.length === 0 ? (
          <div className="mo-empty">
            Hozircha bank arizasi yo‘q
            <button type="button" className="mo-advance-btn" onClick={() => navigate('/bank-services')}>
              Bank xizmatlari
            </button>
          </div>
        ) : (
          <div className="mo-list">
            {applications.map((a) => {
              const info = BANK_STATUS_INFO[a.status] || BANK_STATUS_INFO.new;
              return (
                <div key={a._id} className="mo-item">
                  <div className="mo-item-icon"><Landmark size={20} /></div>
                  <div className="mo-item-info">
                    <span className="mo-item-title">{a.serviceName}</span>
                    {a.provider && <span className="mo-item-seller">{a.provider}</span>}
                    <span className="mo-item-meta">{new Date(a.createdAt).toLocaleDateString('uz-UZ')}</span>
                    {a.staffNote && <span className="mo-close-reason">Bank izohi: {a.staffNote}</span>}
                    <StatusBadge info={info} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
