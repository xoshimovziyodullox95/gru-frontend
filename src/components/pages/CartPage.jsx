// src/components/pages/CartPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import LocationMapPicker from '../forms/LocationMapPicker';
import OrderWaitingModal from '../common/OrderWaitingModal';
import SuccessModal from '../common/SuccessModal';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  MapPin,
  X,
} from 'lucide-react';
import '../../styles/cart.css';

export default function CartPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : '/marketplace';
  const {
    cart,
    increment,
    decrement,
    removeItem,
    clearCart,
    totalItems,
    totalsByCurrency,
  } = useCart();

  // State
  const [waitingOrderId, setWaitingOrderId] = useState(null);
  // Checkout natijasi: savat tozalangandan keyin ham modal to'g'ri matnni ko'rsatsin
  const [submitted, setSubmitted] = useState(null); // { orderCount, hadPhysical, hadBank }
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [bankSuccess, setBankSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Savat tahlili
  const hasPhysicalItems = cart.some(
    (item) => item.itemType !== 'bank_service'
  );
  const hasBankItems = cart.some((item) => item.itemType === 'bank_service');

  // Tugma matnini aniqlash
  let buttonText = t('cartPage.checkoutBtn', 'Buyurtma berish');
  if (hasBankItems && !hasPhysicalItems) {
    buttonText = t('cartPage.submitApplication', 'Ariza yuborish');
  } else if (hasBankItems && hasPhysicalItems) {
    buttonText = t(
      'cartPage.submitOrderAndApplication',
      'Buyurtma va ariza yuborish'
    );
  }

  // === CHECKOUT – xarita yoki to‘g‘ridan-to‘g‘ri yuborish ===
  const handleCheckout = () => {
    if (!user) {
      alert(t('cartPage.loginRequired'));
      navigate('/login');
      return;
    }
    if (hasPhysicalItems) {
      setShowMapPicker(true);
    } else {
      confirmOrderWithLocation();
    }
  };

  // === ASOSIY YUBORISH (buyurtma / ariza) ===
  const confirmOrderWithLocation = async () => {
    if (hasPhysicalItems && !selectedLocation) {
      alert(
        t(
          'cartPage.locationRequired',
          'Iltimos, xaritadan yetkazib berish manzilini tanlang'
        )
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      items: cart.map((item) => ({
        itemId: item.id,
        itemType: item.itemType,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        ...(item.provider && { provider: item.provider }),
        ...(item.currency && { currency: item.currency }),
      })),
      buyerLocation: hasPhysicalItems ? selectedLocation : null,
    };

    try {
      const res = await api.post('/orders', payload);

      const orderCount = res.data.orders?.length || 0;
      setSubmitted({ orderCount, hadPhysical: hasPhysicalItems, hadBank: hasBankItems });
      setShowMapPicker(false);

      if (hasPhysicalItems) {
        setWaitingOrderId(res.data.orders?.[0]?._id || res.data.orderId);
      } else if (hasBankItems) {
        setBankSuccess(true);
      }

      // Buyurtma serverda yaratildi — qayta yuborilmasligi uchun savatni tozalaymiz
      clearCart();
    } catch (err) {
      console.error('Order error:', err.response?.data || err.message);
      alert(err.response?.data?.error || t('cartPage.orderError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // === BO‘SH SAVAT === (checkout oynasi ochiq bo'lsa, uni ko'rsatamiz)
  if (cart.length === 0 && !waitingOrderId && !bankSuccess) {
    return (
      <div className="cart-empty-page">
        <ShoppingBag size={64} className="empty-icon" />
        <h2>{t('cartPage.emptyTitle')}</h2>
        <p>{t('cartPage.emptyDesc')}</p>
        <Link to={returnTo} className="cart-empty-back">
          {t('cartPage.backToShop')}
        </Link>
      </div>
    );
  }

  // === ASOSIY RENDER ===
  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <Link to={returnTo} className="cart-back-btn">
            <ArrowLeft size={20} /> {t('cartPage.backBtn')}
          </Link>
          <h1>
            {t('cartPage.title')} ({totalItems})
          </h1>
          <button onClick={clearCart} className="cart-clear-btn">
            {t('cartPage.clearAll')}
          </button>
        </div>

        <div className="cart-grid">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img
                  src={item.image || '/images/zumo-placeholder.svg'}
                  alt={item.title}
                  className="cart-item-img"
                />
                <div className="cart-item-info">
                  <h3>{item.title}</h3>
                  {item.itemType === 'bank_service' ? (
                    <p className="cart-item-price cart-item-application-tag">
                      {t('cartPage.application', 'Ariza')} — {item.provider}
                    </p>
                  ) : (
                    <p className="cart-item-price">
                      {formatPrice(item.price, item.currency)}
                    </p>
                  )}
                </div>
                <div className="cart-item-actions">
                  {item.itemType === 'bank_service' ? (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="remove-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => decrement(item)}>
                        <Minus size={16} />
                      </button>
                      <span className="qty">{item.quantity}</span>
                      <button onClick={() => increment(item)}>
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="remove-btn"
                      >
                        <Trash2 size={16} />
                      </button>
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
              <span>
                {totalItems} {t('cartPage.itemsLabel')}
              </span>
            </div>
            <div className="summary-row total">
              <span>{t('cartPage.totalAmount')}</span>
              <span>
                {Object.entries(totalsByCurrency).map(([cur, sum]) => formatPrice(sum, cur)).join(' + ') || '0'}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="checkout-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('cartPage.submitting', 'Yuborilmoqda...')
                : buttonText}
            </button>
          </div>
        </div>
      </div>

      {/* OrderWaitingModal – bank yoki fizik uchun mos orderType bilan */}
      {waitingOrderId && (
        <OrderWaitingModal
          orderId={waitingOrderId}
          orderCount={submitted?.orderCount || 1}
          onClose={() => {
            setWaitingOrderId(null);
            // Tovar bilan birga bank arizasi ham bo'lsa, endi uni tasdiqlaymiz
            if (submitted?.hadBank) setBankSuccess(true);
          }}
        />
      )}

      {/* SuccessModal – bank arizasi uchun */}
      {bankSuccess && (
        <SuccessModal
          message={
            submitted?.hadPhysical && submitted?.hadBank
              ? t(
                  'cartPage.bothSuccess',
                  'Buyurtma va ariza muvaffaqiyatli yuborildi! Bank xodimi tez orada siz bilan bog‘lanadi.'
                )
              : t(
                  'cartPage.bankSuccess',
                  'Arizangiz bank xodimiga yuborildi! Tez orada siz bilan bog‘lanadi.'
                )
          }
          onDone={() => {
            setBankSuccess(false);
            navigate('/my-orders?tab=bank');
          }}
        />
      )}

      {/* Xarita modal */}
      {showMapPicker && (
        <div
          className="cart-map-overlay"
          onClick={() => setShowMapPicker(false)}
        >
          <div className="cart-map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-map-header">
              <h3>
                <MapPin size={18} />{' '}
                {t(
                  'cartPage.selectLocation',
                  'Yetkazib berish manzilini tanlang'
                )}
              </h3>
              <button onClick={() => setShowMapPicker(false)}>
                <X size={20} />
              </button>
            </div>

            <LocationMapPicker
              lat={selectedLocation?.lat}
              lng={selectedLocation?.lng}
              onSelect={(loc) => setSelectedLocation(loc)}
            />

            {selectedLocation?.address && (
              <p className="cart-map-address">📍 {selectedLocation.address}</p>
            )}

            <button
              className="checkout-btn cart-map-confirm"
              onClick={confirmOrderWithLocation}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('cartPage.submitting', 'Yuborilmoqda...')
                : buttonText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
