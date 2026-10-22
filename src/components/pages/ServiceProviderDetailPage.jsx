import { safeGoBack } from '../utils/navigation.js';
// src/components/pages/ServiceProviderDetailPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Phone, ArrowLeft, ShieldCheck, Flame,
  Tag, Mail, Globe, MessageCircle,
  Star, User, ChevronLeft, ChevronRight, X, Maximize2, FileText, Share2,
  Send
} from 'lucide-react';
import { getServiceProviderById, getServiceProviders, rateServiceProvider, commentServiceProvider, replyServiceProviderComment, applyToService } from '../services/serviceProviders';
import { useAuth } from '../context/AuthContext';
import '../../styles/locationPage.css';
import '../../styles/serviceProviderDetail.css';
import CelebrityMotivationCard from '../common/CelebrityMotivationCard';
import ServiceProviderCard from '../marketplace/ServiceProviderCard';
import { getImageUrl } from '../utils/imageUrl';
import RatingAndComments from '../common/RatingAndComments';
import '../../styles/ratingAndComments.css';
import useBodyScrollLock from '../../hooks/useBodyScrollLock.js';
import ShareSheet from '../common/ShareSheet.jsx';

// ============================================================
// IMAGE VIEWER MODAL
// ============================================================
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
      <button type="button" className="ImageViewerCloseBtn" onClick={onClose} aria-label="Yopish">
        <X size={22} />
      </button>
      {images.length > 1 && (
        <>
          <button className="ImageViewerNav prev" onClick={goPrev} aria-label="Oldingi"><ChevronLeft size={26} /></button>
          <button className="ImageViewerNav next" onClick={goNext} aria-label="Keyingi"><ChevronRight size={26} /></button>
        </>
      )}
      <div className="ImageViewerScroll" onClick={onClose}>
        <img
          src={safeImageUrl}
          alt={title}
          className="ImageViewerImg"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/zumo-placeholder.svg'; }}
        />
      </div>
      {images.length > 1 && (
        <div className="ImageViewerThumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((img, idx) => (
            <button key={idx} className={`ImageViewerThumb ${idx === activeIndex ? 'active' : ''}`} onClick={() => setActiveIndex(idx)}>
              <img
                src={getImageUrl(img) || '/images/zumo-placeholder.svg'}
                alt={`thumb-${idx}`}
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/zumo-placeholder.svg'; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// ASOSIY KOMPONENT
// ============================================================
export default function ServiceProviderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPhone, setShowPhone] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // ===== MA'LUMOTLARNI YUKLASH =====
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setActiveImageIndex(0);
        const res = await getServiceProviderById(id);
        if (!res.data) {
          setError(t('serviceProvider.notFound'));
        } else {
          setProvider(res.data);
        }
      } catch (err) {
        console.error(err);
        setError(t('serviceProvider.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t]);

  // ===== BOSHQA XIZMATLAR =====
  useEffect(() => {
    if (!provider?.service_category) return;
    getServiceProviders({ category: provider.service_category })
      .then((res) => {
        const others = (res.data || []).filter((p) => p._id !== provider._id).slice(0, 6);
        setRelated(others);
      })
      .catch(() => setRelated([]));
  }, [provider]);

  // ===== CHAT =====
  const handleChat = () => {
    const targetId = provider?.userId?._id || provider?.userId;
    if (!targetId) {
      alert(t('serviceProvider.noOwnerInfo'));
      return;
    }
    navigate(`/chat?userId=${targetId}`);
  };

  // ===== ARIZA BERISH =====
  const handleApply = async () => {
    try {
      await applyToService(provider._id);
      alert(t('serviceProvider.applySuccess', 'Ariza yuborildi!'));
    } catch (err) {
      alert(err.response?.data?.error || t('serviceProvider.applyError', 'Xatolik yuz berdi'));
    }
  };

  const isOwner = provider?.userId?._id === user?.id || user?.email === 'feruzaxashimova250@gmail.com';

  // ===== YUKLASH / XATOLIK =====
  if (loading) return <div className="StatusScreen">{t('serviceProvider.loading')}</div>;
  if (error || !provider) {
    return (
      <>
        <div className="StatusScreen Error">
          <h2>⚠️ {t('serviceProvider.error')}</h2>
          <p>{error || t('serviceProvider.notFound')}</p>
          <button onClick={() => safeGoBack(navigate)} className="BackActionBtn">
            <ArrowLeft size={16} /> {t('serviceProvider.back')}
          </button>
        </div>
      </>
    );
  }

  const images = provider.media?.length
    ? provider.media
    : [provider.image || '/images/service-providers/default.jpg'];

  const getProviderTypeLabel = (type) => {
    if (type === 'business') return t('serviceProvider.badgeBusiness');
    if (type === 'individual') return t('serviceProvider.badgeIndividual');
    return type || '';
  };

  // ===== RENDER =====
  return (
    <>
      <div className="LocationPageWrapper">
        <div className="MainViewport">
          <button className="BackActionBtn" onClick={() => safeGoBack(navigate)}>
            <ArrowLeft size={16} /> {t('serviceProvider.back')}
          </button>

          {/* HERO KARTA */}
          <div className="spd-hero-card">
            <div className="spd-hero-top">
             <div className="spd-hero-logo" onClick={() => setImageModalOpen(true)}>
  <img
    src={images[0] || '/images/zumo-placeholder.svg'}
    alt={provider.name}
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = '/images/zumo-placeholder.svg';
    }}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  />
  {images.length > 1 && (
    <span className="spd-hero-logo-hint"><Maximize2 size={12} /></span>
  )}
</div>
              <div className="spd-hero-titles">
                {provider.company && <span className="spd-hero-company">{provider.company}</span>}
                <h1 className="spd-hero-name">{provider.name}</h1>
                <div className="location-meta">
                  {provider.is_top && <span className="meta-badge"><Flame size={13} /> {t('serviceProvider.badgeTop')}</span>}
                  {provider.is_verified && <span className="meta-badge"><ShieldCheck size={13} /> {t('serviceProvider.badgeVerified')}</span>}
                  {provider.provider_type && (
                    <span className="meta-badge"><User size={13} /> {getProviderTypeLabel(provider.provider_type)}</span>
                  )}
                  {typeof provider.rating === 'number' && (
                    <span className="meta-badge spd-rating-badge"><Star size={13} /> {provider.rating}</span>
                  )}
                </div>
              </div>
            </div>

            {images.length > 1 && (
              <div className="image-gallery-thumbs spd-thumbs">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`gallery-thumb ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => { setActiveImageIndex(idx); setImageModalOpen(true); }}
                  >
                    <img src={getImageUrl(img) || '/images/zumo-placeholder.svg'} alt={`thumb-${idx}`} onError={(e) => { e.target.onerror = null; e.target.src = '/images/zumo-placeholder.svg'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ASOSIY GRID */}
          <div className="LayoutGrid">
            {/* CHAP USTUN */}
            <div className="InformationContent">
              <div className="DetailsModule">
                <h3 className="ModuleHeading"><FileText size={18} /> {t('serviceProvider.about', 'Xizmat haqida')}</h3>
                <p className="ModuleText">{provider.description || t('serviceProvider.defaultDescription')}</p>

                <div className="detail-grid">
                  {provider.speciality && (
                    <div className="detail-item">
                      <span className="detail-icon"><Tag size={16} /></span>
                      <div className="detail-text">
                        <span className="detail-label">{t('serviceProvider.speciality')}</span>
                        <strong>{provider.speciality}</strong>
                      </div>
                    </div>
                  )}
                  {provider.price_range && (
                    <div className="detail-item">
                      <span className="detail-icon"><Star size={16} /></span>
                      <div className="detail-text">
                        <span className="detail-label">{t('serviceProvider.priceRange')}</span>
                        <strong>{provider.price_range}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <CelebrityMotivationCard category={provider.level1} />

              {provider.userId && (
                <div className="user-info-card">
                  <h3 className="ModuleHeading"><User size={18} /> {t('serviceProvider.owner')}</h3>
                  <div className="user-info">
                    <img
                      src={
                        provider.userId.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.userId.full_name || 'U')}&background=00E5FF&color=fff&rounded=true&size=60`
                      }
                      alt={provider.userId.full_name}
                      className="user-avatar"
                      onError={(e) => e.target.src = '/images/zumo-placeholder.svg'}
                    />
                    <div className="user-details">
                      <p><strong>{provider.userId.full_name || t('serviceProvider.fullName')}</strong></p>
                      {provider.userId.email && <p className="user-email">{provider.userId.email}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* RATING AND COMMENTS */}
              <RatingAndComments
                itemId={provider._id}
                initialRatings={provider.ratings || []}
                initialComments={provider.comments || []}
                currentUser={user}
                api={{ rate: rateServiceProvider, comment: commentServiceProvider, reply: replyServiceProviderComment }}
              />
            </div>

            {/* O'NG USTUN */}
            <div className="ActionSidebar">
              {provider.price_range && (
                <div className="PriceIndicatorCard">
                  <span className="PriceTagLabel">{t('serviceProvider.priceRange')}</span>
                  <span className="PriceTagValue">{provider.price_range}</span>
                </div>
              )}

              <div className="ContactSurface">
                <h3 className="CardSmallTitle">{t('serviceProvider.contactTitle')}</h3>
                {provider.email && <div className="AddressLine"><Mail size={15} /> {provider.email}</div>}
                {provider.website && (
                  <div className="AddressLine">
                    <Globe size={15} />
                    <a href={provider.website} target="_blank" rel="noopener noreferrer">{provider.website}</a>
                  </div>
                )}
                {!showPhone ? (
                  <button className="RevealPhoneBtn" onClick={() => setShowPhone(true)}>
                    <Phone size={16} /> {t('serviceProvider.showPhone')}
                  </button>
                ) : (
                  <a href={`tel:${provider.phone}`} className="DirectPhoneLink">{provider.phone}</a>
                )}
              </div>

              <div className="chat-with-owner">
                <button onClick={handleChat} className="chat-owner-btn">
                  <MessageCircle size={18} /> {t('serviceProvider.chatWithOwner')}
                </button>
              </div>

              {/* ARIZA TUGMASI — xizmat savat orqali emas, ariza orqali buyurtma qilinadi */}
              <div className="chat-with-owner" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!isOwner && (
                  <button
                    onClick={handleApply}
                    className="chat-owner-btn"
                    style={{ background: 'linear-gradient(135deg, #0055b3, var(--cyan))' }}
                  >
                    <Send size={18} /> {t('serviceProvider.apply', 'To\'g\'ridan-to\'g\'ri ariza berish')}
                  </button>
                )}
                {user && (
                  <button type="button" className="chat-owner-btn" onClick={() => setShareOpen(true)}>
                    <Share2 size={18} /> {t('common.share', 'Do‘stga yuborish')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BOSHQA XIZMATLAR */}
          {related.length > 0 && (
            <div className="spd-related-section">
              <h3 className="ModuleHeading">
                {t('serviceProvider.otherServices', "{{company}}ning boshqa xizmatlari", { company: provider.company || provider.name })}
              </h3>
              <div className="spd-related-grid">
                {related.map((p) => (
                  <ServiceProviderCard
                    key={p._id}
                    id={p._id}
                    name={p.name}
                    company={p.company}
                    image={p.image}
                    price_range={p.price_range}
                    description={p.description}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ImageViewerModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={images}
        activeIndex={activeImageIndex}
        setActiveIndex={setActiveImageIndex}
        title={provider.name}
      />
      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        listing={{
          id: provider._id,
          title: provider.name,
          link: `/service-provider/${provider._id}`,
          listingType: 'serviceprovider',
          thumbnailUrl: getImageUrl(images[0]) || '',
          price: provider.price_range || '',
        }}
      />
    </>
  );
}
