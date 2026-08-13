import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, Barcode, AlertTriangle, Camera } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import RoleGate from '../shared/RoleGate.jsx';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/business';
import ImageRecognizeModal from './warehouse/Imagerecognizemodal.jsx'; // yo‘lni tekshiring
import '../../../styles/productsTab.css';

const UNITS = ['dona', 'kg', 'litr', 'metr', 'quti', 'paket'];

const EMPTY_FORM = {
  name: '', barcode: '', unit: 'dona', category: '', costPrice: '', markupPercent: '', sellPrice: '', minStockThreshold: '',
};

// ==================== MAHSULOT FORMASI (yaratish/tahrirlash) ====================
function ProductFormModal({ initial, onClose, onSaved, businessId }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(initial?._id);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCostOrMarkupChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    const cost = Number(newForm.costPrice) || 0;
    const markup = Number(newForm.markupPercent) || 0;
    if (cost > 0 && markup > 0) {
      newForm.sellPrice = Math.round(cost + (cost * markup) / 100);
    }
    setForm(newForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sellPrice) {
      setError('Nomi va sotuv narxi majburiy');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        barcode: form.barcode.trim() || undefined,
        unit: form.unit,
        category: form.category.trim(),
        costPrice: Number(form.costPrice) || 0,
        sellPrice: Number(form.sellPrice),
        minStockThreshold: Number(form.minStockThreshold) || 0,
      };
      if (isEdit) {
        await updateProduct(businessId, initial._id, payload);
      } else {
        await createProduct(businessId, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-modal-overlay" onClick={onClose}>
      <form className="pt-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="pt-modal-header">
          <h3>{isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h3>
          <button type="button" className="pt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="pt-form-grid">
          <label className="pt-field">
            <span>Nomi *</span>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Masalan: Pepsi 1.5L" required />
          </label>

          <label className="pt-field">
            <span>Shtrix-kod</span>
            <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="Ixtiyoriy" />
          </label>

          <label className="pt-field">
            <span>O'lchov birligi</span>
            <select name="unit" value={form.unit} onChange={handleChange}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>

          <label className="pt-field">
            <span>Kategoriya</span>
            <input name="category" value={form.category} onChange={handleChange} placeholder="Ixtiyoriy" />
          </label>

          <label className="pt-field">
            <span>Tannarx</span>
            <input name="costPrice" type="number" min="0" value={form.costPrice} onChange={handleCostOrMarkupChange} placeholder="0" />
          </label>

          <label className="pt-field">
            <span>Foiz qo'yish (%)</span>
            <input name="markupPercent" type="number" min="0" value={form.markupPercent} onChange={handleCostOrMarkupChange} placeholder="Masalan: 20" />
          </label>

          <label className="pt-field">
            <span>Sotuv narxi *</span>
            <input name="sellPrice" type="number" min="0" value={form.sellPrice} onChange={handleChange} placeholder="0" required />
          </label>

          <label className="pt-field pt-field-full">
            <span>Minimal qoldiq (ogohlantirish uchun)</span>
            <input name="minStockThreshold" type="number" min="0" value={form.minStockThreshold} onChange={handleChange} placeholder="Masalan: 5" />
          </label>
        </div>

        {error && <div className="pt-error">{error}</div>}

        <div className="pt-modal-actions">
          <button type="button" onClick={onClose} className="pt-btn-secondary">Bekor qilish</button>
          <button type="submit" disabled={saving} className="pt-btn-primary">
            {saving ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : 'Qo\'shish'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ==================== ASOSIY TAB ====================
export default function ProductsTab() {
  const { activeBusiness } = useBusiness();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState(null);
  const [showImageRecognize, setShowImageRecognize] = useState(false); // yangi state

  const loadProducts = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await getProducts(activeBusiness._id, search ? { q: search } : undefined);
      setProducts(res.data);
    } catch (err) {
      console.error('Mahsulotlarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, search]);

  useEffect(() => {
    const timeout = setTimeout(loadProducts, 300);
    return () => clearTimeout(timeout);
  }, [loadProducts]);

  const handleDelete = async (product) => {
    if (!confirm(`"${product.name}" o'chirilsinmi?`)) return;
    try {
      await deleteProduct(activeBusiness._id, product._id);
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="pt-wrapper">
      <div className="pt-toolbar">
        <div className="pt-search">
          <Search size={16} />
          <input
            placeholder="Mahsulot qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <RoleGate roles={['admin', 'warehouse_worker']}>
            <button className="pt-btn-primary" onClick={() => setModalState('new')}>
              <Plus size={16} /> Yangi mahsulot
            </button>
          </RoleGate>

          {/* ===== RASM ORQALI QO'SHISH TUGMASI ===== */}
          <RoleGate roles={['admin', 'warehouse_worker']}>
            <button className="pt-btn-secondary" onClick={() => setShowImageRecognize(true)}>
              <Camera size={16} /> Rasm orqali qo'shish
            </button>
          </RoleGate>
        </div>
      </div>

      {loading ? (
        <div className="pt-empty">Yuklanmoqda...</div>
      ) : products.length === 0 ? (
        <div className="pt-empty">
          {search ? 'Hech narsa topilmadi' : 'Hali mahsulot qo\'shilmagan'}
        </div>
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Shtrix-kod</th>
                <th>Birlik</th>
                <th>Tannarx</th>
                <th>Sotuv narxi</th>
                <th>Min. qoldiq</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td className="pt-muted">
                    {p.barcode ? <span className="pt-barcode"><Barcode size={12} /> {p.barcode}</span> : '—'}
                  </td>
                  <td>{p.unit}</td>
                  <td className="pt-muted">{p.costPrice?.toLocaleString() || 0}</td>
                  <td>{p.sellPrice?.toLocaleString()}</td>
                  <td className="pt-profit">
                    {((p.sellPrice || 0) - (p.costPrice || 0)).toLocaleString()}
                  </td>
                  <td>
                    {p.minStockThreshold > 0 ? (
                      <span className="pt-threshold"><AlertTriangle size={12} /> {p.minStockThreshold}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <RoleGate roles={['admin', 'warehouse_worker']}>
                      <div className="pt-row-actions">
                        <button onClick={() => setModalState(p)} className="pt-icon-btn"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(p)} className="pt-icon-btn pt-icon-danger"><Trash2 size={14} /></button>
                      </div>
                    </RoleGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mahsulot yaratish/tahrirlash modal */}
      {modalState && (
        <ProductFormModal
          initial={modalState === 'new' ? null : modalState}
          businessId={activeBusiness._id}
          onClose={() => setModalState(null)}
          onSaved={() => { setModalState(null); loadProducts(); }}
        />
      )}

      {/* Rasm orqali tanib olish modal */}
      {showImageRecognize && (
        <ImageRecognizeModal
          businessId={activeBusiness._id}
          onClose={() => setShowImageRecognize(false)}
          onCreated={(newProducts) => {
            // Yangi mahsulotlar yaratilgandan so‘ng ro‘yxatni yangilaymiz
            loadProducts();
          }}
        />
      )}
    </div>
  );
}