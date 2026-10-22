/* ============================================================
   ZUMO HOME PAGE
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  ArrowRight,
  Boxes,
  Briefcase,
  Crown,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  PartyPopper,
  ShoppingBag,
  Sprout,
  Store,
  UtensilsCrossed,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import CategoryCard from '../common/CategoryCard';
import MarketplaceReels from '../marketplace/MarketplaceReels';
import ZumoQuickMenu from '../common/ZumoQuickMenu.jsx';
import HomeListingCarousel from '../home/HomeListingCarousel.jsx';
import { useFavorites } from '../hooks/useFavorites';

import { getLevel1 } from '../services/categories';
import { getPosts } from '../services/videos';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';
import { getRecentlyViewed } from '../utils/recentlyViewed.js';

import '../../styles/home.css';

/* ============================================================
   CONSTANTS
   ============================================================ */

const CATEGORY_META = {
  Agro: { icon: Sprout, colors: ['#2fd576', '#0a9a52'] },
  'Restoran/Kafe': { icon: UtensilsCrossed, colors: ['#ff5c7a', '#e0264f'] },
  Klinika: { icon: HeartPulse, colors: ['#4b8dff', '#2a4fe0'] },
  Service: { icon: Wrench, colors: ['#22d3c5', '#0a8f8a'] },
  "Ta'lim": { icon: GraduationCap, colors: ['#a78bfa', '#6d3fe0'] },
  "Do'konlar": { icon: Store, colors: ['#ff8a2a', '#e8500a'] },
  "Ko'ngilochar": { icon: PartyPopper, colors: ['#ff5fc4', '#c21fa0'] },
  'Yangi biznes': { icon: Lightbulb, colors: ['#ffe14d', '#f5a300'] },
};

const FALLBACK_COLORS = [
  ['#7c86ff', '#4a3fe0'],
  ['#a3e635', '#5fa30f'],
  ['#38bdf8', '#0369a1'],
  ['#94a3b8', '#475569'],
];

const VISIBLE_CATEGORIES_COUNT = 8;

const FALLBACK_HERO_PHRASES = [
  'bilan oson',
  'yangi imkoniyat',
  'kelajak sari',
];

const REEL_SOURCES = [
  {
    key: 'locations',
    itemType: 'location',
    labelKey: 'marketplace.reels.location',
    labelFallback: 'Joy',
    getLink: (id) => `/location/${id}`,
    avatarColor: '00C8F8',
  },
  {
    key: 'equipment',
    itemType: 'equipment',
    labelKey: 'marketplace.reels.equipment',
    labelFallback: 'Jihoz',
    getLink: (id) => `/equipment/${id}`,
    avatarColor: 'F59E0B',
  },
  {
    key: 'services',
    itemType: 'service',
    labelKey: 'marketplace.reels.service',
    labelFallback: 'Xizmat',
    getLink: (id) => `/service-provider/${id}`,
    avatarColor: '008FC7',
  },
  {
    key: 'posts',
    itemType: 'post',
    labelKey: 'marketplace.reels.post',
    labelFallback: 'Post',
    getLink: (id) => `/posts/${id}`,
    avatarColor: '00C8F8',
  },
];

const EMPTY_CONTENT = { locations: [], equipment: [], services: [], posts: [] };
const pendingHomeReads = new Map();

function shareHomeRead(key, startRequest) {
  const existing = pendingHomeReads.get(key);
  if (existing) return existing;

  const request = Promise.resolve().then(startRequest);
  pendingHomeReads.set(key, request);
  const clear = () => {
    if (pendingHomeReads.get(key) === request) pendingHomeReads.delete(key);
  };
  request.then(clear, clear);
  return request;
}

function normalizeHomeListings(content) {
  const getId = (item) => item?._id || item?.id;
  const locations = content.locations.map((item) => {
    const id = getId(item);
    if (!id) return null;
    return {
      id: String(id), type: 'location', title: item.title || item.name || 'Joy',
      image: item.images?.[0] || item.image || item.imageUrl || '/images/placeholder.jpg',
      price: item.price_range || (item.price_per_month ? `${item.price_per_month} ${item.currency || "so'm"}/oy` : 'Narx so‘rov asosida'),
      link: `/location/${id}`, createdAt: item.createdAt || item.created_at,
      lat: item.lat == null ? null : Number(item.lat),
      lng: item.lng == null ? null : Number(item.lng),
      address: item.address || '',
    };
  });
  const equipment = content.equipment.map((item) => {
    const id = getId(item);
    if (!id) return null;
    return {
      id: String(id), type: 'equipment', title: item.title || item.name || 'Tovar',
      image: item.images?.[0] || item.image || item.imageUrl || '/images/placeholder-equipment.jpg',
      price: item.price ?? 'Narx so‘rov asosida', currency: item.currency,
      link: `/equipment/${id}`, createdAt: item.createdAt || item.created_at,
      isTop: Boolean(item.isTop || item.is_top), isVerified: Boolean(item.isVerified || item.is_verified),
      maxQuantity: item.stockQuantity,
    };
  });
  const services = content.services.map((item) => {
    const id = getId(item);
    if (!id) return null;
    return {
      id: String(id), type: 'service', title: item.name || item.title || 'Xizmat',
      image: item.image || item.images?.[0] || item.imageUrl || '/images/service-providers/default.jpg',
      price: item.price_range || item.price || 'Narx so‘rov asosida',
      link: `/service-provider/${id}`, createdAt: item.createdAt || item.created_at,
      isTop: Boolean(item.is_top), isVerified: Boolean(item.is_verified),
    };
  });
  return [...locations, ...equipment, ...services]
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function distanceBetweenKm(from, to) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

/* ============================================================
   HELPERS
   ============================================================ */

function getResponseArray(response) {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.items,
    response?.data?.items,
    response?.results,
    response?.data?.results,
  ];

  return candidates.find(Array.isArray) || [];
}

function isTranslationKey(value) {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(value.trim())
  );
}

function getTranslatedLabel(t, key, fallback) {
  const translated = t(key, { defaultValue: fallback });

  if (
    typeof translated !== 'string' ||
    !translated.trim() ||
    isTranslationKey(translated)
  ) {
    return fallback;
  }

  return translated;
}

function isVideoUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;

  const value = url.toLowerCase();

  return (
    /\.(mp4|webm|mov|avi|m3u8|mkv)(\?.*)?$/.test(value) ||
    value.includes('/video/upload/')
  );
}

function getOwnerName(owner) {
  return (
    owner?.fullName ||
    owner?.full_name ||
    owner?.name ||
    owner?.email ||
    'Foydalanuvchi'
  );
}

function getAvatar(owner, name, color = '00C8F8') {
  return (
    owner?.avatar_url ||
    owner?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=${color}&color=fff&rounded=true&size=60`
  );
}

function formatComments(comments) {
  if (!Array.isArray(comments)) return [];

  const mapOne = (entry, fallbackId) => {
    const name = getOwnerName(entry?.userId);

    return {
      id: entry?._id || entry?.id || fallbackId,
      userName: name,
      avatarUrl:
        entry?.userId?.avatar_url ||
        entry?.userId?.avatarUrl ||
        '/images/placeholder.jpg',
      text: entry?.text || '',
    };
  };

  return comments.map((comment, i) => ({
    ...mapOne(comment, `comment-${i}`),
    replies: Array.isArray(comment?.replies)
      ? comment.replies.map((reply, j) => mapOne(reply, `reply-${i}-${j}`))
      : [],
  }));
}

/* ============================================================
   BUILDERS
   ============================================================ */

function buildReels(items, source, currentUserId, t) {
  if (!Array.isArray(items)) return [];

  const typeLabel = getTranslatedLabel(
    t,
    source.labelKey,
    source.labelFallback
  );

  return items.flatMap((item) => {
    const itemId = item?._id || item?.id;
    if (!itemId) return [];

    const videos = [
      ...new Set(
        [
          ...(Array.isArray(item.media) ? item.media : []),
          ...(Array.isArray(item.images) ? item.images : []),
          item.videoUrl,
        ].filter(isVideoUrl)
      ),
    ];

    if (!videos.length) return [];

    const owner =
      item.userId && typeof item.userId === 'object' ? item.userId : null;

    const userName = getOwnerName(owner);
    const avatarUrl = getAvatar(owner, userName, source.avatarColor);

    const likes = Array.isArray(item.likes) ? item.likes : [];
    const dislikes = Array.isArray(item.dislikes) ? item.dislikes : [];

    return videos.map((videoUrl, index) => ({
      id: `${source.itemType}-${itemId}-${index}`,
      originalId: itemId,
      videoUrl,
      thumbnailUrl:
        item.thumbnailUrl || item.thumbnail || item.coverImage || null,

      title: item.title || item.name || typeLabel,
      typeLabel,
      link: source.getLink(itemId),

      userId: owner?._id || owner?.id,
      userName,
      avatarUrl,
      itemType: source.itemType,

      liked: Boolean(currentUserId) && likes.includes(currentUserId),
      disliked: Boolean(currentUserId) && dislikes.includes(currentUserId),
      likesCount: likes.length || item.likesCount || 0,
      views: item.viewsCount || item.views || 0,

      comments: formatComments(item.comments),
    }));
  });
}

/* ============================================================
   HOME ROLE BANNERS
   ============================================================ */

const PROVIDER_IMAGE = '/images/service-human.png';
const SELLER_IMAGE = '/images/seler-human.png';
const BUSINESS_IMAGE = '/images/biznes-human.png';

function HomeRoleBanners({ t, navigate }) {
  const [hiddenCards, setHiddenCards] = useState([]);
  const [failedImages, setFailedImages] = useState([]);

  const banners = useMemo(
    () => [
      {
        id: 'provider',
        image: PROVIDER_IMAGE,
        icon: Wrench,
        accent: '#ffb020',
        title: t('home.providerBanner.providerTitle', 'Sizda hunar bormi?'),
        subtitle: t(
          'home.providerBanner.providerSubtitle',
          'Mijozlar sizni topsin!'
        ),
        path: '/become-provider',
      },
      {
        id: 'seller',
        image: SELLER_IMAGE,
        wide: true,
        icon: Store,
        accent: '#00cfff',
        title: t('home.providerBanner.sellerTitle', 'Tovaringiz bormi?'),
        subtitle: t('home.providerBanner.sellerSubtitle', 'Biz bilan soting'),
        path: '/add-equipment',
      },
      {
        id: 'business',
        image: BUSINESS_IMAGE,
        wide: true,
        icon: Briefcase,
        accent: '#22c995',
        title: t('home.providerBanner.businessTitle', 'Biznesingiz bormi?'),
        subtitle: t(
          'home.providerBanner.businessSubtitle',
          'Uni rivojlantiring'
        ),
        path: '/business',
      },
    ],
    [t]
  );

  const visibleBanners = banners.filter((b) => !hiddenCards.includes(b.id));

  if (!visibleBanners.length) return null;

  const hideCard = (event, id) => {
    event.stopPropagation();
    setHiddenCards((current) => [...current, id]);
  };

  const onKeyDown = (event, path) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <section className="role-banners">
      <div className="role-banners__grid">
        {visibleBanners.map((banner) => {
          const Icon = banner.icon;
          const hasImage =
            Boolean(banner.image) && !failedImages.includes(banner.id);

          return (
            <article
              key={banner.id}
              className={`role-card role-card--${banner.id} ${
                hasImage ? 'role-card--image' : 'role-card--icon'
              } ${hasImage && banner.wide ? 'role-card--wide' : ''}`}
              style={{ '--role-accent': banner.accent }}
              role="button"
              tabIndex={0}
              onClick={() => navigate(banner.path)}
              onKeyDown={(event) => onKeyDown(event, banner.path)}
            >
              <button
                type="button"
                className="role-card__close"
                onClick={(event) => hideCard(event, banner.id)}
                aria-label={t('common.close', 'Yopish')}
              >
                <X size={13} />
              </button>

              {hasImage ? (
                <img
                  className="role-card__image"
                  src={banner.image}
                  alt=""
                  loading="lazy"
                  aria-hidden="true"
                  onError={() =>
                    setFailedImages((current) =>
                      current.includes(banner.id)
                        ? current
                        : [...current, banner.id]
                    )
                  }
                />
              ) : (
                <span className="role-card__icon" aria-hidden="true">
                  <Icon size={26} strokeWidth={1.8} />
                </span>
              )}

              <span className="role-card__content">
                <strong>{banner.title}</strong>
                <span>{banner.subtitle}</span>
              </span>

              <span className="role-card__arrow" aria-hidden="true">
                <ArrowRight size={16} />
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   HOME PAGE
   ============================================================ */

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { t, i18n } = useTranslation();

  const userId = user?.id || user?._id || null;
  const isPremium = Boolean(user?.isPremium || user?.user_metadata?.isPremium);

  const [rawCategories, setRawCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [content, setContent] = useState(EMPTY_CONTENT);
  const [homeContentLoaded, setHomeContentLoaded] = useState(false);
  const [nearbyPosition, setNearbyPosition] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');

  const [reelOverrides, setReelOverrides] = useState({});

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isPhraseFading, setIsPhraseFading] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /* ==========================================================
     HERO PHRASES
     ========================================================== */

  const heroPhrases = useMemo(() => {
    const translated = t('home.heroPhrases', { returnObjects: true });

    if (Array.isArray(translated)) {
      const valid = translated.filter(
        (phrase) => typeof phrase === 'string' && phrase.trim()
      );

      if (valid.length) return valid;
    }

    return FALLBACK_HERO_PHRASES;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, i18n.resolvedLanguage]);

  useEffect(() => {
    if (heroPhrases.length <= 1) return undefined;

    let fadeTimeoutId;

    const intervalId = window.setInterval(() => {
      setIsPhraseFading(true);

      fadeTimeoutId = window.setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % heroPhrases.length);
        setIsPhraseFading(false);
      }, 400);
    }, 3200);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(fadeTimeoutId);
    };
  }, [heroPhrases]);

  /* ==========================================================
     DATA — kategoriyalar
     ========================================================== */

  useEffect(() => {
    let mounted = true;

    shareHomeRead('categories:uz', getLevel1)
      .then((response) => {
        if (mounted) setRawCategories(getResponseArray(response));
      })
      .catch((error) => {
        console.error('Kategoriyalar yuklanmadi:', error);
        if (mounted) setRawCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     DATA — marketplace + reels
     ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadHomeContent() {
      const results = await shareHomeRead(`home-content:${userId || 'guest'}`, () => Promise.allSettled([
        getLocations({ limit: 24 }),
        getEquipment({ limit: 24 }),
        getServiceProviders({ limit: 24 }),
        getPosts({ limit: 30 }),
      ]));

      if (!mounted) return;

      const pick = (result, label) => {
        if (result.status === 'fulfilled') {
          return getResponseArray(result.value);
        }

        console.error(`${label} yuklanmadi:`, result.reason);
        return [];
      };

      setContent({
        locations: pick(results[0], 'Joylar'),
        equipment: pick(results[1], 'Tovarlar'),
        services: pick(results[2], 'Xizmatlar'),
        posts: pick(results[3], 'Postlar'),
      });
      setHomeContentLoaded(true);
    }

    loadHomeContent();

    return () => {
      mounted = false;
    };
  }, [userId]);

  /* ==========================================================
     DERIVED
     ========================================================== */

  const categories = useMemo(
    () =>
      rawCategories
        .filter((item) => item?.key)
        .map((item, index) => {
          const meta =
            CATEGORY_META[item.key] || {
              icon: Boxes,
              colors: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
            };

          return {
            key: item.key,
            name: t(`categories.${item.key}`, {
              defaultValue: item.name || item.key,
            }),
            icon: meta.icon,
            colors: meta.colors,
          };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawCategories, t, i18n.resolvedLanguage]
  );

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, VISIBLE_CATEGORIES_COUNT);

  const reels = useMemo(
    () =>
      REEL_SOURCES.flatMap((source) =>
        buildReels(content[source.key], source, userId, t)
      ).map((reel) =>
        reelOverrides[reel.id] ? { ...reel, ...reelOverrides[reel.id] } : reel
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, userId, reelOverrides, t, i18n.resolvedLanguage]
  );

  const homeListings = useMemo(() => normalizeHomeListings(content), [content]);
  const recentlyViewed = useMemo(() => getRecentlyViewed(userId), [userId]);
  const recommendedListings = useMemo(() => {
    const interestTypes = new Set([
      ...favorites.map((item) => item.type),
      ...recentlyViewed.map((item) => item.type),
    ].filter(Boolean));
    const viewedIds = new Set(recentlyViewed.map((item) => `${item.type}-${item.id}`));
    const favoriteIds = new Set(favorites.map((item) => `${item.type}-${item.id}`));
    const candidates = homeListings.filter((item) => !favoriteIds.has(`${item.type}-${item.id}`));
    return candidates
      .map((item) => ({
        item,
        score: (interestTypes.has(item.type) ? 10 : 0)
          + (viewedIds.has(`${item.type}-${item.id}`) ? 2 : 0),
      }))
      .sort((a, b) => b.score - a.score || new Date(b.item.createdAt || 0) - new Date(a.item.createdAt || 0))
      .slice(0, 12)
      .map(({ item }) => item);
  }, [favorites, recentlyViewed, homeListings]);

  const todayListings = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return homeListings.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return !Number.isNaN(createdAt.getTime()) && createdAt >= startOfToday;
    });
  }, [homeListings]);

  const nearbyListings = useMemo(() => {
    if (!nearbyPosition) return [];
    return homeListings
      .filter((item) => item.type === 'location' && Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .map((item) => ({ ...item, distanceKm: distanceBetweenKm(nearbyPosition, item) }))
      .filter((item) => item.distanceKm <= 50)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 12);
  }, [homeListings, nearbyPosition]);

  const requestNearbyLocation = () => {
    if (!navigator.geolocation) {
      setNearbyError('Bu qurilmada joylashuvni aniqlash ishlamaydi.');
      return;
    }
    setNearbyLoading(true);
    setNearbyError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setNearbyPosition({ lat: coords.latitude, lng: coords.longitude });
        setNearbyLoading(false);
      },
      (error) => {
        setNearbyError(error.code === error.PERMISSION_DENIED
          ? 'Yaqin joylarni topish uchun brauzer sozlamalarida joylashuvga ruxsat bering.'
          : 'Joylashuv aniqlanmadi. Qayta urinib ko‘ring.');
        setNearbyLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleReelUpdate = (reelId, updates) => {
    setReelOverrides((current) => ({
      ...current,
      [reelId]: { ...current[reelId], ...updates },
    }));
  };

  const goMarketplace = () => navigate('/marketplace');

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <main className="home-container">
      {/* Topbar (portal orqali body'ga chiqadi) */}
      <ZumoQuickMenu isOpen={isMenuOpen} onToggle={setIsMenuOpen} />

      {/* Topbar ostidan bo'sh joy */}
      <div className="home-container__spacer" aria-hidden="true" />

      {/* ================= HERO ================= */}

      <section className="hero-section">
        <video
          className="hero-bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>

        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-title-wrapper">
            <h1
              className={`hero-title ${
                isPhraseFading ? 'fade-out' : 'fade-in'
              }`}
            >
              {heroPhrases[phraseIndex] || FALLBACK_HERO_PHRASES[0]}
            </h1>
          </div>

          <div className="hero-cta-grid">
            <button
              type="button"
              className="hero-cta-btn cta-request"
              onClick={() => navigate('/request')}
            >
              <span className="hero-cta-btn__icon">
                <Wrench size={20} strokeWidth={2} />
              </span>
              <span className="hero-cta-btn__text">
                <strong>{t('home.ctaRequest', 'Usta kerakmi?')}</strong>
                <small>{t('home.ctaRequestSub', 'Xizmat so‘rovi yuborish')}</small>
              </span>
            </button>

            <button
              type="button"
              className="hero-cta-btn cta-marketplace"
              onClick={goMarketplace}
            >
              <span className="hero-cta-btn__icon">
                <ShoppingBag size={20} strokeWidth={2} />
              </span>
              <span className="hero-cta-btn__text">
                <strong>{t('home.ctaMarketplace', 'Bozor')}</strong>
                <small>{t('home.ctaMarketplaceSub', 'Tovar va joylar')}</small>
              </span>
            </button>

            <button
              type="button"
              className="hero-cta-btn cta-bank"
              onClick={() => navigate('/bank-services')}
            >
              <span className="hero-cta-btn__icon hero-cta-btn__icon--logo">
                <img
                  src="/images/logo/universalbank.jpg"
                  alt=""
                  className="hero-cta-btn__logo"
                />
              </span>
              <span className="hero-cta-btn__text">
                <strong>{t('home.ctaBank', 'Bank mahsulotlari')}</strong>
                <small>{t('home.ctaBankSub', 'Moliyaviy xizmatlar')}</small>
              </span>
            </button>

            <button
              type="button"
              className="hero-cta-btn cta-digitalize"
              onClick={() => navigate('/business-directions')}
            >
              <span className="hero-cta-btn__icon">
                <Zap size={20} strokeWidth={2} />
              </span>
              <span className="hero-cta-btn__text">
                <strong>{t('home.ctaBusiness', "150+ biznes yo'nalish")}</strong>
                <small>{t('home.ctaBusinessSub', 'Tanlang va boshlang')}</small>
              </span>
            </button>
          </div>

          {isPremium && (
            <div className="hero-premium-badge">
              <Crown size={17} strokeWidth={2} />
              <span>{t('home.premiumBadge', 'Premium foydalanuvchi')}</span>
            </div>
          )}
        </div>
      </section>

      {/* ================= KATEGORIYALAR ================= */}

      <section className="cats-section">
        <header className="cats-header">
          <h2 className="cats-title">
            {t('home.categoriesTitle', 'Kategoriyalar')}
          </h2>
          <p className="cats-sub">
            {t('home.categoriesSub', "Sizga kerakli yo'nalishni tanlang")}
          </p>
        </header>

        <div className="cats-grid">
          {visibleCategories.map((category, index) => (
            <CategoryCard
              key={category.key}
              title={category.name}
              icon={category.icon}
              colors={category.colors}
              linkTo={`/category/${encodeURIComponent(category.key)}`}
              delay={index * 0.05}
            />
          ))}
        </div>

        {categories.length > VISIBLE_CATEGORIES_COUNT && (
          <div className="cats-btn-wrap">
            <button
              type="button"
              className="cats-show-btn"
              aria-expanded={showAllCategories}
              onClick={() => setShowAllCategories((value) => !value)}
            >
              {showAllCategories
                ? `↑ ${t('home.showLess', "Kamroq ko'rsatish")}`
                : `↓ ${t('home.showAll', "Barchasini ko'rsatish")} (${
                    categories.length
                  })`}
            </button>
          </div>
        )}
      </section>

      {homeContentLoaded && (
        <>
          <HomeListingCarousel
            title="Bugun qo‘shilganlar"
            subtitle="Yangi joylangan tovar, joy va xizmatlar"
            items={todayListings}
            emptyTitle="Bugun yangi e’lon yo‘q"
            emptyText="Yangi e’lonlar joylanishi bilan shu yerda paydo bo‘ladi."
            actionLabel="Barcha e’lonlar"
          />
          <HomeListingCarousel
            title="Sizga mos"
            subtitle={favorites.length || recentlyViewed.length
              ? 'Ko‘rgan va saqlagan e’lonlaringizga yaqin takliflar'
              : 'Yangi e’lonlardan boshlash uchun tavsiyalar'}
            items={recommendedListings}
            emptyTitle="Tavsiya uchun e’lon yo‘q"
            emptyText="Keyinroq qaytib ko‘ring yoki barcha e’lonlarni oching."
            actionLabel="Barcha e’lonlar"
          />
          <HomeListingCarousel
            title="Yaqin atrofda"
            subtitle={nearbyPosition
              ? 'Sizga 50 km gacha yaqin joylar masofa bo‘yicha saralandi'
              : 'Joylashuvni ulasangiz, atrofingizdagi joylarni masofasi bilan topamiz'}
            items={nearbyListings}
            emptyTitle={nearbyPosition ? 'Yaqin joylar topilmadi' : 'Yaqin joylarni ko‘rmoqchimisiz?'}
            emptyText={nearbyError || (nearbyPosition
              ? 'Hozircha 50 km ichida koordinatasi bor e’lon topilmadi.'
              : 'Joylashuv faqat siz ruxsat berganingizda aniqlanadi.')}
            actionLabel={nearbyLoading ? 'Aniqlanmoqda…' : nearbyPosition ? 'Qayta aniqlash' : 'Joylashuvni ulash'}
            actionKind="location"
            actionDisabled={nearbyLoading}
            onAction={requestNearbyLocation}
          />
        </>
      )}

      {/* ================= 3 TA ROL BANNERI ================= */}

      <HomeRoleBanners t={t} navigate={navigate} />

      {/* ================= REELS ================= */}

      {reels.length > 0 && (
        <MarketplaceReels
          reels={reels}
          currentUser={user}
          variant="grid2"
          onReelUpdate={handleReelUpdate}
        />
      )}
    </main>
  );
}
