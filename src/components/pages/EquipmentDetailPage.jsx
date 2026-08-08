import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEquipmentById, getEquipment } from '../services/equipment';
import { useAuth } from '../context/AuthContext';
import { getPosts } from '../services/videos';
import { getImageUrl } from '../utils/imageUrl';
import {
  MapPin, Phone, TrendingUp, ArrowLeft, ShieldCheck,
  Award, Briefcase, Calendar, Quote, X,
  Droplet, Thermometer, Sun, Wind, Wifi, Sprout, Gauge,
  Ruler, DollarSign, Eye, Building2, User, Zap, FileText, Settings,
  Hammer, Wrench, Megaphone, Package, QrCode,
  Banknote, CreditCard, CalendarDays, Calculator, Monitor,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MessageCircle, Crown, Lock, Star,
  Heart, Share2, Layers, DoorOpen, Lightbulb, Footprints, Play,
  Cpu, UtensilsCrossed, Sofa, Palette,
  Landmark, Maximize2
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';
import ReelsStrip from '../marketplace/MarketplaceReels';
import { likePost, commentPost } from '../services/videos';
import '../../styles/equipmentDetail.css';
import '../../styles/equipmentDetailAttrs.css';
import '../../styles/locationPage.css';
import CelebrityMotivationCard from '../common/CelebrityMotivationCard';
import { formatPrice } from '../utils/formatPrice';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

// ============================================================
// MAHSULOT TURI META (i18next bilan)
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
// 1. DOCUMENT MODAL
// ============================================================
const DocumentModal = ({ isOpen, onClose, title, docList, t }) => {
  if (!isOpen) return null;
  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal-content" onClick={e => e.stopPropagation()}>
        <div className="doc-modal-header">
          <h3><FileText size={18} /> {title}</h3>
          <button onClick={onClose} className="doc-modal-close"><X size={20} /></button>
        </div>
        <div className="doc-modal-body">
          {docList?.map((doc, idx) => (
            <div key={idx} className="doc-item">
              <ShieldCheck size={16} className={doc.required ? 'doc-required' : 'doc-optional'} />
              <span>{doc.name}</span>
              {doc.required && <span className="doc-badge">{t('equipment.badgeRequired')}</span>}
            </div>
          ))}
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
        <ArrowLeft size={18} /> {t('equipment.back')}
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
          src={getImageUrl(images[activeImageIndex])}
          alt={title}
          className="ImageViewerImg"
          decoding="async"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-equipment.jpg'; }}
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
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-equipment.jpg'; }}
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
const UserInfoCard = ({ user, t }) => {
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
      <h3 className="ModuleHeading"><User size={18} /> {t('equipment.owner')}</h3>
      <div className="user-info clickable" onClick={handleProfileClick}>
        <img src={avatarUrl} alt={user.full_name || user.email} className="user-avatar" onError={(e) => e.target.src = '/images/placeholder.jpg'} />
        <div className="user-details">
          <p><strong>{user.full_name || t('equipment.fullName')}</strong></p>
          <p className="user-email">{user.email}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 4. SERVICE BUTTONS
// ============================================================
const ServiceButtons = ({ t }) => {
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

  return (
    <div className="services-buttons-section">
      <h3 className="ModuleHeading">{t('equipment.services')}</h3>
      <div className="services-buttons-vertical">
        {visible.map(service => {
          const Icon = service.icon;
          return (
            <button
              key={service.slug}
              className="service-btn-vertical"
              onClick={() => navigate(`/services/${service.slug}`)}
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
          {showAll ? ` ${t('equipment.showLess')}` : ` ${t('equipment.showMore')}`}
        </button>
      )}
    </div>
  );
};

// ============================================================
// 5. ANALYTICS CARD
// ============================================================
const AnalyticsCard = ({ trafficData, chartOptions, t }) => {
  return (
    <div className="AnalyticsCard">
      <h3 className="CardSmallTitle"><TrendingUp size={15} /> {t('equipment.analyticsTitle')}</h3>
      <div className="ChartWrapper"><Line data={trafficData} options={chartOptions} /></div>
    </div>
  );
};

// ============================================================
// 6. MAIN COMPONENT – EquipmentDetailPage
// ============================================================
export default function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, title: '', docList: [] });
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const isOwner = equipment?.userId?._id === user?.id || user?.email === 'xoshimovabdullox95@gmail.com';

  const handleChat = () => {
    const targetId = equipment?.userId?._id || equipment?.userId;
    if (!targetId) {
      alert('Bu eʼlon egasi haqida maʼlumot yo‘q');
      return;
    }
    navigate(`/chat?userId=${targetId}`);
  };

  const openDocModal = (title, docList) => {
    setModal({ open: true, title, docList });
  };

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
      } catch (err) {
        console.error('Xatolik:', err);
        setError(t('equipment.error'));
        setEquipment(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, t]);

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
              title: equipment.title || 'Video',
              typeLabel: 'Texnika',
              link: `/equipment/${equipment._id}`,
              userId: equipment.userId?._id || equipment.userId,
              userName: equipment.userId?.full_name || 'Foydalanuvchi',
              avatarUrl: equipment.userId?.avatar_url || '',
              likesCount: equipment.likes?.length || 0,
              liked: equipment.likes?.some(id => id.toString() === user?.id?.toString()) || false,
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
                title: post.title || 'Video',
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
  }, [equipment, user]);

  const trafficData = {
    labels: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun'],
    datasets: [{
      label: 'Murojaatlar',
      data: [8, 15, 22, 28, 35, 42],
      fill: true,
      backgroundColor: 'rgba(0,150,255,0.12)',
      borderColor: '#0096ff',
      tension: 0.4
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#4d7a9a' }, grid: { color: 'rgba(0,130,255,0.08)' } },
      y: { ticks: { color: '#4d7a9a' }, grid: { color: 'rgba(0,130,255,0.08)' } }
    }
  };

  if (loading) return <div className="StatusScreen">{t('equipment.loading')}</div>;
  if (error || !equipment) {
    return (
      <div className="StatusScreen Error">
        <h2>⚠️ {t('equipment.error')}</h2>
        <p>{error || t('equipment.notFound')}</p>
        <button onClick={() => navigate(-1)} className="BackActionBtn">
          <ArrowLeft size={16} /> {t('equipment.back')}
        </button>
      </div>
    );
  }

  const images = equipment?.images?.length > 0
    ? equipment.images
    : ['/images/placeholder-equipment.jpg'];

  const specs = equipment.technical_specs || {};
  const hasLegacySpecs = !!(specs.power || specs.frequency || specs.requirements);
  const attributeItems = buildAttributeItems(equipment.productType, equipment.attributes || {}, t);
  const productTypeMeta = getProductTypeMeta(equipment.productType, t);

  return (
    <div className="EquipmentPageWrapper">
      <div className="MainViewport">
        <button className="BackActionBtn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> {t('equipment.back')}
        </button>

        {/* ===== YANGI GALEREYA (getImageUrl qo'llanildi) ===== */}
        <div className="equipment-gallery">
          <div className="equipment-gallery-main" onClick={() => setImageModalOpen(true)}>
           <img
  src={getImageUrl(images[activeImageIndex])}
  alt={title}
  className="ImageViewerImg"
  decoding="async"
  onClick={(e) => e.stopPropagation()}
  onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-equipment.jpg'; }}
/>
            <div className="image-gallery-zoom-hint">
              <Maximize2 size={14} /> {t('equipment.viewFull') || "Kattalashtirib ko'rish"}
            </div>
          </div>
          {images.length > 1 && (
            <div className="equipment-gallery-thumbs">
              {images.map((img, idx) => (
  <button
    key={idx}
    className={`ImageViewerThumb ${idx === activeIndex ? 'active' : ''}`}
    onClick={() => setActiveIndex(idx)}
  >
    <img
      src={getImageUrl(img)}
      alt={`thumb-${idx}`}
      onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-equipment.jpg'; }}
    />
  </button>
))}
            </div>
          )}
        </div>

        <div className="LayoutGrid">
          <div className="InformationContent">
            <div className="DetailsModule">
              <h2 className="ModuleHeading">{equipment.title}</h2>
              <p className="ModuleText">{equipment.description || t('equipment.defaultDescription')}</p>
              <div className="equipment-meta">
                <span className="meta-badge"><Settings size={14} /> {equipment.condition === 'new' ? t('equipment.conditionNew') : t('equipment.conditionUsed')}</span>
                {equipment.attributes?.powerConsumption ? (
                  <span className="meta-badge"><Zap size={14} /> {equipment.attributes.powerConsumption} {t('equipment.unitWatt')}</span>
                ) : (
                  <span className="meta-badge"><Zap size={14} /> {specs.power || t('equipment.unknown')}</span>
                )}
                <span className="meta-badge"><Ruler size={14} /> {equipment.category}</span>
              </div>
            </div>

            <CelebrityMotivationCard category={equipment.level1} />

            {attributeItems.length > 0 && productTypeMeta && (
              <div className="eqattr-module">
                <h3 className="ModuleHeading">
                  <productTypeMeta.icon size={18} /> {productTypeMeta.label}
                </h3>
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
              </div>
            )}

            {hasLegacySpecs && (
              <div className="SpecsModule">
                <h3 className="ModuleHeading"><Settings size={18} /> {t('equipment.specsTitle')}</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">{t('equipment.specPower')}</span>
                    <span className="spec-value">{specs.power || '—'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">{t('equipment.specFrequency')}</span>
                    <span className="spec-value">{specs.frequency || '—'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">{t('equipment.specRequirements')}</span>
                    <span className="spec-value">{specs.requirements || t('equipment.specNone')}</span>
                  </div>
                </div>
              </div>
            )}

            {equipment.documents?.length > 0 && (
              <div className="CertificatesModule">
                <h3 className="ModuleHeading"><FileText size={18} /> {t('equipment.certificatesTitle')}</h3>
                <div className="BadgeCloud">
                  {equipment.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="VerificationBadge"
                    >
                      <ShieldCheck size={13} /> {doc.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {equipment.userId && <UserInfoCard user={equipment.userId} t={t} />}

            <ServiceButtons t={t} />
          </div>

          <div className="ActionSidebar">
            <div className="PriceIndicatorCard">
              <span className="PriceTagLabel">{t('equipment.price')}</span>
              <span className="PriceTagValue">{formatPrice(equipment.price, equipment.currency)}</span>
            </div>

            <div className="ContactSurface">
              <h3 className="CardSmallTitle"><Phone size={15} /> {t('equipment.contact')}</h3>
              <a href={`tel:${equipment.phone}`} className="DirectPhoneLink">{equipment.phone}</a>
              <p className="supplier-contact">{equipment.supplier || t('equipment.supplierNotAvailable')}</p>
            </div>

            <AnalyticsCard trafficData={trafficData} chartOptions={chartOptions} t={t} />

            <div className="chat-with-owner">
              <button onClick={handleChat} className="chat-owner-btn">
                <MessageCircle size={18} /> {t('equipment.chatWithOwner')}
              </button>
            </div>

            <div className="ContactSurface">
              <h3 className="ModuleHeading"><Building2 size={18} /> {t('equipment.supplier')}</h3>
              <p className="supplier-name">{equipment.supplier || t('equipment.supplierUnknown')}</p>
              <div className="AddressLine"><Phone size={15} /> {equipment.phone || '—'}</div>
            </div>

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
                    setReels(prev => prev.map(r =>
                      r.id === reelId ? { ...r, likesCount: res.data.likesCount, liked: res.data.liked } : r
                    ));
                  } catch (err) {
                    console.error('Like xatoligi:', err);
                  }
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
                    setReels(prev => prev.map(r =>
                      r.id === reelId ? { ...r, comments: [...(r.comments || []), newComment] } : r
                    ));
                  } catch (err) {
                    console.error('Comment xatoligi:', err);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      <DocumentModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, title: '', docList: [] })}
        title={modal.title}
        docList={modal.docList}
        t={t}
      />

      <ImageViewerModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={images}
        activeIndex={activeImageIndex}
        setActiveIndex={setActiveImageIndex}
        title={equipment.title}
      />
    </div>
  );
}