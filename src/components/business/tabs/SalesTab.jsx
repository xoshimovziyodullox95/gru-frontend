import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2, LayoutGrid, History } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getProducts, getStock, createSale, getCustomers, createCustomer } from '../../services/business';
import SalesHistoryView from './SalesHistoryView';
import '../../../styles/productsTab.css';
import '../../../styles/salesTab.css';

function POSView() {
  const { activeBusiness, activeWarehouse } = useBusiness();
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('cash');
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successSale, setSuccessSale] = useState(null);

  const loadData = useCallback(async () => {
    if (!activeBusiness || !activeWarehouse) return;
    try {
      const [prodRes, stockRes] = await Promise.all([
        getProducts(activeBusiness._id),
        getStock(activeBusiness._id, activeWarehouse._id),
      ]);
      setProducts(prodRes.data);
      const map = {};
      stockRes.data.forEach((s) => { if (s.productId) map[s.productId._id] = s.quantity; });
      setStockMap(map);
    } catch (err) {
      console.error('Yuklashda xatolik:', err);
    }
  }, [activeBusiness, activeWarehouse]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!activeBusiness) return;
    getCustomers(activeBusiness._id).then((res) => setCustomers(res.data)).catch(() => {});
  }, [activeBusiness]);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const addToCart = (product) => {
    const available = stockMap[product._id] || 0;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        if (existing.quantity >= available) return prev;
        return prev.map((i) => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (available <= 0) return prev;
      return [...prev, { productId: product._id, name: product.name, unit: product.unit, sellPrice: product.sellPrice, quantity: 1 }];
    });
  };

  const changeQty = (productId, delta) => {
    setCart((prev) => prev
      .map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter((i) => i.quantity > 0));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  const total = cart.reduce((sum, i) => sum + i.sellPrice * i.quantity, 0);

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;
    const res = await createCustomer(activeBusiness._id, { name: newCustomerName.trim() });
    setCustomers([...customers, res.data]);
    setCustomerId(res.data._id);
    setShowNewCustomer(false);
    setNewCustomerName('');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'credit' && !customerId) {
      setError('Nasiya uchun mijoz tanlang');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        warehouseId: activeWarehouse._id,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentType,
        customerId: paymentType === 'credit' ? customerId : undefined,
        paidAmount: paymentType === 'credit' ? (Number(paidAmount) || 0) : undefined,
      };
      const res = await createSale(activeBusiness._id, payload);
      setSuccessSale(res.data);
      setCart([]);
      setCustomerId('');
      setPaidAmount('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeWarehouse) return <div className="pt-empty">Ombor tanlanmagan</div>;

  return (
    <div className="pos-layout">
      <div className="pos-products">
        <div className="pt-search" style={{ maxWidth: '100%', marginBottom: 12 }}>
          <Search size={16} />
          <input placeholder="Mahsulot qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="pos-product-grid">
          {filteredProducts.map((p) => {
            const available = stockMap[p._id] || 0;
            return (
              <button
                key={p._id}
                className="pos-product-card"
                disabled={available <= 0}
                onClick={() => addToCart(p)}
              >
                <span className="pos-product-name">{p.name}</span>
                <span className="pos-product-price">{p.sellPrice?.toLocaleString()} so'm</span>
                <span className={`pos-product-stock ${available <= 0 ? 'pos-out' : ''}`}>
                  {available > 0 ? `${available} ${p.unit}` : 'Tugagan'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pos-cart">
        <h3><ShoppingCart size={16} /> Savat</h3>

        {cart.length === 0 ? (
          <div className="pt-empty" style={{ padding: '2rem 0' }}>Savat bo'sh</div>
        ) : (
          <div className="pos-cart-items">
            {cart.map((item) => (
              <div key={item.productId} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <span>{item.name}</span>
                  <span className="pt-muted">{item.sellPrice.toLocaleString()} × {item.quantity}</span>
                </div>
                <div className="pos-cart-item-actions">
                  <button onClick={() => changeQty(item.productId, -1)}><Minus size={12} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => changeQty(item.productId, 1)}><Plus size={12} /></button>
                  <button onClick={() => removeFromCart(item.productId)} className="pt-icon-danger"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pos-total">
          <span>Jami:</span>
          <strong>{total.toLocaleString()} so'm</strong>
        </div>

        <div className="pos-payment-types">
          {['cash', 'card', 'credit'].map((t) => (
            <button
              key={t}
              className={paymentType === t ? 'pt-btn-primary' : 'pt-btn-secondary'}
              onClick={() => setPaymentType(t)}
              style={{ flex: 1, fontSize: '0.8rem' }}
            >
              {t === 'cash' ? 'Naqd' : t === 'card' ? 'Karta' : 'Nasiya'}
            </button>
          ))}
        </div>

        {paymentType === 'credit' && (
          <div className="pos-credit-fields">
            {showNewCustomer ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Mijoz ismi" style={{ flex: 1 }} />
                <button className="pt-btn-primary" onClick={handleCreateCustomer} type="button">+</button>
              </div>
            ) : (
              <select value={customerId} onChange={(e) => e.target.value === '__new__' ? setShowNewCustomer(true) : setCustomerId(e.target.value)}>
                <option value="">Mijozni tanlang</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                <option value="__new__">+ Yangi mijoz</option>
              </select>
            )}
            <input
              type="number" min="0" placeholder="Hozir to'langan summa (0 bo'lishi mumkin)"
              value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
            />
          </div>
        )}

        {error && <div className="pt-error">{error}</div>}

        <button
          className="pt-btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 10, padding: '12px' }}
          disabled={cart.length === 0 || submitting}
          onClick={handleCheckout}
        >
          {submitting ? 'Yuborilmoqda...' : `Sotish — ${total.toLocaleString()} so'm`}
        </button>
      </div>

      {successSale && (
        <div className="pt-modal-overlay" onClick={() => setSuccessSale(null)}>
          <div className="pt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center' }}>
            <CheckCircle2 size={40} style={{ color: '#00c864', margin: '0 auto 12px' }} />
            <h3>Sotuv muvaffaqiyatli!</h3>
            <p className="pt-muted">Jami: {successSale.total?.toLocaleString()} so'm</p>
            <button className="pt-btn-primary" style={{ marginTop: 12 }} onClick={() => setSuccessSale(null)}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesTab() {
  const [section, setSection] = useState('pos');

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setSection('pos')}
          className={section === 'pos' ? 'pt-btn-primary' : 'pt-btn-secondary'}
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
        >
          <LayoutGrid size={14} /> Kassa
        </button>
        <button
          onClick={() => setSection('history')}
          className={section === 'history' ? 'pt-btn-primary' : 'pt-btn-secondary'}
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
        >
          <History size={14} /> Tarix
        </button>
      </div>

      {section === 'pos' ? <POSView /> : <SalesHistoryView />}
    </div>
  );
}