import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocationById, uploadLocationMedia, getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
import {
  MapPin, Phone, TrendingUp, ArrowLeft, ShieldCheck,
  Award, Briefcase, Calendar, Quote, X,
  Ruler, Eye, Building2, User,
  Hammer, Wrench, Megaphone, Package, QrCode,
  Banknote, CreditCard, CalendarDays, Calculator, Monitor,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MessageCircle, Crown,
  Wifi, FileText, FileCheck2, ShoppingCart, Star, Navigation,
  Layers, DoorOpen, Zap, Wind, Lightbulb, Footprints, Maximize2, Landmark
} from 'lucide-react';
import '../../styles/locationPage.css';
import { getPosts } from '../services/videos';
import Reels from '../marketplace/MarketplaceReels';
import UniversalCard from './UniversalCard';
import NearbySuppliers from '../common/Nearbysuppliers';
import CelebrityMotivationCard from '../common/CelebrityMotivationCard';

// ============================================================
// 1. CERTIFICATE MODAL
// ============================================================
const CertificateModal = ({ isOpen, onClose, title, url, isPdf }) => {
  if (!isOpen) return null;
  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cert-modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="cert-modal-close"><X size={20} /></button>
        </div>
        <div className="cert-modal-body">
          {isPdf ? (
            <iframe src={url} className="cert-pdf-viewer" title={title} />
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer" className="cert-link">Hujjatni ochish</a>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 2. IMAGE VIEWER MODAL (getImageUrl qo'llanildi)
// ============================================================
const ImageViewerModal = ({ isOpen, onClose, images, activeIndex, setActiveIndex, title }) => {
  const { t } = useTranslation();

  const goPrev = useCallback(
    () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length),
    [images.length, setActiveIndex]
  );
  const goNext = useCallback(
    () => setActiveIndex((prev) => (prev + 1) % images.length),
    [images.length, setActiveIndex]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen) return null;

  return (
    <div className="ImageViewerOverlay">
      <button className="ImageViewerBackBtn" onClick={onClose}>
        <ArrowLeft size={18} /> {t('location.back')}
      </button>
      <button className="ImageViewerCloseBtn" onClick={onClose} aria-label="Yopish">
        <X size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button className="ImageViewerNav prev" onClick={goPrev} aria-label="Oldingi">
            <ChevronLeft size={26} />
          </button>
          <button className="ImageViewerNav next" onClick={goNext} aria-label="Keyingi">
            <ChevronRight size={26} />
          </button>
        </>
      )}

      <div className="ImageViewerScroll" onClick={onClose}>
        <img
  src={getImageUrl(images[activeIndex])}
  alt={title}
  className="ImageViewerImg"
  decoding="async"
  onClick={(e) => e.stopPropagation()}
  onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }}
/>
      </div>

      {images.length > 1 && (
        <div className="ImageViewerThumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((img, idx) => (
  <button
    key={idx}
    className={`ImageViewerThumb ${idx === activeIndex ? 'active' : ''}`}
    onClick={() => setActiveIndex(idx)}
  >
    <img
      src={getImageUrl(img)}
      alt={`thumb-${idx}`}
      onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }}
    />
  </button>
))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// 3. USER INFO CARD
// ============================================================
const UserInfoCard = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!user) return null;

  const avatarUrl = user.avatar_url || (user.user_metadata?.avatar_url) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'U')}&background=00E5FF&color=fff&rounded=true&size=60`;

  const handleProfileClick = () => {
    const userId = user._id || user.id;
    if (userId) navigate(`/profile/${userId}`);
  };

  return (
    <div className="user-info-card">
      <h3 className="ModuleHeading"><User size={18} /> {t('location.owner')}</h3>
      <div className="user-info clickable" onClick={handleProfileClick}>
        <img
          src={avatarUrl}
          alt={user.full_name || user.email}
          className="user-avatar"
          onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
        />
        <div className="user-details">
          <p><strong>{user.full_name || t('location.fullName')}</strong></p>
          <p className="user-email">{user.email}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 4. SERVICE BUTTONS
// ============================================================
const ServiceButtons = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const services = [
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
    } else {
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

// ============================================================
// 5. EQUIPMENT CAROUSEL
// ============================================================
const EquipmentCarousel = ({ items, location, onAddToCalculator }) => {
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
                  title={item.name || item.title || 'Nomsiz texnika'}
                  image={item.images?.[0] ? getImageUrl(item.images[0]) : '/images/placeholder-equipment.jpg'}
                  price={formatPrice(item.price, item.currency) || 'Narxi mavjud emas'}
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

// ============================================================
// 6. MAP PREVIEW
// ============================================================
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

// ============================================================
// 7. ANALYTICS CARD
// ============================================================
const AnalyticsCard = ({ hourlyTraffic = [] }) => {
  const { t } = useTranslation();
  const maxTraffic = Math.max(...hourlyTraffic.map((h) => h.count), 1);

  return (
    <div className="AnalyticsCard">
      <h3 className="ModuleHeading">
        <Footprints size={18} /> {t('location.analyticsHourly')}
      </h3>
      {hourlyTraffic.length > 0 ? (
        <div className="traffic-bars">
          {hourlyTraffic.map((item, idx) => (
            <div key={idx} className="traffic-bar-wrapper">
              <div className="traffic-bar" style={{ height: `${(item.count / maxTraffic) * 100}%` }} />
              <span className="traffic-label">{item.hour}</span>
              <span className="traffic-value">{item.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <span className="empty">{t('location.noData')}</span>
      )}
    </div>
  );
};

// ============================================================
// 8. MAIN COMPONENT – LocationDetailPage
// ============================================================
export default function LocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [location, setLocation] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPhone, setShowPhone] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modal, setModal] = useState({ open: false, title: '', url: '', isPdf: false });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);

  const isOwner = location?.userId?._id === user?.id || user?.email === 'xoshimovabdullox95@gmail.com';

  // savat
  const addToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex((i) => i.id === item.id);
    if (existingIndex !== -1) cart[existingIndex].quantity += 1;
    else cart.push({ ...item, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    alert(t('common.save'));
  };

  const handleAddToCart = () => {
    if (!location) return;
    addToCart({
      id: location._id,
      title: location.title,
      price: parseFloat(location.price_range?.replace(/[^\d]/g, '')) || 0,
      type: 'location',
      image: location.images?.[0] ? getImageUrl(location.images[0]) : '/images/placeholder.jpg',
    });
  };

  // chat
  const handleChat = () => {
    const targetId = location?.userId?._id || location?.userId;
    if (!targetId) {
      alert("Bu e'lon egasi haqida ma'lumot yo'q");
      return;
    }
    navigate(`/chat?userId=${targetId}`);
  };

  // media yuklash
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('media', f));
    try {
      await uploadLocationMedia(location._id, formData);
      alert('Rasm/video yuklandi!');
      const locRes = await getLocationById(id);
      setLocation(locRes.data);
    } catch (err) {
      console.error(err);
      alert('Yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  };

  // location va equipment yuklash
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
  }, [id, t]);

  // reels yuklash
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

  // kalkulyator
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

  // sertifikat modallari
  const openLexModal = () =>
    setModal({ open: true, title: t('location.certificateSubsidy'), url: 'https://lex.uz/docs/-5841077', isPdf: false });
  const openPdfModal = () =>
    setModal({ open: true, title: t('location.certificateTechnical'), url: '/files/texnik-muvofiqlik-sertifikati.pdf', isPdf: true });
  const closeModal = () => setModal({ ...modal, open: false });

  if (loading) return <div className="StatusScreen">{t('location.loading')}</div>;

  if (error || !location) {
    return (
      <div className="StatusScreen Error">
        <h2>⚠️ {t('location.error')}</h2>
        <p>{error || t('location.notFound')}</p>
        <button onClick={() => navigate(-1)} className="BackActionBtn">
          <ArrowLeft size={16} /> {t('location.back')}
        </button>
      </div>
    );
  }

  const images = location?.images?.filter((img) => img !== '/images/placeholder-location.jpg')?.length
    ? location.images
    : [`/images/locations/${location?.title?.toLowerCase().replace(/\s+/g, '-') || 'default'}.jpg`];

  const { details = {}, nearby = [], creativeReason = '', traffic = [], category } = location;

  return (
    <div className="LocationPageWrapper">
      <div className="MainViewport">
        <button className="BackActionBtn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> {t('location.back')}
        </button>

        {/* GALEREYA (getImageUrl qo'llanildi) */}
        <div className="image-gallery">
          <div className="image-gallery-main-wrap" onClick={() => setImageModalOpen(true)}>
            <img
              src={getImageUrl(images[activeImageIndex])}
              alt={location.title}
              className="image-gallery-main"
              loading="eager"
              decoding="async"
              onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }}
            />
            <div className="image-gallery-zoom-hint">
              <Maximize2 size={14} /> {t('location.viewFull') || "Kattalashtirib ko'rish"}
            </div>
          </div>
          {images.length > 1 && (
            <div className="image-gallery-thumbs">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`gallery-thumb ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`thumb-${idx}`}
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ASOSIY GRID */}
        <div className="LayoutGrid">
          <div className="InformationContent">
            <div className="DetailsModule">
              <h2 className="ModuleHeading">{location.title}</h2>
              <p className="ModuleText">{location.description || 'Biznes uchun ideal joylashuv va zamonaviy imkoniyatlar.'}</p>
              <div className="location-meta">
                {location.sqm && <span className="meta-badge"><Ruler size={14} /> {location.sqm} {t('location.metaSqm')}</span>}
                {location.foot_traffic && <span className="meta-badge"><Eye size={14} /> {location.foot_traffic} {t('location.metaFootTraffic')}</span>}
              </div>
              {location.competitors_info && (
                <div className="info-row">
                  <Building2 size={16} className="info-icon" />
                  <strong>{t('location.competition')}</strong> {location.competitors_info}
                </div>
              )}

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-icon"><Ruler size={16} /></span>
                  <div className="detail-text"><span className="detail-label">{t('location.detailArea')}</span><strong>{details.sqm || '—'} m²</strong></div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon"><Layers size={16} /></span>
                  <div className="detail-text"><span className="detail-label">{t('location.detailFloor')}</span><strong>{details.floor || '—'}</strong></div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon"><DoorOpen size={16} /></span>
                  <div className="detail-text"><span className="detail-label">{t('location.detailRooms')}</span><strong>{details.rooms || '—'}</strong></div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon"><Zap size={16} /></span>
                  <div className="detail-text"><span className="detail-label">{t('location.detailPower')}</span><strong>{details.power || '—'} ta</strong></div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon"><Wind size={16} /></span>
                  <div className="detail-text"><span className="detail-label">{t('location.detailVentilation')}</span><strong>{details.ventilation || '—'}</strong></div>
                </div>
              </div>

              <div className="creative-reason">
                <h4><Lightbulb size={16} /> {t('location.creativeReasonTitle')}</h4>
                {creativeReason ? (
                  <p>{creativeReason}</p>
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
              </div>
            </div>

            <CelebrityMotivationCard category={category} />

            {location.documents?.length > 0 && (
              <div className="CertificatesModule">
                <h3 className="ModuleHeading">{t('location.certificatesTitle')}</h3>
                <div className="BadgeCloud">
                  {location.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="VerificationBadge"
                    >
                      <FileText size={14} /> {doc.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {location.userId && <UserInfoCard user={location.userId} />}

            <ServiceButtons />
          </div>

          <div className="ActionSidebar">
            <div className="PriceIndicatorCard">
              <span className="PriceTagLabel">{t('location.priceLabel')}</span>
              <span className="PriceTagValue">
                {location.price_range || '5 000 000'} {location.currency === 'UZS' ? "so'm" : '$'}
              </span>
              <button onClick={handleAddToCart} className="add-to-cart-btn">
                <ShoppingCart size={16} /> {t('location.addToCart')}
              </button>
            </div>

            <div className="calculator-panel">
              <h3>{t('location.calculatorTitle')}</h3>
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
            </div>

            <MapPreview address={location.address} nearby={nearby} />

            <AnalyticsCard hourlyTraffic={traffic} />

            <div className="ContactSurface">
              <h3 className="CardSmallTitle">{t('location.contactTitle')}</h3>
              <div className="AddressLine"><MapPin size={15} /> {location.address}</div>
              {!showPhone ? (
                <button className="RevealPhoneBtn" onClick={() => setShowPhone(true)}>
                  <Phone size={16} /> {t('location.showPhone')}
                </button>
              ) : (
                <a href={`tel:${location.phone}`} className="DirectPhoneLink">{location.phone}</a>
              )}
            </div>

            <div className="chat-with-owner">
              <button onClick={handleChat} className="chat-owner-btn">
                <MessageCircle size={18} /> {t('location.chatWithOwner')}
              </button>
            </div>

            {isOwner && (
              <div className="media-upload-section">
                <label className="upload-btn">
                  {uploading ? t('location.loading') : t('location.uploadMedia') || 'Rasm/video yuklash'}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleMediaUpload}
                    disabled={uploading}
                  />
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
          </div>
        </div>

        <EquipmentCarousel items={equipment} location={location} onAddToCalculator={addToCalculator} />
      </div>

      <CertificateModal isOpen={modal.open} onClose={closeModal} title={modal.title} url={modal.url} isPdf={modal.isPdf} />

      <ImageViewerModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={images}
        activeIndex={activeImageIndex}
        setActiveIndex={setActiveImageIndex}
        title={location.title}
      />
    </div>
  );
}