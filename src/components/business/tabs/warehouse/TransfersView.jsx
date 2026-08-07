import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { createTransfer, getProducts } from '../../../services/business';

export default function TransfersView() {
  const { activeBusiness, warehouses } = useBusiness();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!activeBusiness) return;
    getProducts(activeBusiness._id).then((res) => setProducts(res.data)).catch(() => {});
  }, [activeBusiness]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!form.productId || !form.fromWarehouseId || !form.toWarehouseId || !form.quantity) {
      setMessage({ type: 'error', text: 'Barcha maydonlarni to\'ldiring' });
      return;
    }
    if (form.fromWarehouseId === form.toWarehouseId) {
      setMessage({ type: 'error', text: 'Bir xil omborga ko\'chirib bo\'lmaydi' });
      return;
    }
    setSaving(true);
    try {
      await createTransfer(activeBusiness._id, { ...form, quantity: Number(form.quantity) });
      setMessage({ type: 'success', text: 'Muvaffaqiyatli ko\'chirildi' });
      setForm({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Xatolik yuz berdi' });
    } finally {
      setSaving(false);
    }
  };

  if (warehouses.length < 2) {
    return <div className="pt-empty">Ko'chirish uchun kamida 2 ta ombor kerak. "Boshqaruv" bo'limidan yangi ombor qo'shing.</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label className="pt-field">
        <span>Mahsulot</span>
        <select name="productId" value={form.productId} onChange={handleChange}>
          <option value="">Tanlang</option>
          {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </label>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <label className="pt-field" style={{ flex: 1 }}>
          <span>Qayerdan</span>
          <select name="fromWarehouseId" value={form.fromWarehouseId} onChange={handleChange}>
            <option value="">Tanlang</option>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </label>
        <ArrowRight size={18} style={{ marginBottom: 10, color: 'var(--textMuted)' }} />
        <label className="pt-field" style={{ flex: 1 }}>
          <span>Qayerga</span>
          <select name="toWarehouseId" value={form.toWarehouseId} onChange={handleChange}>
            <option value="">Tanlang</option>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </label>
      </div>

      <label className="pt-field">
        <span>Miqdor</span>
        <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" />
      </label>

      {message && (
        <div className={message.type === 'error' ? 'pt-error' : 'pt-success'}>{message.text}</div>
      )}

      <button type="submit" disabled={saving} className="pt-btn-primary" style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Ko\'chirilmoqda...' : 'Ko\'chirish'}
      </button>
    </form>
  );
}