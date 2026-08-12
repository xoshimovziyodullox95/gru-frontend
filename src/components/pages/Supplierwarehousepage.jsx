// src/components/pages/SupplierWarehousePage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Package, Edit2, X, Check, Building2, ScanLine } from 'lucide-react';
import api from '../services/api';
import '../../styles/warehouse.css';
import BarcodeScannerModal from '../common/Barcodescannermodal.jsx';

const UNIT_OPTIONS = [
  { value: 'blok', label: 'Blok' },
  { value: 'kg', label: 'Kilogramm' },
  { value: 'dona', label: 'Dona' },
  { value: 'litr', label: 'Litr' },
  { value: 'karobka', label: 'Karobka' },
  { value: 'quti', label: 'Quti' },
];

export default function SupplierWarehousePage() {
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [editingName, setEditingName] = useState(false);

  // ---------- SKANER STATE ----------
  const [showScanner, setShowScanner] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [form, setForm] = useState({
    productName: '', unit: 'dona', quantity: '', expiryMonths: '', minStockAlert: '',
  });

  useEffect(() => {
    loadWarehouse();
  }, []);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouse');
      setWarehouse(res.data);
      setCompanyName(res.data.companyName || '');
    } catch (err) {
      console.error('Sklad yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyName = async () => {
    try {
      const res = await api.put('/warehouse/company-name', { companyName });
      setWarehouse(res.data);
      setEditingName(false);
    } catch (err) {
      alert('Nomni saqlashda xatolik');
    }
  };

  const resetForm = () => {
    setForm({ productName: '', unit: 'dona', quantity: '', expiryMonths: '', minStockAlert: '' });
    setShowAddForm(false);
    setEditingItemId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productName || !form.quantity) {
      alert('Mahsulot nomi va miqdorini kiriting');
      return;
    }
    try {
      if (editingItemId) {
        const res = await api.put(`/warehouse/items/${editingItemId}`, form);
        setWarehouse(res.data);
      } else {
        const res = await api.post('/warehouse/items', form);
        setWarehouse(res.data);
      }
      resetForm();
    } catch (err) {
      alert('Saqlashda xatolik: ' + (err.response?.data?.error || err.message));
    }
  };

  const startEdit = (item) => {
    setForm({
      productName: item.productName,
      unit: item.unit,
      quantity: item.quantity,
      expiryMonths: item.expiryMonths || '',
      minStockAlert: item.minStockAlert || '',
    });
    setEditingItemId(item._id);
    setShowAddForm(true);
  };

  const deleteItem = async (itemId) => {
    if (!confirm("Bu mahsulotni o'chirishga ishonchingiz komilmi?")) return;
    try {
      const res = await api.delete(`/warehouse/items/${itemId}`);
      setWarehouse(res.data);
    } catch (err) {
      alert("O'chirishda xatolik");
    }
  };

  // ---------- BARCODE SKANER NATIJASINI QAYTA ISHLASH ----------
  const handleBarcodeScan = async (code) => {
    setShowScanner(false);
    try {
      const checkRes = await api.get(`/warehouse/barcode/${code}`);
      if (checkRes.data.found) {
        // Mahsulot allaqachon bor — miqdor qo'shish
        const addQty = prompt(`"${checkRes.data.item.productName}" topildi. Qancha qo'shamiz?`);
        if (addQty && Number(addQty) > 0) {
          await api.post('/warehouse/barcode', { barcode: code, quantity: addQty });
          loadWarehouse();
        }
      } else {
        // Yangi mahsulot — nom va miqdor so'raymiz
        const name = prompt("Yangi mahsulot. Nomini kiriting:");
        if (!name) return;
        const qty = prompt("Miqdorini kiriting:");
        if (!qty) return;
        await api.post('/warehouse/barcode', { barcode: code, productName: name, quantity: qty, unit: 'dona' });
        loadWarehouse();
      }
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="StatusScreen">Yuklanmoqda...</div>;

  const items = warehouse?.items || [];

  return (
    <div className="wh-page">
      <button className="BackActionBtn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Orqaga
      </button>

      <div className="wh-header">
        <h1><Package size={22} /> Mening Skladim</h1>
        <div className="wh-company-name">
          {editingName ? (
            <div className="wh-name-edit">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Kompaniya nomi"
                autoFocus
              />
              <button onClick={saveCompanyName}><Check size={16} /></button>
              <button onClick={() => setEditingName(false)}><X size={16} /></button>
            </div>
          ) : (
            <button className="wh-name-display" onClick={() => setEditingName(true)}>
              <Building2 size={16} />
              {companyName || 'Kompaniya nomini kiriting'}
              <Edit2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* TUGMALAR BLOKI — “Yangi mahsulot” va “Skaner” yonma-yon */}
      <div className="wh-actions-row">
        <button className="wh-add-btn" onClick={() => { resetForm(); setShowAddForm(true); }}>
          <Plus size={18} /> Yangi mahsulot qo'shish
        </button>
        <button className="wh-add-btn wh-scan-btn" onClick={() => setShowScanner(true)}>
          <ScanLine size={18} /> Shtrix-kodni skanerlash
        </button>
      </div>

      {showAddForm && (
        <form className="wh-form" onSubmit={handleSubmit}>
          <h3>{editingItemId ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h3>
          <div className="wh-form-row">
            <input
              type="text"
              placeholder="Mahsulot nomi (masalan: Sayxun suv 0.5)"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              required
            />
          </div>
          <div className="wh-form-row">
            <input
              type="number"
              placeholder="Miqdor"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <div className="wh-form-row">
            <input
              type="number"
              placeholder="Yaroqlilik muddati (oy, ixtiyoriy)"
              value={form.expiryMonths}
              onChange={(e) => setForm({ ...form, expiryMonths: e.target.value })}
            />
            <input
              type="number"
              placeholder="Minimal zaxira (ogohlantirish uchun)"
              value={form.minStockAlert}
              onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })}
            />
          </div>
          <div className="wh-form-actions">
            <button type="submit" className="wh-save-btn">Saqlash</button>
            <button type="button" className="wh-cancel-btn" onClick={resetForm}>Bekor qilish</button>
          </div>
        </form>
      )}

      <div className="wh-items-list">
        {items.length === 0 ? (
          <div className="wh-empty">Sklad hozircha bo'sh. Birinchi mahsulotni qo'shing.</div>
        ) : (
          items.map((item) => {
            const lowStock = item.minStockAlert > 0 && item.quantity <= item.minStockAlert;
            return (
              <div key={item._id} className={`wh-item-card ${lowStock ? 'wh-low-stock' : ''}`}>
                <div className="wh-item-main">
                  <span className="wh-item-name">{item.productName}</span>
                  <span className="wh-item-qty">{item.quantity.toLocaleString()} {item.unit}</span>
                </div>
                <div className="wh-item-meta">
                  {item.expiryMonths && <span>Yaroqlilik: {item.expiryMonths} oy</span>}
                  {lowStock && <span className="wh-alert-badge">⚠ Zaxira kam qoldi</span>}
                </div>
                <div className="wh-item-actions">
                  <button onClick={() => startEdit(item)}><Edit2 size={15} /></button>
                  <button onClick={() => deleteItem(item._id)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SKANER MODALI */}
      {showScanner && (
        <BarcodeScannerModal onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}