import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Eye, X } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import RoleGate from '../shared/RoleGate';
import { getSales, getSale, refundSale } from '../../services/business';

function SaleDetailModal({ saleId, businessId, onClose, onRefunded }) {
  const [sale, setSale] = useState(null);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    getSale(businessId, saleId).then((res) => setSale(res.data)).catch(() => {});
  }, [businessId, saleId]);

  const handleRefund = async () => {
    if (!confirm('Bu sotuv qaytarilsinmi? Mahsulotlar omborga qaytadi.')) return;
    setRefunding(true);
    try {
      await refundSale(businessId, saleId);
      onRefunded();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setRefunding(false);
    }
  };

  if (!sale) return null;

  return (
    <div className="pt-modal-overlay" onClick={onClose}>
      <div className="pt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="pt-modal-header">
          <h3>Sotuv tafsiloti</h3>
          <button className="pt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem', marginBottom: 14 }}>
          <div><span className="pt-muted">Sana:</span> {new Date(sale.createdAt).toLocaleString()}</div>
          <div><span className="pt-muted">To'lov turi:</span> {sale.paymentType === 'cash' ? 'Naqd' : sale.paymentType === 'card' ? 'Karta' : 'Nasiya'}</div>
          {sale.customerId && <div><span className="pt-muted">Mijoz:</span> {sale.customerId.name}</div>}
          <div><span className="pt-muted">Holati:</span> {sale.status === 'completed' ? 'Yakunlangan' : sale.status === 'refunded' ? 'Qaytarilgan' : sale.status}</div>
        </div>

        <div className="pt-table-wrap" style={{ marginBottom: 14 }}>
          <table className="pt-table">
            <thead><tr><th>Mahsulot</th><th>Miqdor</th><th>Narx</th></tr></thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productId?.name || '—'}</td>
                  <td>{item.quantity} {item.productId?.unit}</td>
                  <td>{item.unitPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 14 }}>
          <span>Jami:</span>
          <span>{sale.total.toLocaleString()} so'm</span>
        </div>

        <div className="pt-modal-actions">
          <button className="pt-btn-secondary" onClick={onClose}>Yopish</button>
          {sale.status === 'completed' && (
            <RoleGate roles={['admin']}>
              <button className="pt-btn-primary" onClick={handleRefund} disabled={refunding} style={{ background: '#ff5c5c' }}>
                <RotateCcw size={14} /> {refunding ? 'Qaytarilmoqda...' : 'Qaytarish'}
              </button>
            </RoleGate>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SalesHistoryView() {
  const { activeBusiness } = useBusiness();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const load = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await getSales(activeBusiness._id);
      setSales(res.data);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="pt-empty">Yuklanmoqda...</div>;
  if (sales.length === 0) return <div className="pt-empty">Hali sotuvlar yo'q</div>;

  return (
    <>
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead><tr><th>Sana</th><th>To'lov</th><th>Summa</th><th>Holati</th><th></th></tr></thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s._id}>
                <td className="pt-muted">{new Date(s.createdAt).toLocaleString()}</td>
                <td>{s.paymentType === 'cash' ? 'Naqd' : s.paymentType === 'card' ? 'Karta' : 'Nasiya'}</td>
                <td>{s.total.toLocaleString()}</td>
                <td style={{ color: s.status === 'refunded' ? '#ff5c5c' : '#00c864' }}>
                  {s.status === 'completed' ? 'Yakunlangan' : s.status === 'refunded' ? 'Qaytarilgan' : s.status}
                </td>
                <td>
                  <button className="pt-icon-btn" onClick={() => setSelectedSaleId(s._id)}><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          businessId={activeBusiness._id}
          onClose={() => setSelectedSaleId(null)}
          onRefunded={load}
        />
      )}
    </>
  );
}