import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, Settings2, X, ScanLine, Camera } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import RoleGate from '../../shared/RoleGate';
import { getStock, adjustStock, getProductByBarcode } from '../../../services/business';
import BarcodeScannerModal from '../../../common/Barcodescannermodal.jsx';

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
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" autoFocus />
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

  // 🔥 SKANER UCHUN
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const barcodeInputRef = useRef(null);

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

  useEffect(() => {
    setTimeout(() => barcodeInputRef.current?.focus(), 200);
  }, [activeWarehouse]);

  // 🔥 Shtrix-kod bo'yicha mahsulotni topib, tuzatish oynasini ochish
  const processBarcode = async (code) => {
    if (!code || !code.trim()) return;
    setScanStatus('Qidirilmoqda...');
    try {
      const res = await getProductByBarcode(activeBusiness._id, code.trim());
      const product = res.data;

      // Shu omborda ushbu mahsulotning qoldig'ini topamiz
      const stockItem = stock.find(s => s.productId?._id === product._id);
      if (stockItem) {
        setAdjustTarget(stockItem);
        setScanStatus(`✅ Topildi: ${product.name}`);
      } else {
        // Bu omborda hali qoldiq yo'q — 0 qoldiqli "virtual" obyekt bilan ochamiz
        setAdjustTarget({
          _id: `virtual-${product._id}`,
          productId: product,
          quantity: 0,
        });
        setScanStatus(`⚠ "${product.name}" — bu omborda hali qoldiq yo'q (0)`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setScanStatus('❌ Bu shtrix-kod bo\'yicha mahsulot topilmadi. Avval "Mahsulotlar" bo\'limida qo\'shing.');
      } else {
        setScanStatus('❌ Xatolik: ' + (err.response?.data?.error || err.message));
      }
    }
    setBarcodeInput('');
    setTimeout(() => setScanStatus(''), 4000);
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcode(barcodeInput);
    }
  };

  if (!activeWarehouse) return <div className="pt-empty">Ombor tanlanmagan</div>;

  return (
    <>
      {/* 🔥 SKANER PANELI */}
      <div className="pt-field pt-field-full" style={{ marginBottom: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ScanLine size={15} /> Mahsulotni skanerlab tezkor tuzatish
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            placeholder="Kursor shu yerda turganda, skanerni tovar ustiga tuting..."
            style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem' }}
            autoComplete="off"
          />
          <button type="button" className="pt-btn-secondary" onClick={() => setShowScanner(true)}>
            <Camera size={16} /> Kamera bilan
          </button>
        </div>
        {scanStatus && (
          <span style={{ fontSize: '0.8rem', color: scanStatus.startsWith('❌') ? '#ff5c5c' : scanStatus.startsWith('⚠') ? '#ffaa00' : '#4ade80', marginTop: 4, display: 'block' }}>
            {scanStatus}
          </span>
        )}
      </div>

      {loading ? (
        <div className="pt-empty">Yuklanmoqda...</div>
      ) : stock.length === 0 ? (
        <div className="pt-empty">Bu omborda hali mahsulot yo'q. Avval "Kirim" orqali tovar qabul qiling.</div>
      ) : (
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
      )}

      {adjustTarget && (
        <AdjustModal
          product={adjustTarget}
          businessId={activeBusiness._id}
          warehouseId={activeWarehouse._id}
          onClose={() => setAdjustTarget(null)}
          onSaved={() => { setAdjustTarget(null); load(); }}
        />
      )}

      {showScanner && (
        <BarcodeScannerModal
          onScan={(code) => { setShowScanner(false); processBarcode(code); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}