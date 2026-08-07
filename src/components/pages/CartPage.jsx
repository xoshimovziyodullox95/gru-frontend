import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import api from '../services/api';
import '../../styles/cart.css';

export default function CartPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cart, increment, decrement, removeItem, clearCart, totalItems, totalPrice } = useCart();

  const handleCheckout = async () => {
    if (!user) {
      alert(t('cartPage.loginRequired'));
      navigate('/login');
      return;
    }

    const payload = {
      items: cart.map(item => ({
        itemId: item.id,
        itemType: item.itemType,
        title: item.title,
        price: item.price,
        quantity: item.quantity
      }))
    };

    try {
      const res = await api.post('/orders', payload);
      console.log('ORDER RESPONSE:', res.data);
      alert(t('cartPage.orderSuccess'));
      clearCart();
    } catch (err) {
      console.error('ORDER ERROR:', err.response?.data || err.message);
      alert(t('cartPage.orderError'));
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty-page">
        <ShoppingBag size={64} className="empty-icon" />
        <h2>{t('cartPage.emptyTitle')}</h2>
        <p>{t('cartPage.emptyDesc')}</p>
        <Link to="/" className="cart-empty-back">{t('cartPage.backToShop')}</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <Link to="/" className="cart-back-btn"><ArrowLeft size={20} /> {t('cartPage.backBtn')}</Link>
          <h1>{t('cartPage.title')} ({totalItems})</h1>
          <button onClick={clearCart} className="cart-clear-btn">{t('cartPage.clearAll')}</button>
        </div>

        <div className="cart-grid">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image || '/images/placeholder.jpg'} alt={item.title} className="cart-item-img" />
                <div className="cart-item-info">
                  <h3>{item.title}</h3>
                  {item.itemType === 'bank_service' ? (
                    <p className="cart-item-price cart-item-application-tag">
                      {t('cartPage.application', 'Ariza')} — {item.provider}
                    </p>
                  ) : (
                    <p className="cart-item-price">{item.price} {t('cartPage.currency')}</p>
                  )}
                </div>
                <div className="cart-item-actions">
                  {item.itemType === 'bank_service' ? (
                    <button onClick={() => removeItem(item.id)} className="remove-btn"><Trash2 size={16} /></button>
                  ) : (
                    <>
                      <button onClick={() => decrement(item)}><Minus size={16} /></button>
                      <span className="qty">{item.quantity}</span>
                      <button onClick={() => increment(item)}><Plus size={16} /></button>
                      <button onClick={() => removeItem(item.id)} className="remove-btn"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>{t('cartPage.summaryTitle')}</h3>
            <div className="summary-row">
              <span>{t('cartPage.itemsCount')}</span>
              <span>{totalItems} {t('cartPage.itemsLabel')}</span>
            </div>
            <div className="summary-row total">
              <span>{t('cartPage.totalAmount')}</span>
              <span>{totalPrice.toLocaleString()} {t('cartPage.currency')}</span>
            </div>
            <button onClick={handleCheckout} className="checkout-btn">{t('cartPage.checkoutBtn')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}