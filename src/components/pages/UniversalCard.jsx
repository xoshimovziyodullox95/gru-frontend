// src/components/UniversalCard.jsx
import { Link } from 'react-router-dom';
import { Heart, Flame, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../hooks/useCart';
import CartStepper from '../CartStepper';
import '../../styles/universalCard.css';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
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
  saleMode = 'store',
})  {
  const { t } = useTranslation();
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

  const isOrderableProduct = type === 'equipment' && saleMode !== 'classified';

  const getBadgeText = (badgeType) => {
    if (badgeType === 'top') return t('universalCard.badgeTop');
    if (badgeType === 'verified') return t('universalCard.badgeVerified');
    return badgeType;
  };

  return (
    <Link to={link} className="uc-card">
      <div className="uc-image-wrap">
        <img
  src={getImageUrl(image)}
          alt={title}
          className="uc-image"
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/zumo-placeholder.svg'; }}
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

      {/* Uzum uslubi: narx → nom → bitta amal. Butun karta havola, shuning uchun "Batafsil" tugmasi yo'q */}
      <div className="uc-body">
        <span className="uc-price">
          {(typeof price === 'number' ? formatPrice(price, currency) : price) || t('universalCard.priceNotAvailable')}
        </span>
        <h3 className="uc-title">{title}</h3>
        {type === 'equipment' && !isOrderableProduct && (
          <span className="uc-sale-hint">{t('universalCard.contactSeller', 'Sotuvchi bilan kelishiladi')}</span>
        )}

        <div className="uc-action">
          {isOrderableProduct ? (
            quantity > 0 || maxQuantity === 1 ? (
              <CartStepper
                quantity={quantity}
                maxQuantity={maxQuantity}
                onIncrement={() => increment(cartItem)}
                onDecrement={() => decrement(cartItem)}
              />
            ) : (
              <button
                type="button"
                className="uc-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); increment(cartItem); }}
              >
                <ShoppingCart size={15} /> {t('universalCard.addToCart', 'Savatga')}
              </button>
            )
          ) : (
            <span className="uc-btn uc-btn--ghost">{t('universalCard.details')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
