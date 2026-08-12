import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Check, CreditCard, ScanLine, Search } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import RoleGate from '../../shared/RoleGate';
import {
  getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder, payPurchaseOrder,
  getSuppliers, createSupplier, getProducts, createProduct, getProductByBarcode,
} from '../../../services/business';

// ============================================================
// YANGI CreatePOModal – FIZIK SKANER (USB/Bluetooth) + qidiruv bilan
// Fizik skaner klaviatura kabi ishlaydi: kodni tez "yozadi" va
// oxirida Enter bosadi. Shuning uchun bu input maxsus shu holatni
// aniqlaydi — foydalanuvchi hech qanday tugma bosishi shart emas,
// faqat inputga fokus qo'yib, skanerni tovar ustiga tutish kifoya.
// ============================================================
function CreatePOModal({ onClose, onSaved, businessId, warehouseId }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([{ productId: '', productName: '', quantity: 1, unitCost: '' }]);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // 🔥 FIZIK SKANER UCHUN
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanStatus, setScanStatus] = useState(''); // "Qidirilmoqda...", "Topildi: X", "Topilmadi"
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    getSuppliers(businessId).then((res) => setSuppliers(res.data)).catch(() => {});
    getProducts(businessId).then((res) => {
      setProducts(res.data);
      setFilteredProducts(res.data);
    }).catch(() => {});
    // Modal ochilganda, skaner inputiga avtomatik fokus
    setTimeout(() => barcodeInputRef.current?.focus(), 200);
  }, [businessId]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(lower)));
  }, [searchTerm, products]);

  const addRow = () => setItems([...items, { productId: '', productName: '', quantity: 1, unitCost: '' }]);
  const removeRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateRow = (idx, field, value) => {
    const copy = [...items];
    copy[idx][field] = value;
    if (field === 'productId') {
      const prod = products.find(p => p._id === value);
      copy[idx].productName = prod ? prod.name : '';
    }
    setItems(copy);
  };

  // 🔥 Shtrix-kodni qayta ishlash — TO'G'RILANGAN (api import xatosi va endpoint tuzatildi)
  const processBarcode = async (code) => {
    if (!code || !code.trim()) return;
    setScanStatus('Qidirilmoqda...');
    try {
      const res = await getProductByBarcode(businessId, code.trim());
      const product = res.data;

      setItems(prev => {
        const existing = prev.find(i => i.productId === product._id);
        if (existing) {
          return prev.map(i => i.productId === product._id ? { ...i, quantity: Number(i.quantity) + 1 } : i);
        }
        // Bo'sh birinchi qatorni to'ldiramiz, aks holda yangi qator qo'shamiz
        const emptyIdx = prev.findIndex(i => !i.productId);
        if (emptyIdx !== -1) {
          const copy = [...prev];
          copy[emptyIdx] = { productId: product._id, productName: product.name, quantity: 1, unitCost: product.costPrice || '' };
          return copy;
        }
        return [...prev, { productId: product._id, productName: product.name, quantity: 1, unitCost: product.costPrice || '' }];
      });
      setScanStatus(`✅ Qo'shildi: ${product.name}`);
    } catch (err) {
      if (err.response?.status === 404) {
        // Yangi mahsulot — nom va narx so'raymiz
        const name = prompt("Bu shtrix-kod bo'yicha mahsulot topilmadi. Yangi mahsulot nomini kiriting:");
        if (!name) { setScanStatus(''); return; }
        const sellPrice = prompt("Sotuv narxini kiriting:");
        if (!sellPrice) { setScanStatus(''); return; }
        try {
          const newProdRes = await createProduct(businessId, {
            name, barcode: code.trim(), sellPrice: Number(sellPrice), unit: 'dona',
          });
          setProducts(prev => [...prev, newProdRes.data]);
          setItems(prev => {
            const emptyIdx = prev.findIndex(i => !i.productId);
            if (emptyIdx !== -1) {
              const copy = [...prev];
              copy[emptyIdx] = { productId: newProdRes.data._id, productName: newProdRes.data.name, quantity: 1, unitCost: '' };
              return copy;
            }
            return [...prev, { productId: newProdRes.data._id, productName: newProdRes.data.name, quantity: 1, unitCost: '' }];
          });
          setScanStatus(`✅ Yangi mahsulot yaratildi: ${name}`);
        } catch (createErr) {
          setScanStatus('❌ Xatolik: ' + (createErr.response?.data?.error || createErr.message));
        }
      } else {
        setScanStatus('❌ Xatolik: ' + (err.response?.data?.error || err.message));
      }
    }
    setBarcodeInput('');
    setTimeout(() => setScanStatus(''), 3000);
  };

  // 🔥 FIZIK SKANER: Enter bosilganda (skaner avtomatik yuboradi)
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcode(barcodeInput);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    const res = await createSupplier(businessId, { name: newSupplierName.trim() });
    setSuppliers([...suppliers, res.data]);
    setSupplierId(res.data._id);
    setShowNewSupplier(false);
    setNewSupplierName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.productId && i.quantity && i.unitCost);
    if (!supplierId || validItems.length === 0) {
      setError('Yetkazib beruvchi va kamida bitta to\'liq qator kerak (narxini ham kiriting)');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createPurchaseOrder(businessId, {
        warehouseId,
        supplierId,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        })),
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
      <form className="pt-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{ maxWidth: 700 }}>
        <div className="pt-modal-header">
          <h3>Yangi tovar qabuli</h3>
          <button type="button" className="pt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Yetkazib beruvchi */}
        <label className="pt-field pt-field-full" style={{ marginBottom: 10 }}>
          <span>Yetkazib beruvchi</span>
          {showNewSupplier ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Nomi" style={{ flex: 1 }} />
              <button type="button" className="pt-btn-primary" onClick={handleCreateSupplier}>Qo'shish</button>
              <button type="button" className="pt-btn-secondary" onClick={() => setShowNewSupplier(false)}>Bekor</button>
            </div>
          ) : (
            <select value={supplierId} onChange={(e) => e.target.value === '__new__' ? setShowNewSupplier(true) : setSupplierId(e.target.value)}>
              <option value="">Tanlang</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              <option value="__new__">+ Yangi yetkazib beruvchi</option>
            </select>
          )}
        </label>

        {/* 🔥 FIZIK SKANER INPUTI — asosiy usul */}
        <div className="pt-field pt-field-full" style={{ marginBottom: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ScanLine size={15} /> Shtrix-kod skaneri (USB/Bluetooth)
          </span>
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            placeholder="Bu yerga kursor turgan holda, skanerni tovar ustiga tuting..."
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '1rem' }}
            autoComplete="off"
          />
          {scanStatus && (
            <span style={{ fontSize: '0.8rem', color: scanStatus.startsWith('❌') ? '#ff5c5c' : '#4ade80', marginTop: 4, display: 'block' }}>
              {scanStatus}
            </span>
          )}
        </div>

        {/* Mahsulot qidirish (qo'lda tanlash uchun, agar skaner bo'lmasa) */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Yoki mahsulotni qo'lda qidiring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 30, width: '100%' }}
          />
        </div>

        {/* Qatorlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select
                value={item.productId}
                onChange={(e) => updateRow(idx, 'productId', e.target.value)}
                style={{ flex: 2 }}
              >
                <option value="">Mahsulot tanlang</option>
                {filteredProducts.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Miqdor"
                value={item.quantity}
                onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min="0"
                placeholder="Narxi"
                value={item.unitCost}
                onChange={(e) => updateRow(idx, 'unitCost', e.target.value)}
                style={{ flex: 1 }}
              />
              {items.length > 1 && (
                <button type="button" className="pt-icon-btn pt-icon-danger" onClick={() => removeRow(idx)}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="pt-btn-secondary" onClick={addRow} style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> Qator qo'shish
          </button>
        </div>

        {error && <div className="pt-error">{error}</div>}

        <div className="pt-modal-actions">
          <button type="button" onClick={onClose} className="pt-btn-secondary">Bekor qilish</button>
          <button type="submit" disabled={saving} className="pt-btn-primary">
            {saving ? 'Yaratilmoqda...' : 'Hujjat yaratish'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// ASOSIY VIEW – o'zgarmadi
// ============================================================
export default function PurchaseOrdersView() {
  const { activeBusiness, activeWarehouse } = useBusiness();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await getPurchaseOrders(activeBusiness._id);
      setOrders(res.data);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => { load(); }, [load]);

  const handleReceive = async (po) => {
    if (!confirm('Tovar qabul qilinganini tasdiqlaysizmi? Ombor qoldig\'i oshadi.')) return;
    try {
      await receivePurchaseOrder(activeBusiness._id, po._id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  const handlePay = async (po) => {
    const amount = prompt('To\'lov summasi:');
    if (!amount || Number(amount) <= 0) return;
    try {
      await payPurchaseOrder(activeBusiness._id, po._id, Number(amount));
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  return (
    <>
      <div className="pt-toolbar">
        <span className="pt-muted">Jami: {orders.length} ta hujjat</span>
        <RoleGate roles={['admin', 'warehouse_worker']}>
          <button className="pt-btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Yangi kirim</button>
        </RoleGate>
      </div>

      {loading ? (
        <div className="pt-empty">Yuklanmoqda...</div>
      ) : orders.length === 0 ? (
        <div className="pt-empty">Hali tovar qabuli hujjatlari yo'q</div>
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr><th>Yetkazib beruvchi</th><th>Summa</th><th>To'langan</th><th>Holati</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po._id}>
                  <td>{po.supplierId?.name || '—'}</td>
                  <td>{po.totalCost?.toLocaleString()}</td>
                  <td className="pt-muted">{po.paidAmount?.toLocaleString()}</td>
                  <td>{po.status === 'pending' ? 'Kutilmoqda' : po.status === 'received' ? 'Qabul qilindi' : 'Bekor qilingan'}</td>
                  <td>
                    <RoleGate roles={['admin', 'warehouse_worker']}>
                      <div className="pt-row-actions">
                        {po.status === 'pending' && (
                          <button className="pt-icon-btn" onClick={() => handleReceive(po)} title="Qabul qilish"><Check size={14} /></button>
                        )}
                        {po.paidAmount < po.totalCost && (
                          <button className="pt-icon-btn" onClick={() => handlePay(po)} title="To'lov"><CreditCard size={14} /></button>
                        )}
                      </div>
                    </RoleGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreatePOModal
          businessId={activeBusiness._id}
          warehouseId={activeWarehouse?._id}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load(); }}
        />
      )}
    </>
  );
}