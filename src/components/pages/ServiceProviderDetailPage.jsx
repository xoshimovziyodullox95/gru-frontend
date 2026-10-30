import { safeGoBack } from '../utils/navigation.js';
// src/components/pages/ServiceProviderDetailPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Phone, ArrowLeft, ShieldCheck, Flame,
  Tag, Mail, Globe, MessageCircle,
  User, ChevronLeft, ChevronRight, X, FileText, Share2,
  Send, Pencil, Inbox
} from 'lucide-react';
import { getServiceProviderById, getServiceProviders } from '../services/serviceProviders';
import { useAuth } from '../context/AuthContext';
import { useMyMongoId, sameId } from '../hooks/useMyMongoId';
import { listingChatUrl } from '../utils/listingChatUrl.js';
import '../../styles/locationPage.css';
import '../../styles/serviceProviderDetail.css';
import ServiceProviderCard from '../marketplace/ServiceProviderCard';
import { getImageUrl } from '../utils/imageUrl';
import DetailGallery from '../detail/DetailGallery';
import Avatar from '../detail/Avatar';
import RatingLink from '../detail/RatingLink';
import ClampText from '../detail/ClampText';
import ReviewsSection from '../reviews/ReviewsSection';
import '../../styles/detailModern.css';
import useBodyScrollLock from '../../hooks/useBodyScrollLock.js';
import ShareSheet from '../common/ShareSheet.jsx';

import { T } from '../utils/T';
import { serviceLabel } from '../utils/i18nHelpers';
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
      <button type="button" className="ImageViewerCloseBtn" onClick={onClose} aria-label={T('Yopish')}>
        <X size={22} />
      </button>
      {images.length > 1 && (
        <>
          <button className="ImageViewerNav prev" onClick={goPrev} aria-label={T('Oldingi')}><ChevronLeft size={26} /></button>
          <button className="ImageViewerNav next" onClick={goNext} aria-label={T('Keyingi')}><ChevronRight size={26} /></button>
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
  const myId = useMyMongoId();
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
    navigate(listingChatUrl(targetId, {
      id: provider?._id,
      type: 'serviceprovider',
      title: provider?.name,
      thumbnail: getImageUrl(provider?.media?.[0] || provider?.image || ''),
      price: provider?.price_range || '',
    }));
  };

  // Buyurtma — usta chaqirish oqimi, so'rov faqat shu ustaga yuboriladi
  const handleOrder = () => {
    if (!user) return navigate('/login');
    navigate(`/request?provider=${provider._id}`);
  };

  const isOwner = sameId(provider?.userId?._id || provider?.userId, myId);
  // Kirgan foydalanuvchining ID'si hali kelmagan bo'lsa egami-yo'qmi noma'lum —
  // tugmalar avval chiqib, keyin yo'qolib qolmasligi uchun kutamiz
  const ownerKnown = !user || Boolean(myId);
  const showVisitorActions = ownerKnown && !isOwner;

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

  // Standart rasm "rasm yo'q" hisoblanadi — galereya past banner ko'rinishida chiqadi
  const DEFAULT_IMAGE = '/images/service-providers/default.jpg';
  const images = provider.media?.length
    ? provider.media
    : provider.image && provider.image !== DEFAULT_IMAGE ? [provider.image] : [];

  const getProviderTypeLabel = (type) => {
    if (type === 'business') return t('serviceProvider.badgeBusiness');
    if (type === 'individual') return t('serviceProvider.badgeIndividual');
    return type || '';
  };

  const owner = provider.userId && typeof provider.userId === 'object' ? provider.userId : null;
  const ownerName = owner?.fullName || owner?.full_name || owner?.companyName || provider.company || '';
  const price = provider.price_range || T('Kelishiladi');
  // speciality ko'pincha kategoriya slug'i bilan bir xil ("santexnik") — bir marta, chiroyli nom bilan
  const categoryName = provider.service_category ? serviceLabel(provider.service_category) : '';
  const specialityName = provider.speciality && provider.speciality !== provider.service_category ? serviceLabel(provider.speciality) : '';
  const facts = [
    categoryName && { label: T('Kasb'), value: categoryName },
    specialityName && specialityName !== categoryName && { label: t('serviceProvider.speciality'), value: specialityName },
    provider.location?.address && { label: T('Manzil'), value: provider.location.address },
  ].filter(Boolean);

  // ===== RENDER =====
  return (
    <>
      <div className="dp-page">
        <div className="dp-layout">
          <main className="dp-main">
            <DetailGallery
              images={images}
              title={provider.name}
              onBack={() => safeGoBack(navigate)}
              onShare={user ? () => setShareOpen(true) : undefined}
              onOpen={images.length ? (i) => { setActiveImageIndex(i); setImageModalOpen(true); } : undefined}
            />

            {/* SARLAVHA, BAHO, NARX */}
            <section className="dp-card dp-head">
              {provider.company && <span className="dp-eyebrow">{provider.company}</span>}
              <h1 className="dp-title">{provider.name}</h1>
              <RatingLink type="service_provider" id={provider._id} title={provider.name} />
              <div className="dp-badges">
                {provider.is_top && <span className="dp-badge dp-badge--hot"><Flame size={13} /> {t('serviceProvider.badgeTop')}</span>}
                {provider.is_verified && <span className="dp-badge dp-badge--ok"><ShieldCheck size={13} /> {t('serviceProvider.badgeVerified')}</span>}
                {provider.provider_type && <span className="dp-badge"><User size={13} /> {getProviderTypeLabel(provider.provider_type)}</span>}
              </div>
              <div className="dp-price">
                <span>{t('serviceProvider.priceRange')}</span>
                <strong>{price}</strong>
              </div>
              <div className="dp-stats">
                <div><strong>{provider.completedJobs || 0}</strong><span>{T('bajarilgan ish')}</span></div>
                <div><strong>{provider.views || 0}</strong><span>{T('ko‘rishlar')}</span></div>
                <div><strong>{(provider.likes || []).length}</strong><span>{T('yoqtirgan')}</span></div>
              </div>
            </section>

            {/* XIZMAT HAQIDA */}
            <section className="dp-card">
              <h2 className="dp-card__title"><FileText size={18} /> {t('serviceProvider.about', 'Xizmat haqida')}</h2>
              <ClampText text={provider.description || t('serviceProvider.defaultDescription')} />
              {facts.length > 0 && (
                <dl className="dp-facts">
                  {facts.map((f) => (
                    <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
                  ))}
                </dl>
              )}
              {provider.serviceTags?.some((tag) => tag !== provider.service_category) && (
                <div className="dp-tags">
                  {provider.serviceTags.slice(0, 12).map((tag) => <span key={tag}><Tag size={12} /> {serviceLabel(tag)}</span>)}
                </div>
              )}
            </section>

            {/* USTA */}
            {(owner || provider.company) && (
              <section className="dp-card dp-owner">
                <Avatar className="dp-owner__avatar" src={owner?.avatar_url} name={ownerName} />
                <div className="dp-owner__text">
                  <span>{t('serviceProvider.owner')}</span>
                  <strong>{ownerName || t('serviceProvider.fullName')}</strong>
                </div>
                {owner?._id && (
                  <button type="button" className="dp-chip-btn" onClick={() => navigate(`/profile/${owner._id}`)}>
                    {T('Profil')} <ChevronRight size={15} />
                  </button>
                )}
              </section>
            )}

            {/* ALOQA */}
            <section className="dp-card">
              <h2 className="dp-card__title"><Phone size={18} /> {t('serviceProvider.contactTitle')}</h2>
              {provider.phone && (!showPhone ? (
                <button className="dp-phone-btn" onClick={() => setShowPhone(true)}>
                  <Phone size={16} /> {t('serviceProvider.showPhone')}
                </button>
              ) : (
                <a href={`tel:${provider.phone}`} className="dp-phone-btn dp-phone-btn--open">{provider.phone}</a>
              ))}
              {provider.email && <div className="dp-contact-line"><Mail size={15} /> {provider.email}</div>}
              {provider.website && (
                <div className="dp-contact-line">
                  <Globe size={15} />
                  <a href={provider.website} target="_blank" rel="noopener noreferrer">{provider.website}</a>
                </div>
              )}
            </section>

            {/* SHARHLAR */}
            <ReviewsSection type="service_provider" id={provider._id} title={provider.name} />


            {/* O'XSHASH XIZMATLAR */}
            {related.length > 0 && (
              <section className="dp-related">
                <h2 className="dp-card__title">{T('O‘xshash xizmatlar')}</h2>
                <div className="dp-related__row">
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
              </section>
            )}
          </main>

          {/* KOMPYUTERDA: O'NG USTUN */}
          <aside className="dp-aside">
            <div className="dp-card dp-aside__box">
              <span className="dp-aside__label">{t('serviceProvider.priceRange')}</span>
              <strong className="dp-aside__price">{price}</strong>
              {showVisitorActions && (
                <button type="button" className="dp-btn dp-btn--primary" onClick={handleOrder}>
                  <Send size={17} /> {T('Buyurtma berish')}
                </button>
              )}
              {showVisitorActions && (
                <button type="button" className="dp-btn dp-btn--ghost" onClick={handleChat}>
                  <MessageCircle size={17} /> {t('serviceProvider.chatWithOwner')}
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
        {isOwner && (
          <div className="dp-actionbar dp-actionbar--owner">
            <span className="dp-actionbar__owner-note">{T('Bu sizning xizmatingiz')}</span>
            <button type="button" className="dp-btn dp-btn--ghost" onClick={() => navigate(`/edit/service/${provider._id}`)}>
              <Pencil size={16} /> {T('Tahrirlash')}
            </button>
            <button type="button" className="dp-btn dp-btn--primary" onClick={() => navigate('/provider-requests')}>
              <Inbox size={16} /> {T('Buyurtmalar')}
            </button>
          </div>
        )}
        {showVisitorActions && (
          <div className="dp-actionbar">
            <button type="button" className="dp-btn dp-btn--icon" onClick={handleChat} aria-label={T('Yozish')}>
              <MessageCircle size={20} />
            </button>
            <button type="button" className="dp-btn dp-btn--primary" onClick={handleOrder}>
              <Send size={17} /> {T('Buyurtma berish')}
            </button>
          </div>
        )}
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
