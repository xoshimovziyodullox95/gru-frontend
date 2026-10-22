import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import UniversalCard from '../pages/UniversalCard.jsx';
import '../../styles/homeListingCarousel.css';

export default function HomeListingCarousel({
  title,
  subtitle,
  items = [],
  emptyTitle,
  emptyText,
  actionLabel = 'Barcha e’lonlarni ko‘rish',
  onAction,
  actionDisabled = false,
  actionKind = 'browse',
}) {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(items.length > 1);

  const updateScrollState = () => {
    const rail = railRef.current;
    if (!rail) return;
    setCanScrollLeft(rail.scrollLeft > 4);
    setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
  }, [items.length]);

  const scroll = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.min(rail.clientWidth * 0.82, 600);
    rail.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <section className="home-listing-section" aria-label={title}>
      <header className="home-listing-section__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="home-listing-section__actions">
          {onAction ? (
            <button type="button" className="home-listing-section__action" onClick={onAction} disabled={actionDisabled}>
              {actionKind === 'location' && <MapPin size={15} />}
              <span>{actionLabel}</span>
            </button>
          ) : (
            <Link className="home-listing-section__action" to="/marketplace/all">
              {actionLabel}<ArrowRight size={15} />
            </Link>
          )}
          {items.length > 2 && (
            <div className="home-listing-section__arrows" aria-label="Karusel boshqaruvi">
              <button type="button" onClick={() => scroll(-1)} disabled={!canScrollLeft} aria-label="Oldingi e’lonlar">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => scroll(1)} disabled={!canScrollRight} aria-label="Keyingi e’lonlar">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {items.length ? (
        <div className="home-listing-section__rail" ref={railRef} onScroll={updateScrollState}>
          {items.map((item) => (
            <div className="home-listing-section__slide" key={`${item.type}-${item.id}`}>
              <UniversalCard
                id={item.id}
                type={item.type}
                title={item.title}
                image={item.image}
                price={item.price}
                currency={item.currency}
                link={item.link}
                isTop={item.isTop}
                isVerified={item.isVerified}
                maxQuantity={item.maxQuantity}
              />
              {Number.isFinite(item.distanceKm) && (
                <span className="home-listing-section__distance">
                  <MapPin size={12} /> {item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} m` : `${item.distanceKm.toFixed(1)} km`}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="home-listing-section__empty">
          <span className="home-listing-section__empty-icon">
            {actionKind === 'location' ? <MapPin size={21} /> : <Search size={21} />}
          </span>
          <div>
            <strong>{emptyTitle}</strong>
            <p>{emptyText}</p>
          </div>
          {!onAction && (
            <Link to="/marketplace/all" aria-label={actionLabel}>
              <ArrowRight size={18} />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
