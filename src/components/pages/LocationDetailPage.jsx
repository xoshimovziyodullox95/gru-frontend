import { safeGoBack } from '../utils/navigation.js';
import { listingChatUrl } from '../utils/listingChatUrl.js';
import { recordRecentlyViewed } from '../utils/recentlyViewed.js';
import useBodyScrollLock from '../../hooks/useBodyScrollLock.js';
import ShareSheet from '../common/ShareSheet.jsx';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocationById, uploadLocationMedia } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { useAuth } from '../context/AuthContext';
import { useMyMongoId, sameId } from '../hooks/useMyMongoId';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';

import {
  MapPin, Phone, ArrowLeft, ShieldCheck, Share2,
  Calendar, X,
  Ruler, Eye, Building2,
  Hammer, Megaphone, Calculator, Monitor,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MessageCircle, Crown,
  Wifi, FileText, Navigation,
  Lightbulb, Landmark, Utensils
} from 'lucide-react';
import '../../styles/locationPage.css';
import DetailGallery from '../detail/DetailGallery';
import ClampText from '../detail/ClampText';
import Avatar from '../detail/Avatar';
import '../../styles/detailModern.css';
import { getPosts } from '../services/videos';
import Reels from '../marketplace/MarketplaceReels';
import UniversalCard from './UniversalCard';
import NearbySuppliers from '../common/Nearbysuppliers';

import { T } from '../utils/T';

const ImageViewerModal = ({ isOpen, onClose, images, activeIndex, setActiveIndex, title }) => {
  const closeRef = useRef(onClose);

  const goPrev = useCallback(
    () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length),
    [images.length, setActiveIndex]
  );
  const goNext = useCallback(
    () => setActiveIndex((prev) => (prev + 1) % images.length),
    [images.length, setActiveIndex]
  );

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeRef.current?.();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, goNext, goPrev]);

  if (!isOpen) return null;

  const currentImage = images?.[activeIndex] || '/images/zumo-placeholder.svg';
  const safeImageUrl = getImageUrl(currentImage) || '/images/zumo-placeholder.svg';

  return (
    <div className="ImageViewerOverlay">
      <button type="button" className="ImageViewerCloseBtn" onClick={onClose} aria-label={T('Yopish')}>
        <X size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button className="ImageViewerNav prev" onClick={goPrev} aria-label={T('Oldingi')}>
            <ChevronLeft size={26} />
          </button>
          <button className="ImageViewerNav next" onClick={goNext} aria-label={T('Keyingi')}>
            <ChevronRight size={26} />
          </button>
        </>
      )}

      <div className="ImageViewerScroll" onClick={onClose}>
        <img
          src={safeImageUrl}
          alt={title}
          className="ImageViewerImg"
          decoding="async"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/zumo-placeholder.svg';
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="ImageViewerThumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((img, idx) => {
            const thumbSrc = getImageUrl(img) || '/images/zumo-placeholder.svg';
            return (
              <button
                key={idx}
                className={`ImageViewerThumb ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(idx)}
              >
                <img
                  src={thumbSrc}
                  alt={`thumb-${idx}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/zumo-placeholder.svg';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ServiceButtons = ({ level1 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const showProducts = level1 === 'Restoran/Kafe' || level1 === "Do'konlar";

  const services = [
    ...(showProducts
      ? [{ name: t('services.products', 'Mahsulotlar'), slug: 'products', icon: Utensils, isProducts: true }]
      : []),
    { name: t('services.repair', "Qurilish va santexnika"), slug: 'repair', icon: Hammer },
    { name: t('services.smm', "Marketing"), slug: 'marketing', icon: Megaphone },
    { name: t('services.event'), slug: 'event', icon: Calendar },
    { name: t('services.bankServices', "Bank xizmatlari"), slug: 'bank-xizmatlari', icon: Landmark, isBank: true },
    { name: t('services.accounting'), slug: 'accounting', icon: Calculator },
    { name: t('services.website', "Sayt yaratish"), slug: 'website', icon: Monitor },
    { name: t('services.internet'), slug: 'internet', icon: Wifi },
  ];

  const visible = showAll ? services : services.slice(0, 6);

  const handleServiceClick = (service) => {
    if (service.isBank) {
      navigate('/bank-services');
   } else if (service.isProducts) {
  navigate('/marketplace/products/oziqovqat');
}else {
      navigate(`/services/${service.slug}`);
    }
  };

  return (
    <div className="services-buttons-section">
      <h3 className="ModuleHeading">{t('location.services')}</h3>
      <div className="services-buttons-vertical">
        {visible.map((service) => {
          const Icon = service.icon;
          return (
            <button
              key={service.slug}
              className="service-btn-vertical"
              onClick={() => handleServiceClick(service)}
            >
              <Icon size={20} />
              <span>{service.name}</span>
            </button>
          );
        })}
      </div>
      {services.length > 6 && (
        <button className="show-more-services-btn" onClick={() => setShowAll(!showAll)}>
          {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showAll ? ' ' + t('location.showLess') : ' ' + t('location.showMore')}
        </button>
      )}
    </div>
  );
};
// =============================================

const EquipmentCarousel = ({ items, location }) => {
  const { t } = useTranslation();
  const trackRef = useRef(null);

  if (!items || items.length === 0) return null;

  const scrollByAmount = (direction) => {
    const el = trackRef.current;
    if (!el) return;

    const firstCard = el.querySelector('.carousel-slide-item');
    const cardWidth = firstCard?.offsetWidth || 260;
    const gap = 16;
    const step = cardWidth + gap;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (direction === 1) {
      if (el.scrollLeft >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step * 3, behavior: 'smooth' });
      }
    } else {
      if (el.scrollLeft <= 4) {
        el.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -step * 3, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="equipment-carousel-section">
      <div className="carousel-wrapper">
        <div className="carousel-track carousel-track-scroll" ref={trackRef}>
          {items.map((item, idx) => {
            const itemId = item._id || `eq_${idx}`;
            const maxQuantity = typeof item.stockQuantity === 'number' ? item.stockQuantity : undefined;

            return (
              <div key={idx} className="carousel-slide-item">
                <UniversalCard
                  id={itemId}
                  type="equipment"
                  maxQuantity={maxQuantity}
                  saleMode={item.saleMode}
                  title={item.name || item.title || T('Nomsiz texnika')}
                  image={item.images?.[0] ? getImageUrl(item.images[0]) : '/images/zumo-placeholder.svg'}
                  price={formatPrice(item.price, item.currency) || T('Narxi mavjud emas')}
                  link={`/equipment/${itemId}`}
                  createdAt={location?.createdAt}
                  meta={[{ icon: MapPin, text: location?.address || t('location.address') }]}
                />
              </div>
            );
          })}
        </div>
      </div>

      {items.length > 3 && (
        <div className="carousel-nav" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button className="carousel-btn prev" onClick={() => scrollByAmount(-1)}>‹</button>
          <button className="carousel-btn next" onClick={() => scrollByAmount(1)}>›</button>
        </div>
      )}
    </div>
  );
};

const MapPreview = ({ address, nearby = [] }) => {
  const { t } = useTranslation();
  const openInMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`, '_blank');
  };

  return (
    <div className="InteractiveMapBox">
      <div className="MapVisual" onClick={openInMaps}>
        <div className="MapTerrain">
          <span className="map-blob blob1" />
          <span className="map-blob blob2" />
          <span className="map-blob blob3" />
          <span className="map-road road1" />
          <span className="map-road road2" />
          <span className="map-road road3" />
        </div>
        <div className="MapPulseMarker">
          <span className="pulse-ring" />
          <span className="pulse-ring pulse-ring-delay" />
          <span className="pulse-core">
            <MapPin size={16} strokeWidth={2.5} />
          </span>
        </div>
      </div>
      <p className="MapInteractionHint" onClick={openInMaps}><Navigation size={13} /> {t('location.openInMaps')}</p>

      {nearby.length > 0 && (
        <div className="map-nearby-list">
          <p className="map-nearby-label"><MapPin size={13} /> {t('location.nearbyLabel')}</p>
          <div className="nearby-list">
            {nearby.map((p, idx) => (
              <span key={idx} className="nearby-tag"><MapPin size={12} /> {p.name} — {p.distance} m</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function LocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const myId = useMyMongoId();
  const { t } = useTranslation();

  const [location, setLocation] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPhone, setShowPhone] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);

  const isOwner = sameId(location?.userId?._id || location?.userId, myId) || user?.email === 'xoshimovabdullox95@gmail.com';

  const handleChat = () => {
    const targetId = location?.userId?._id || location?.userId;
    if (!targetId) {
      alert(T('Bu e\'lon egasi haqida ma\'lumot yo\'q'));
      return;
    }
    navigate(listingChatUrl(targetId, {
      id: location?._id,
      type: 'location',
      title: location?.title,
      thumbnail: location?.images?.[0] ? getImageUrl(location.images[0]) : '',
      price: location?.price_range || location?.price_per_month || '',
    }));
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('media', f));
    try {
      await uploadLocationMedia(location._id, formData);
      alert(T('Rasm/video yuklandi!'));
      const locRes = await getLocationById(id);
      setLocation(locRes.data);
    } catch (err) {
      console.error(err);
      alert(T('Yuklashda xatolik'));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const locRes = await getLocationById(id);
        if (!locRes.data) {
          setError(t('location.notFound'));
          setLoading(false);
          return;
        }
        setLocation(locRes.data);
        recordRecentlyViewed(user?._id || user?.id, {
          id: locRes.data._id || id,
          type: 'location',
          title: locRes.data.title || locRes.data.name || T('E’lon'),
          image: locRes.data.images?.[0] || locRes.data.image || locRes.data.imageUrl || '',
          price: locRes.data.price_per_month ? `${locRes.data.price_per_month} ${locRes.data.currency || "so'm"}/oy` : (locRes.data.price_range || ''),
          currency: locRes.data.currency,
          link: `/location/${locRes.data._id || id}`,
        });
        setActiveImageIndex(0);

        const level1 = locRes.data.level1;
        const eqRes = level1 ? await getEquipment({ level1 }) : await getEquipment();
        setEquipment(eqRes.data || []);
      } catch (err) {
        console.error('Xatolik:', err);
        setError(t('location.error'));
        setLocation(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, t, user]);

  useEffect(() => {
    const loadReels = async () => {
      try {
        setReelsLoading(true);
        const res = await getPosts();
        setReels(res?.data || []);
      } catch (err) {
        console.error('Reels xatolik:', err);
        setReels([]);
      } finally {
        setReelsLoading(false);
      }
    };
    loadReels();
  }, []);

  const addToCalculator = (item) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: item.id, title: item.title, price: item.price, quantity: 1 }];
    });
  };

  const decrementCalculatorItem = (itemId) => {
    setSelectedItems((prev) =>
      prev
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCalculator = (itemId) => setSelectedItems(selectedItems.filter((i) => i.id !== itemId));

  const addAllEquipment = () => {
    setSelectedItems((prev) => {
      const merged = [...prev];
      equipment.forEach((eq) => {
        const existing = merged.find((i) => i.id === eq._id);
        if (existing) {
          existing.quantity += 1;
        } else {
          merged.push({ id: eq._id, title: eq.title, price: eq.price, quantity: 1 });
        }
      });
      return merged;
    });
  };

  if (loading) return <div className="StatusScreen">{t('location.loading')}</div>;

  if (error || !location) {
    return (
      <div className="StatusScreen Error">
        <h2>{t('location.error')}</h2>
        <p>{error || t('location.notFound')}</p>
        <button onClick={() => safeGoBack(navigate)} className="BackActionBtn">
          <ArrowLeft size={16} /> {t('location.back')}
        </button>
      </div>
    );
  }

  const images = location?.images?.filter((img) => img !== '/images/zumo-placeholder.svg')?.length
    ? location.images
    : [`/images/locations/${location?.title?.toLowerCase().replace(/\s+/g, '-') || 'default'}.jpg`];

  const { details = {}, nearby = [], creativeReason = '' } = location;

  // "2000000000" → "2 000 000 000 so‘m"
  const rawPrice = String(location.price_range || '').trim();
  const priceNumber = /^\d+$/.test(rawPrice) ? Number(rawPrice).toLocaleString('ru-RU').replace(/\s/g, ' ') : rawPrice;
  const priceText = rawPrice
    ? `${priceNumber} ${location.currency === 'UZS' ? 'so‘m' : '$'}`
    : T('Kelishiladi');
  const owner = location.userId && typeof location.userId === 'object' ? location.userId : null;
  const ownerName = owner?.fullName || owner?.full_name || owner?.companyName || '';
  const facts = [
    { label: t('location.detailArea'), value: details.sqm || location.sqm ? `${details.sqm || location.sqm} m²` : null },
    { label: t('location.detailFloor'), value: details.floor },
    { label: t('location.detailRooms'), value: details.rooms },
    { label: t('location.detailPower'), value: details.power ? `${details.power} ta` : null },
    { label: t('location.detailVentilation'), value: details.ventilation },
  ].filter((f) => f.value);

  return (
    <div className="dp-page">
      <div className="dp-layout">
        <main className="dp-main">
          <DetailGallery
            images={images}
            title={location.title}
            onBack={() => safeGoBack(navigate)}
            onShare={user ? () => setShareOpen(true) : undefined}
            onOpen={(i) => { setActiveImageIndex(i); setImageModalOpen(true); }}
          />

          {/* SARLAVHA, NARX, MANZIL */}
          <section className="dp-card dp-head">
            <h1 className="dp-title">{location.title}</h1>
            <div className="dp-price">
              <span>{T('Narxi')}</span>
              <strong>{priceText}</strong>
            </div>
            {location.address && <div className="dp-contact-line"><MapPin size={15} /> {location.address}</div>}
            <div className="dp-badges">
              {location.sqm && <span className="dp-badge"><Ruler size={13} /> {location.sqm} {t('location.metaSqm')}</span>}
              {location.foot_traffic && <span className="dp-badge"><Eye size={13} /> {location.foot_traffic} {t('location.metaFootTraffic')}</span>}
            </div>
          </section>

          {/* TAVSIF VA PARAMETRLAR */}
          <section className="dp-card">
            <h2 className="dp-card__title"><FileText size={18} /> {T('Tavsif')}</h2>
            <ClampText text={location.description || T('Biznes uchun ideal joylashuv va zamonaviy imkoniyatlar.')} />
            {facts.length > 0 && (
              <dl className="dp-facts">
                {facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
              </dl>
            )}
            {location.competitors_info && (
              <div className="dp-contact-line"><Building2 size={15} /> <span><strong>{t('location.competition')}</strong> {location.competitors_info}</span></div>
            )}
          </section>

          {/* NEGA BU JOY */}
          <section className="dp-card creative-reason">
            <h2 className="dp-card__title"><Lightbulb size={18} /> {t('location.creativeReasonTitle')}</h2>
            {creativeReason ? (
              <p className="dp-text">{creativeReason}</p>
            ) : (
              <div className="premium-hint">
                <p>{t('location.creativeReasonEmpty')}</p>
                <Link to="/premium" className="premium-link">
                  <Crown size={16} /> {t('location.creativeReasonPremium')}
                </Link>
              </div>
            )}
            {creativeReason && location.creativeReasonSource === 'admin' && (
              <span className="admin-badge"><ShieldCheck size={12} /> {t('location.creativeReasonAdmin')}</span>
            )}
          </section>


          {/* EGASI */}
          {owner && (
            <section className="dp-card dp-owner">
              <Avatar className="dp-owner__avatar" src={owner.avatar_url} name={ownerName} />
              <div className="dp-owner__text">
                <span>{T('Joy egasi')}</span>
                <strong>{ownerName || T('Foydalanuvchi')}</strong>
              </div>
              {owner._id && (
                <button type="button" className="dp-chip-btn" onClick={() => navigate(`/profile/${owner._id}`)}>
                  {T('Profil')} <ChevronRight size={15} />
                </button>
              )}
            </section>
          )}

          {/* ALOQA */}
          {location.phone && (
            <section className="dp-card">
              <h2 className="dp-card__title"><Phone size={18} /> {t('location.contactTitle')}</h2>
              {!showPhone ? (
                <button className="dp-phone-btn" onClick={() => setShowPhone(true)}>
                  <Phone size={16} /> {t('location.showPhone')}
                </button>
              ) : (
                <a href={`tel:${location.phone}`} className="dp-phone-btn dp-phone-btn--open">{location.phone}</a>
              )}
            </section>
          )}

          <MapPreview address={location.address} nearby={nearby} />

          {/* JIHOZLAR KALKULYATORI */}
          <section className="dp-card calculator-panel">
            <h2 className="dp-card__title">{t('location.calculatorTitle')}</h2>
            {equipment.length > 0 && (
              <button className="calc-add-all-btn" onClick={addAllEquipment}>
                {t('calculator.addAll')}
              </button>
            )}
            <div className="calc-items-list">
              {selectedItems.length === 0 ? (
                <div className="calc-empty">{t('location.calculatorEmpty')}</div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.id} className="calc-item">
                    <span className="calc-item-name">{item.title}</span>
                    <div className="calc-item-qty">
                      <button onClick={() => decrementCalculatorItem(item.id)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => addToCalculator(item)}>+</button>
                    </div>
                    <span className="calc-item-price">${(item.price * item.quantity).toLocaleString()}</span>
                    <button className="calc-remove-btn" onClick={() => removeFromCalculator(item.id)}><X size={14} /></button>
                  </div>
                ))
              )}
            </div>
            <div className="calc-total">
              <span className="calc-total-label">{t('location.calculatorTotal')}</span>
              <span className="calc-total-value">
                ${selectedItems.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0).toLocaleString()}
              </span>
            </div>
            <NearbySuppliers location={location} selectedItems={selectedItems} onAdd={addToCalculator} />
          </section>

          <EquipmentCarousel items={equipment} location={location} />

          <ServiceButtons level1={location.level1} />

          {isOwner && (
            <div className="media-upload-section">
              <label className="upload-btn">
                {uploading ? t('location.loading') : t('location.uploadMedia') || T('Rasm/video yuklash')}
                <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleMediaUpload} disabled={uploading} />
              </label>
              {uploading && <span className="uploading-text">{t('location.loading')}</span>}
            </div>
          )}

          {reels.length > 0 && !reelsLoading && (
            <Reels
              reels={reels}
              currentUser={user}
              variant="grid2"
              priorityId={location._id}
              onReelUpdate={(reelId, updates) => {
                setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, ...updates } : r)));
              }}
            />
          )}

        </main>

        {/* KOMPYUTERDA: O'NG USTUN */}
        <aside className="dp-aside">
          <div className="dp-card dp-aside__box">
            <span className="dp-aside__label">{T('Narxi')}</span>
            <strong className="dp-aside__price">{priceText}</strong>
            {!isOwner && (
              <button type="button" className="dp-btn dp-btn--primary" onClick={handleChat}>
                <MessageCircle size={17} /> {t('location.chatWithOwner', 'Joy egasi bilan bog‘lanish')}
              </button>
            )}
            {user && (
              <button type="button" className="dp-btn dp-btn--ghost" onClick={() => setShareOpen(true)}>
                <Share2 size={17} /> {t('common.share', 'Do‘stga yuborish')}
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* TELEFONDA: PASTKI PANEL */}
      {!isOwner && (
        <div className="dp-actionbar">
          {location.phone ? (
            <>
              <button type="button" className="dp-btn dp-btn--icon" onClick={handleChat} aria-label={T('Yozish')}>
                <MessageCircle size={20} />
              </button>
              <a className="dp-btn dp-btn--primary" href={`tel:${location.phone}`}><Phone size={17} /> {T('Qo‘ng‘iroq qilish')}</a>
            </>
          ) : (
            <button type="button" className="dp-btn dp-btn--primary" onClick={handleChat}><MessageCircle size={17} /> {T('Egasiga yozish')}</button>
          )}
        </div>
      )}

      <ImageViewerModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={images}
        activeIndex={activeImageIndex}
        setActiveIndex={setActiveImageIndex}
        title={location.title}
      />
      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        listing={{
          id: location._id,
          title: location.title,
          link: `/location/${location._id}`,
          listingType: 'location',
          thumbnailUrl: getImageUrl(images[0]) || '',
          price: location.price_range || location.price_per_month || '',
        }}
      />
    </div>
  );
}
