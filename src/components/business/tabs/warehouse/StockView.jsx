import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Settings2, X } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import RoleGate from '../../shared/RoleGate';
import { getStock, adjustStock } from '../../../services/business';

function AdjustModal({ product, onClose, onSaved, businessId, warehouseId }) {
  const [quantity, setQuantity] = useState('');
  const [direction, setDirection] = useState('increase');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      setError('Musbat son kiriting');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adjustStock(businessId, warehouseId, {
        productId: product.productId._id, quantity: Number(quantity), direction, note,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-modal-overlay" onClick={onClose}>
      <form className="pt-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
        <div className="pt-modal-header">
          <h3>Qoldiqni tuzatish</h3>
          <button type="button" className="pt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ color: 'var(--textMuted)', fontSize: '0.85rem', marginBottom: 12 }}>
          {product.productId.name} — joriy qoldiq: <strong>{product.quantity}</strong> {product.productId.unit}
        </p>

        <div className="pt-form-grid">
          <label className="pt-field pt-field-full">
            <span>Yo'nalish</span>
            <select value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="increase">Oshirish (+)</option>
              <option value="decrease">Kamaytirish (-)</option>
            </select>
          </label>
          <label className="pt-field pt-field-full">
            <span>Miqdor</span>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </label>
          <label className="pt-field pt-field-full">
            <span>Izoh (ixtiyoriy)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: brak, yo'qotish" />
          </label>
        </div>

        {error && <div className="pt-error">{error}</div>}

        <div className="pt-modal-actions">
          <button type="button" onClick={onClose} className="pt-btn-secondary">Bekor qilish</button>
          <button type="submit" disabled={saving} className="pt-btn-primary">{saving ? 'Saqlanmoqda...' : 'Tasdiqlash'}</button>
        </div>
      </form>
    </div>
  );
}

export default function StockView() {
  const { activeBusiness, activeWarehouse } = useBusiness();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustTarget, setAdjustTarget] = useState(null);

  const load = useCallback(async () => {
    if (!activeBusiness || !activeWarehouse) return;
    try {
      setLoading(true);
      const res = await getStock(activeBusiness._id, activeWarehouse._id);
      setStock(res.data);
    } catch (err) {
      console.error('Stokni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, activeWarehouse]);

  useEffect(() => { load(); }, [load]);

  if (!activeWarehouse) return <div className="pt-empty">Ombor tanlanmagan</div>;
  if (loading) return <div className="pt-empty">Yuklanmoqda...</div>;
  if (stock.length === 0) return <div className="pt-empty">Bu omborda hali mahsulot yo'q. Avval "Kirim" orqali tovar qabul qiling.</div>;

  return (
    <>
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th>Qoldiq</th>
              <th>Birlik</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stock.filter((s) => s.productId).map((s) => {
              const isLow = s.productId.minStockThreshold > 0 && s.quantity <= s.productId.minStockThreshold;
              return (
                <tr key={s._id}>
                  <td>{s.productId.name}</td>
                  <td>
                    {isLow && <AlertTriangle size={12} style={{ color: '#ffaa00', marginRight: 4 }} />}
                    {s.quantity}
                  </td>
                  <td className="pt-muted">{s.productId.unit}</td>
                  <td>
                    <RoleGate roles={['admin', 'warehouse_worker']}>
                      <button className="pt-icon-btn" onClick={() => setAdjustTarget(s)}><Settings2 size={14} /></button>
                    </RoleGate>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjustTarget && (
        <AdjustModal
          product={adjustTarget}
          businessId={activeBusiness._id}
          warehouseId={activeWarehouse._id}
          onClose={() => setAdjustTarget(null)}
          onSaved={() => { setAdjustTarget(null); load(); }}
        />
      )}
    </>
  );
}