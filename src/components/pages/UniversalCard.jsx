// src/components/UniversalCard.jsx
import { Link } from 'react-router-dom';
import { Heart, Flame, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import CartStepper from '../CartStepper';
import '../../styles/universalCard.css';
import { formatPrice } from '../utils/formatPrice';
const TYPE_LABELS = {
  location: 'universalCard.typeLocation',
  equipment: 'universalCard.typeEquipment',
  service: 'universalCard.typeService',
};

export default function UniversalCard({
  id,
  type = 'location',
  title,
  image,
  price,
  currency,        // <-- BU QATOR bormi?
  link,
  isTop = false,
  isVerified = false,
  maxQuantity,
})  {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favored = isFavorite(id, type);
  const { getQuantity, increment, decrement } = useCart();

  const numericPrice =
    typeof price === 'number' ? price : parseFloat(String(price || '').replace(/[^\d.]/g, '')) || 0;

  const quantity = getQuantity(id);
  const cartItem = { id, title, price: numericPrice, currency, image, link, type, itemType: type };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ id, type, title, image, price, link });
  };

  const isOrderableProduct = type === 'equipment';

  const getBadgeText = (badgeType) => {
    if (badgeType === 'top') return t('universalCard.badgeTop');
    if (badgeType === 'verified') return t('universalCard.badgeVerified');
    return badgeType;
  };

  return (
    <Link to={link} className="uc-card">
      <div className="uc-image-wrap">
        <img
          src={image || '/images/placeholder.jpg'}
          alt={title}
          className="uc-image"
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }}
        />

  

        <button
          type="button"
          className={`uc-fav-btn ${favored ? 'is-active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favored ? t('universalCard.favRemove') : t('universalCard.favAdd')}
        >
          <Heart size={16} fill={favored ? 'currentColor' : 'none'} />
        </button>

        {(isTop || isVerified) && (
          <div className="uc-badges">
            {isTop && <span className="uc-badge uc-badge--top"><Flame size={11} /> {getBadgeText('top')}</span>}
            {isVerified && <span className="uc-badge uc-badge--verified"><ShieldCheck size={11} /> {getBadgeText('verified')}</span>}
          </div>
        )}
      </div>

      <div className="uc-body">
        <h3 className="uc-title">{title}</h3>

        <div className="uc-footer">
         <span className="uc-price">
  {(typeof price === 'number' ? formatPrice(price, currency) : price) || t('universalCard.priceNotAvailable')}
</span>
        </div>

        {isOrderableProduct ? (
          <div className="uc-cart-row">
            <button type="button" className="uc-btn uc-btn--secondary">{t('universalCard.details')}</button>
            <CartStepper
              quantity={quantity}
              maxQuantity={maxQuantity}
              onIncrement={() => increment(cartItem)}
              onDecrement={() => decrement(cartItem)}
            />
          </div>
        ) : (
          <button type="button" className="uc-btn">{t('universalCard.details')}</button>
        )}
      </div>
    </Link>
  );
}