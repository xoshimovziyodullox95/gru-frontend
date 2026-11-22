// src/components/UniversalCard.jsx
import { Link } from 'react-router-dom';
import { Heart, Flame, ShieldCheck, ShoppingCart, Star, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../hooks/useCart';
import CartStepper from '../CartStepper';
import '../../styles/universalCard.css';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl, resolveMediaUrl } from '../utils/imageUrl';
export default function UniversalCard({
  id,
  type = 'location',
  title,
  image,
  price,
  currency,
  link,
  isTop = false,
  isVerified = false,
  maxQuantity,
  saleMode = 'store',
  rating,          // xizmat reytingi (0–5)
  subtitle,        // kompaniya / manzil — nom ostida kichik qator
})  {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favored = isFavorite(id, type);
  const { getQuantity, increment, decrement } = useCart();

  const numericPrice =
    typeof price === 'number' ? price : parseFloat(String(price || '').replace(/[^\d.]/g, '')) || 0;

  const quantity = getQuantity(id);
  // Savatga to'liq manzil saqlanadi — ilovada xom /uploads/... yo'li rasmni ochmasdi
  const cartItem = { id, title, price: numericPrice, currency, image: resolveMediaUrl(image), link, type, itemType: type };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ id, type, title, image, price, link });
  };

  const priceText = typeof price === 'number' ? formatPrice(price, currency) : price;
  // "Narxi mavjud emas" kabi matnlar narx emas — kichik, kulrang ko'rinadi
  const hasPrice = Boolean(priceText) && /\d/.test(String(priceText));
  const ratingValue = Number(rating) || 0;

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
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/zumo-placeholder.svg'; }}
        />

        <button
          type="button"
          className={`uc-fav-btn ${favored ? 'is-active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favored ? t('universalCard.favRemove') : t('universalCard.favAdd')}
        >
          <Heart size={17} strokeWidth={2.2} fill={favored ? 'currentColor' : 'none'} />
        </button>

        {(isTop || isVerified || type !== 'equipment') && (
          <div className="uc-badges">
            {isTop && <span className="uc-badge uc-badge--top"><Flame size={11} /> {getBadgeText('top')}</span>}
            {isVerified && <span className="uc-badge uc-badge--verified"><ShieldCheck size={11} /> {getBadgeText('verified')}</span>}
            {type !== 'equipment' && (
              <span className="uc-badge uc-badge--type">
                {t(`marketplace.types.${type}`, { defaultValue: type === 'service' ? 'Xizmat' : 'Joy' })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Uzum uslubi: narx → nom → bitta amal. Butun karta havola, shuning uchun "Batafsil" tugmasi yo'q */}
      {/* Xizmatda esa nom asosiy: "Narx so'rov asosida" katta sarlavha bo'lib turmasin */}
      <div className={`uc-body ${type === 'service' ? 'uc-body--service' : ''}`}>
        <span className={`uc-price ${hasPrice ? '' : 'uc-price--muted'}`}>
          {hasPrice ? priceText : t('universalCard.priceNotAvailable')}
        </span>
        <h3 className="uc-title">{title}</h3>
        {(ratingValue > 0 || subtitle) && (
          <div className="uc-meta">
            {ratingValue > 0 && (
              <span><Star size={12} className="uc-meta__star" /> <strong>{ratingValue.toFixed(1)}</strong></span>
            )}
            {subtitle && (
              <span className="uc-meta__text">
                {type === 'location' && <MapPin size={11} />} {subtitle}
              </span>
            )}
          </div>
        )}
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
