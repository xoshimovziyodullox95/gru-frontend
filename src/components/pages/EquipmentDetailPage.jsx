import { safeGoBack } from '../utils/navigation.js';
import { recordRecentlyViewed } from '../utils/recentlyViewed.js';
import { listingChatUrl } from '../utils/listingChatUrl.js';
import useBodyScrollLock from '../../hooks/useBodyScrollLock.js';
import ShareSheet from '../common/ShareSheet.jsx';
// src/pages/EquipmentDetailPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEquipmentById } from '../services/equipment';
import { useAuth } from '../context/AuthContext';
import { useMyMongoId, sameId } from '../hooks/useMyMongoId';
import { useCart } from '../hooks/useCart';
import { getPosts } from '../services/videos';
import { getImageUrl } from '../utils/imageUrl';
import {
  Phone, ArrowLeft, ShieldCheck,
  Award, Calendar, X,
  Ruler, Building2, User, Zap, FileText, Settings,
  Package, CalendarDays,
  ChevronLeft, ChevronRight, MessageCircle,
  Share2, Layers,
  Cpu, UtensilsCrossed, Sofa, Palette,
  ShoppingCart, Check
} from 'lucide-react';
import ReelsStrip from '../marketplace/MarketplaceReels';
import EquipmentRelatedListings from '../marketplace/EquipmentRelatedListings.jsx';
import { likePost, commentPost } from '../services/videos';
import '../../styles/equipmentDetail.css';
import '../../styles/equipmentDetailAttrs.css';
import '../../styles/locationPage.css';
import { formatPrice } from '../utils/formatPrice';
import DetailGallery from '../detail/DetailGallery';
import RatingLink from '../detail/RatingLink';
import ClampText from '../detail/ClampText';
import Avatar from '../detail/Avatar';
import ReviewsSection from '../reviews/ReviewsSection';
import '../../styles/detailModern.css';

import { T } from '../utils/T';

// ============================================================
// MAHSULOT TURI META
// ============================================================
const getProductTypeMeta = (type, t) => {
  const mapping = {
    texnika: { label: t('equipment.productTypes.texnika'), icon: Cpu },
    oziqovqat: { label: t('equipment.productTypes.oziqovqat'), icon: UtensilsCrossed },
    mebel: { label: t('equipment.productTypes.mebel'), icon: Sofa },
    boshqa: { label: t('equipment.productTypes.boshqa'), icon: Package },
  };
  return mapping[type] || mapping.boshqa;
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildAttributeItems(productType, attrs = {}, t) {
  const items = [];
  if (productType === 'texnika') {
    if (attrs.brand) items.push({ label: t('equipment.attributes.brand'), icon: Award, value: attrs.brand });
    if (attrs.powerConsumption) items.push({ label: t('equipment.attributes.powerConsumption'), icon: Zap, value: `${attrs.powerConsumption} ${t('equipment.unitWatt')}` });
    if (attrs.warrantyMonths) items.push({ label: t('equipment.attributes.warrantyMonths'), icon: ShieldCheck, value: `${attrs.warrantyMonths} ${t('equipment.unitMonth')}` });
    if (attrs.usageDuration) items.push({ label: t('equipment.attributes.usageDuration'), icon: Calendar, value: attrs.usageDuration });
  } else if (productType === 'oziqovqat') {
    if (attrs.amount) items.push({ label: t('equipment.attributes.amount'), icon: Package, value: `${attrs.amount} ${attrs.unit || ''}`.trim() });
    if (attrs.expiryDate) items.push({ label: t('equipment.attributes.expiryDate'), icon: CalendarDays, value: formatDate(attrs.expiryDate) });
    if (attrs.manufacturer) items.push({ label: t('equipment.attributes.manufacturer'), icon: Building2, value: attrs.manufacturer });
  } else if (productType === 'mebel') {
    if (attrs.length && attrs.width && attrs.height) {
      items.push({ label: t('equipment.attributes.dimensions'), icon: Ruler, value: `${attrs.length} × ${attrs.width} × ${attrs.height} ${t('equipment.unitCm')}` });
    }
    if (attrs.material) items.push({ label: t('equipment.attributes.material'), icon: Layers, value: attrs.material });
    if (attrs.color) items.push({ label: t('equipment.attributes.color'), icon: Palette, value: attrs.color });
  }
  return items;
}

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
          decoding="async"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/zumo-placeholder.svg'; }}
        />
      </div>
      {images.length > 1 && (
        <div className="ImageViewerThumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((img, idx) => {
            const thumbSrc = getImageUrl(img) || '/images/zumo-placeholder.svg';
            return (
              <button key={idx} className={`ImageViewerThumb ${idx === activeIndex ? 'active' : ''}`} onClick={() => setActiveIndex(idx)}>
                <img src={thumbSrc} alt={`thumb-${idx}`} onError={(e) => { e.target.onerror = null; e.target.src = '/images/zumo-placeholder.svg'; }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// ASOSIY KOMPONENT
// ============================================================
export default function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const myId = useMyMongoId();
  const { getQuantity, increment, removeItem } = useCart();
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // ===== SAVAT =====
  const isStoreProduct = equipment?.saleMode !== 'classified';
  const inCart = equipment && isStoreProduct ? getQuantity(equipment._id) > 0 : false;

  const handleCartClick = () => {
    if (!equipment || !isStoreProduct) return;
    if (inCart) {
      removeItem(equipment._id);
    } else {
      increment({
        id: equipment._id,
        title: equipment.title,
        price: equipment.price,
        currency: equipment.currency,
        itemType: 'equipment',
        type: 'equipment',
        image: equipment.images?.[0] ? getImageUrl(equipment.images[0]) : '/images/zumo-placeholder.svg',
      });
    }
  };

  const handleChat = () => {
    const targetId = equipment?.userId?._id || equipment?.userId;
    if (!targetId) {
      alert(T('Bu e’lon egasi haqida ma’lumot yo‘q'));
      return;
    }
    navigate(listingChatUrl(targetId, {
      id: equipment?._id,
      type: 'equipment',
      title: equipment?.title,
      thumbnail: equipment?.images?.[0] ? getImageUrl(equipment.images[0]) : '',
      price: equipment ? formatPrice(equipment.price, equipment.currency) : '',
    }));
  };

  // ===== MA'LUMOTLARNI YUKLASH =====
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getEquipmentById(id);
        if (!res.data) {
          setError(t('equipment.notFound'));
          setLoading(false);
          return;
        }
        setEquipment(res.data);
        recordRecentlyViewed(user?._id || user?.id, {
          id: res.data._id || id,
          type: 'equipment',
          title: res.data.title || res.data.name || T('E’lon'),
          image: res.data.images?.[0] || res.data.image || res.data.imageUrl || '',
          price: res.data.price,
          currency: res.data.currency,
          link: `/equipment/${res.data._id || id}`,
          maxQuantity: res.data.stockQuantity,
          saleMode: res.data.saleMode,
        });
      } catch (err) {
        console.error('Xatolik:', err);
        setError(t('equipment.error'));
        setEquipment(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, t, user]);

  // ===== REELS =====
  useEffect(() => {
    if (!equipment) return;
    const fetchReels = async () => {
      try {
        setReelsLoading(true);
        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        let allReels = [];

        const mediaFiles = equipment.media || [];
        mediaFiles
          .filter(url => url && typeof url === 'string' && videoExtensions.some(ext => url.toLowerCase().endsWith(ext)))
          .forEach((url, idx) => {
            allReels.push({
              id: `eq-${equipment._id}-${idx}`,
              originalId: equipment._id,
              videoUrl: url,
              title: equipment.title || T('Video'),
              typeLabel: 'Texnika',
              link: `/equipment/${equipment._id}`,
              userId: equipment.userId?._id || equipment.userId,
              userName: equipment.userId?.full_name || 'Foydalanuvchi',
              avatarUrl: equipment.userId?.avatar_url || '',
              likesCount: equipment.likes?.length || 0,
              liked: equipment.likes?.some(id => sameId(id, myId)) || false,
              disliked: false,
              comments: (equipment.comments || []).map(c => ({
                id: c._id,
                userId: c.userId,
                userName: c.userId?.full_name || 'User',
                text: c.text,
                createdAt: c.createdAt,
                replies: (c.replies || []).map(r => ({
                  id: r._id,
                  userId: r.userId,
                  userName: r.userId?.full_name || 'User',
                  text: r.text,
                  createdAt: r.createdAt,
                  avatarUrl: r.userId?.avatar_url || ''
                })),
                avatarUrl: c.userId?.avatar_url || ''
              })),
              itemType: 'equipment',
            });
          });

        try {
          const postsRes = await getPosts({ relatedId: equipment._id, relatedType: 'equipment' });
          const postVideos = (postsRes.data || [])
            .filter(post => post.videoUrl)
            .map(post => {
              const isLiked = post.likes?.some(id => {
                const userIdStr = user?.id?.toString();
                const likeIdStr = id?.toString();
                return userIdStr && likeIdStr && userIdStr === likeIdStr;
              }) || false;

              return {
                id: `post-${post._id}`,
                originalId: post._id,
                videoUrl: post.videoUrl,
                title: post.title || T('Video'),
                typeLabel: 'Post',
                link: `/posts/${post._id}`,
                userId: post.userId?._id || post.userId,
                userName: post.userId?.full_name || 'Foydalanuvchi',
                avatarUrl: post.userId?.avatar_url || '',
                likesCount: post.likes?.length || 0,
                liked: isLiked,
                disliked: false,
                comments: (post.comments || []).map(c => ({
                  id: c._id,
                  userId: c.userId,
                  userName: c.userId?.full_name || 'User',
                  text: c.text,
                  createdAt: c.createdAt,
                  replies: (c.replies || []).map(r => ({
                    id: r._id,
                    userId: r.userId,
                    userName: r.userId?.full_name || 'User',
                    text: r.text,
                    createdAt: r.createdAt,
                    avatarUrl: r.userId?.avatar_url || ''
                  })),
                  avatarUrl: c.userId?.avatar_url || ''
                })),
                itemType: 'post',
              };
            });
          allReels.push(...postVideos);
        } catch (err) {
          console.error('Post videolarini olishda xatolik:', err);
        }

        setReels(allReels);
      } catch (err) {
        console.error('Reels yuklashda xatolik:', err);
        setReels([]);
      } finally {
        setReelsLoading(false);
      }
    };

    fetchReels();
  }, [equipment, user, myId]);

  if (loading) return <div className="StatusScreen">{t('equipment.loading')}</div>;
  if (error || !equipment) {
    return (
      <>
        <div className="StatusScreen Error">
          <h2>⚠️ {t('equipment.error')}</h2>
          <p>{error || t('equipment.notFound')}</p>
          <button onClick={() => safeGoBack(navigate)} className="BackActionBtn">
            <ArrowLeft size={16} /> {t('equipment.back')}
          </button>
        </div>
      </>
    );
  }

  const images = equipment?.images?.length > 0
    ? equipment.images
    : ['/images/zumo-placeholder.svg'];

  const specs = equipment.technical_specs || {};
  const hasLegacySpecs = !!(specs.power || specs.frequency || specs.requirements);
  const attributeItems = buildAttributeItems(equipment.productType, equipment.attributes || {}, t);
  const productTypeMeta = getProductTypeMeta(equipment.productType, t);

  const owner = equipment.userId && typeof equipment.userId === 'object' ? equipment.userId : null;
  const ownerName = owner?.fullName || owner?.full_name || owner?.companyName || equipment.supplier || '';
  const isOwner = sameId(owner?._id || equipment.userId, myId);
  const priceText = formatPrice(equipment.price, equipment.currency);
  const facts = [
    { label: T('Holati'), value: equipment.condition === 'new' ? t('equipment.conditionNew') : t('equipment.conditionUsed') },
    equipment.category && { label: T('Bo‘lim'), value: equipment.category },
    equipment.supplier && { label: t('equipment.supplier'), value: equipment.supplier },
  ].filter(Boolean);

  return (
    <>
      <div className="dp-page">
        <div className="dp-layout">
          <main className="dp-main">
            <DetailGallery
              images={images}
              title={equipment.title}
              contain
              onBack={() => safeGoBack(navigate)}
              onShare={user ? () => setShareOpen(true) : undefined}
              onOpen={(i) => { setActiveImageIndex(i); setImageModalOpen(true); }}
            />

            {/* SARLAVHA, BAHO, NARX */}
            <section className="dp-card dp-head">
              <h1 className="dp-title">{equipment.title}</h1>
              {isStoreProduct && <RatingLink type="equipment" id={equipment._id} title={equipment.title} />}
              <div className="dp-price">
                <strong>{priceText}</strong>
                {equipment.attributes?.negotiable && <span>{T('Narxi kelishiladi')}</span>}
              </div>
              <div className="dp-badges">
                <span className={`dp-badge ${equipment.condition === 'new' ? 'dp-badge--ok' : ''}`}>
                  <Settings size={13} /> {equipment.condition === 'new' ? t('equipment.conditionNew') : t('equipment.conditionUsed')}
                </span>
                {isStoreProduct ? (
                  <span className="dp-badge"><Building2 size={13} /> {T('Do‘kon')}</span>
                ) : (
                  <span className="dp-badge"><User size={13} /> {T('Shaxsiy e’lon')}</span>
                )}
                {equipment.attributes?.powerConsumption ? (
                  <span className="dp-badge"><Zap size={13} /> {equipment.attributes.powerConsumption} {t('equipment.unitWatt')}</span>
                ) : specs.power ? (
                  <span className="dp-badge"><Zap size={13} /> {specs.power}</span>
                ) : null}
              </div>
              {!isStoreProduct && <p className="dp-note">{T('Bu oddiy e’lon. Narxni sotuvchi bilan kelishing.')}</p>}
            </section>

            {/* TAVSIF */}
            <section className="dp-card">
              <h2 className="dp-card__title"><FileText size={18} /> {T('Tavsif')}</h2>
              <ClampText text={equipment.description || t('equipment.defaultDescription')} />
              <dl className="dp-facts">
                {facts.map((f) => (
                  <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
                ))}
              </dl>
            </section>

            {/* XUSUSIYATLAR */}
            {attributeItems.length > 0 && productTypeMeta && (
              <section className="dp-card">
                <h2 className="dp-card__title"><productTypeMeta.icon size={18} /> {productTypeMeta.label}</h2>
                <div className="eqattr-grid">
                  {attributeItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div className="eqattr-item" key={idx}>
                        <span className="eqattr-icon"><Icon size={16} /></span>
                        <div className="eqattr-text">
                          <span className="eqattr-label">{item.label}</span>
                          <strong className="eqattr-value">{item.value}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {hasLegacySpecs && (
              <section className="dp-card">
                <h2 className="dp-card__title"><Settings size={18} /> {t('equipment.specsTitle')}</h2>
                <dl className="dp-facts">
                  <div><dt>{t('equipment.specPower')}</dt><dd>{specs.power || '—'}</dd></div>
                  <div><dt>{t('equipment.specFrequency')}</dt><dd>{specs.frequency || '—'}</dd></div>
                  <div><dt>{t('equipment.specRequirements')}</dt><dd>{specs.requirements || t('equipment.specNone')}</dd></div>
                </dl>
              </section>
            )}

            {equipment.documents?.length > 0 && (
              <section className="dp-card">
                <h2 className="dp-card__title"><ShieldCheck size={18} /> {t('equipment.certificatesTitle')}</h2>
                <div className="dp-tags">
                  {equipment.documents.map((doc, idx) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer"><FileText size={12} /> {doc.name}</a>
                  ))}
                </div>
              </section>
            )}

            {/* SOTUVCHI */}
            {(owner || equipment.supplier) && (
              <section className="dp-card dp-owner">
                <Avatar className="dp-owner__avatar" src={owner?.avatar_url} name={ownerName} />
                <div className="dp-owner__text">
                  <span>{T('Sotuvchi')}</span>
                  <strong>{ownerName || t('equipment.fullName')}</strong>
                </div>
                {owner?._id && (
                  <button type="button" className="dp-chip-btn" onClick={() => navigate(`/profile/${owner._id}`)}>
                    {T('Profil')} <ChevronRight size={15} />
                  </button>
                )}
              </section>
            )}

            {/* ALOQA */}
            {equipment.phone && (
              <section className="dp-card">
                <h2 className="dp-card__title"><Phone size={18} /> {t('equipment.contact')}</h2>
                <a href={`tel:${equipment.phone}`} className="dp-phone-btn dp-phone-btn--open">{equipment.phone}</a>
              </section>
            )}

            {/* SHARHLAR — faqat do'kon tovarlarida (b/u yakka e'lonlarda yo'q) */}
            {isStoreProduct && <ReviewsSection type="equipment" id={equipment._id} title={equipment.title} />}

            {reels.length > 0 && !reelsLoading && (
              <ReelsStrip
                reels={reels}
                showHeader={true}
                showProfileLink={true}
                emptyText={t('equipment.noVideos')}
                onLike={async (reelId) => {
                  try {
                    const reel = reels.find(r => r.id === reelId);
                    if (!reel) return;
                    const res = await likePost(reel.originalId);
                    setReels(prev => prev.map(r => r.id === reelId ? { ...r, likesCount: res.data.likesCount, liked: res.data.liked } : r));
                  } catch (err) { console.error('Like xatoligi:', err); }
                }}
                onComment={async (reelId, text) => {
                  try {
                    const reel = reels.find(r => r.id === reelId);
                    if (!reel) return;
                    const res = await commentPost(reel.originalId, { text });
                    const newComment = {
                      id: res.data._id,
                      userId: res.data.userId,
                      userName: user?.full_name || 'Siz',
                      text: res.data.text,
                      createdAt: res.data.createdAt,
                      replies: [],
                      avatarUrl: user?.avatar_url || ''
                    };
                    setReels(prev => prev.map(r => r.id === reelId ? { ...r, comments: [...(r.comments || []), newComment] } : r));
                  } catch (err) { console.error('Comment xatoligi:', err); }
                }}
              />
            )}

          </main>

          {/* KOMPYUTERDA: O'NG USTUN */}
          <aside className="dp-aside">
            <div className="dp-card dp-aside__box">
              <span className="dp-aside__label">{t('equipment.price')}</span>
              <strong className="dp-aside__price">{priceText}</strong>
              {isStoreProduct && !isOwner && (
                <button type="button" className={`dp-btn ${inCart ? 'dp-btn--done' : 'dp-btn--primary'}`} onClick={handleCartClick}>
                  {inCart ? <><Check size={17} /> {t('equipment.inCart') || T('Savatda')}</> : <><ShoppingCart size={17} /> {t('equipment.addToCart') || T('Savatga qo‘shish')}</>}
                </button>
              )}
              {!isOwner && (
                <button type="button" className="dp-btn dp-btn--ghost" onClick={handleChat}>
                  <MessageCircle size={17} /> {t('equipment.chatWithOwner')}
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

        <EquipmentRelatedListings currentId={equipment._id} />

        {/* TELEFONDA: PASTKI PANEL */}
        {!isOwner && (
          <div className="dp-actionbar">
            {isStoreProduct ? (
              <>
                <div className="dp-actionbar__price">
                  <span>{t('equipment.price')}</span>
                  <strong>{priceText}</strong>
                </div>
                <button type="button" className={`dp-btn ${inCart ? 'dp-btn--done' : 'dp-btn--primary'}`} onClick={handleCartClick}>
                  {inCart ? <><Check size={17} /> {T('Savatda')}</> : <><ShoppingCart size={17} /> {T('Savatga')}</>}
                </button>
              </>
            ) : (
              <>
                {equipment.phone ? (
                  <>
                    <button type="button" className="dp-btn dp-btn--icon" onClick={handleChat} aria-label={T('Yozish')}>
                      <MessageCircle size={20} />
                    </button>
                    <a className="dp-btn dp-btn--primary" href={`tel:${equipment.phone}`}><Phone size={17} /> {T('Qo‘ng‘iroq qilish')}</a>
                  </>
                ) : (
                  <button type="button" className="dp-btn dp-btn--primary" onClick={handleChat}><MessageCircle size={17} /> {T('Sotuvchiga yozish')}</button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <ImageViewerModal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} images={images} activeIndex={activeImageIndex} setActiveIndex={setActiveImageIndex} title={equipment.title} />
      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        listing={{
          id: equipment._id,
          title: equipment.title,
          link: `/equipment/${equipment._id}`,
          listingType: 'equipment',
          thumbnailUrl: equipment.images?.[0] ? getImageUrl(equipment.images[0]) : '',
          price: formatPrice(equipment.price, equipment.currency),
        }}
      />
    </>
  );
}
