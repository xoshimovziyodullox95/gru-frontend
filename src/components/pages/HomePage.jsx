/* ============================================================
   ZUMO HOME PAGE
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  ArrowRight,
  ClipboardList,
  MessageSquareText,
  Crown,
  Search,
  ShoppingBag,
  Star,
  Wrench,
  Zap,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import ProductCategoryGrid from '../common/ProductCategoryGrid';
import MarketplaceReels from '../marketplace/MarketplaceReels';
import ZumoQuickMenu from '../common/ZumoQuickMenu.jsx';
import { RoleCarousel } from '../marketplace/MarketplaceHome.jsx';
import '../../styles/marketplaceLayout.css';
import UniversalBankLogo from '../common/UniversalBankLogo.jsx';
import HomeListingCarousel from '../home/HomeListingCarousel.jsx';
import { useFavorites } from '../hooks/useFavorites';

import { useProductCategories } from '../utils/productCategories';
import { getPosts } from '../services/videos';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';
import { getRecentlyViewed } from '../utils/recentlyViewed.js';

import '../../styles/home.css';

import { T } from '../utils/T';
import { useMyMongoId } from '../hooks/useMyMongoId';
/* ============================================================
   CONSTANTS
   ============================================================ */


const FALLBACK_HERO_PHRASES = [
  T('bilan oson'),
  T('yangi imkoniyat'),
  T('kelajak sari'),
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

const HOW_STEPS = [
  { icon: ClipboardList, title: 'Muammoni yozing', text: 'Nima kerakligini va manzilni kiriting — 1 daqiqa.' },
  { icon: MessageSquareText, title: 'Ustalar narx aytadi', text: 'Yaqin ustalar taklif yuboradi, siz solishtirasiz.' },
  { icon: Star, title: 'Tanlang va baholang', text: 'Ish tugagach tasdiqlaysiz va ustaga baho berasiz.' },
];

// Fon videosi reduced-motion yoki data-saving yoqilgan bo'lsa o'ynamaydi;
// qolgan holatlarda kichik poster birinchi kadr sifatida darhol ko'rinadi.
const HERO_POSTER = '/images/hero-poster.webp';
function shouldPlayHeroVideo() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const connection = navigator.connection || {};
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && !connection.saveData;
}

function normalizeHomeListings(content) {
  const getId = (item) => item?._id || item?.id;
  const locations = content.locations.map((item) => {
    const id = getId(item);
    if (!id) return null;
    return {
      id: String(id), type: 'location', title: item.title || item.name || T('Joy'),
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
      id: String(id), type: 'equipment', title: item.title || item.name || T('Tovar'),
      image: item.images?.[0] || item.image || item.imageUrl || '/images/placeholder-equipment.jpg',
      price: item.price ?? 'Narx so‘rov asosida', currency: item.currency,
      link: `/equipment/${id}`, createdAt: item.createdAt || item.created_at,
      isTop: Boolean(item.isTop || item.is_top), isVerified: Boolean(item.isVerified || item.is_verified),
      maxQuantity: item.stockQuantity,
      saleMode: item.saleMode,
    };
  });
  const services = content.services.map((item) => {
    const id = getId(item);
    if (!id) return null;
    return {
      id: String(id), type: 'service', title: item.name || item.title || T('Xizmat'),
      image: item.image || item.images?.[0] || item.imageUrl || '/images/service-providers/default.jpg',
      price: item.price_range || item.price || 'Narx so‘rov asosida',
      link: `/service-provider/${id}`, createdAt: item.createdAt || item.created_at,
      isTop: Boolean(item.is_top), isVerified: Boolean(item.is_verified),
      rating: Array.isArray(item.ratings) && item.ratings.length
        ? item.ratings.reduce((sum, r) => sum + Number(r.value || 0), 0) / item.ratings.length
        : Number(item.rating || item.averageRating) || 0,
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
    T('Foydalanuvchi')
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

      liked: Boolean(currentUserId) && likes.map(String).includes(String(currentUserId)),
      disliked: Boolean(currentUserId) && dislikes.map(String).includes(String(currentUserId)),
      likesCount: likes.length || item.likesCount || 0,
      views: item.viewsCount || item.views || 0,

      comments: formatComments(item.comments),
    }));
  });
}

/* ============================================================
   HOME PAGE
   ============================================================ */

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { t, i18n } = useTranslation();

  // Like/dislike ro'yxatlarida Mongo ID saqlanadi — Supabase UUID (user.id) bilan solishtirsa
  // oldin bosilgan like ko'rinmay, qayta bosish uni olib tashlab yuborardi
  const myMongoId = useMyMongoId();
  const userId = myMongoId || null;
  const isPremium = Boolean(user?.isPremium || user?.user_metadata?.isPremium);

  // Marketplace tovar kategoriyalari (150+ biznes yo'nalishi emas)
  const { categories } = useProductCategories();

  const [content, setContent] = useState(EMPTY_CONTENT);
  const [homeContentLoaded, setHomeContentLoaded] = useState(false);
  const [heroQuery, setHeroQuery] = useState('');
  const [playHeroVideo] = useState(shouldPlayHeroVideo);
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);
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

  // Eng yaxshi ustalar: tasdiqlangan/TOP oldinda, keyin reyting bo'yicha
  const topProviders = useMemo(() => homeListings
    .filter((item) => item.type === 'service')
    .sort((a, b) => (Number(b.isVerified) + Number(b.isTop)) - (Number(a.isVerified) + Number(a.isTop))
      || b.rating - a.rating)
    .slice(0, 12), [homeListings]);

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
        {playHeroVideo && !heroVideoFailed ? (
          <video
            className="hero-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_POSTER}
            aria-hidden="true"
            onError={() => setHeroVideoFailed(true)}
          >
            <source src="/videos/hero-background.mp4" type="video/mp4" />
          </video>
        ) : (
          <img className="hero-bg-video" src={HERO_POSTER} alt="" aria-hidden="true" fetchPriority="high" />
        )}

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

          {/* Qidiruv — usta, tovar va joy bir joydan */}
          <form
            className="hero-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const q = heroQuery.trim();
              navigate(q ? `/marketplace/all?q=${encodeURIComponent(q)}` : '/marketplace/all');
            }}
          >
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={heroQuery}
              maxLength={120}
              onChange={(event) => setHeroQuery(event.target.value)}
              placeholder={T('Usta, tovar yoki joy qidiring')}
              aria-label={T('Qidirish')}
            />
            <button type="submit">{T('Qidirish')}</button>
          </form>

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
              className="hero-cta-btn cta-digitalize"
              onClick={() => navigate('/business-directions')}
            >
              <span className="hero-cta-btn__icon">
                <Zap size={20} strokeWidth={2} />
              </span>
              <span className="hero-cta-btn__text">
                <strong>{T('150+ biznes yo‘nalishi')}</strong>
                <small>{T('Tez kunda')}</small>
              </span>
            </button>

            <button
              type="button"
              className="hero-cta-btn cta-bank"
              onClick={() => navigate('/bank-services')}
            >
              <span className="hero-cta-btn__icon">
                <UniversalBankLogo size={26} />
              </span>
              <span className="hero-cta-btn__text">
                <strong>{T('Bank mahsulotlari')}</strong>
                <small>{T('Tez kunda')}</small>
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
            {T('Nima qidiryapsiz? Bo‘limni tanlang')}
          </p>
          <button type="button" className="cats-catalog-link" onClick={() => navigate('/catalog')}>
            {T('Katalogni ochish')} <ArrowRight size={16} />
          </button>
        </header>

        <ProductCategoryGrid categories={categories} />
      </section>

      {homeContentLoaded && (
        <>
          <HomeListingCarousel
            title={T('Eng yaxshi ustalar')}
            subtitle={T('Tasdiqlangan va yuqori baholangan ustalar')}
            items={topProviders}
            emptyTitle={T('Hozircha usta yo‘q')}
            emptyText={T('Hunaringiz bo‘lsa, birinchi bo‘lib xizmatingizni joylang.')}
            actionLabel={T('Barcha ustalar')}
            actionTo="/marketplace/all?type=service"
          />
          <HomeListingCarousel
            title={T('Bugun qo‘shilganlar')}
            subtitle={T('Yangi joylangan tovar, joy va xizmatlar')}
            items={todayListings}
            emptyTitle={T('Bugun yangi e’lon yo‘q')}
            emptyText={T('Yangi e’lonlar joylanishi bilan shu yerda paydo bo‘ladi.')}
            actionLabel={T('Barcha e’lonlar')}
          />
          <HomeListingCarousel
            title={T('Sizga mos')}
            subtitle={favorites.length || recentlyViewed.length
              ? T('Ko‘rgan va saqlagan e’lonlaringizga yaqin takliflar')
              : T('Yangi e’lonlardan boshlash uchun tavsiyalar')}
            items={recommendedListings}
            emptyTitle={T('Tavsiya uchun e’lon yo‘q')}
            emptyText={T('Keyinroq qaytib ko‘ring yoki barcha e’lonlarni oching.')}
            actionLabel={T('Barcha e’lonlar')}
          />
          <HomeListingCarousel
            title={T('Yaqin atrofda')}
            subtitle={nearbyPosition
              ? T('Sizga 50 km gacha yaqin joylar masofa bo‘yicha saralandi')
              : T('Joylashuvni ulasangiz, atrofingizdagi joylarni masofasi bilan topamiz')}
            items={nearbyListings}
            emptyTitle={nearbyPosition ? T('Yaqin joylar topilmadi') : T('Yaqin joylarni ko‘rmoqchimisiz?')}
            emptyText={nearbyError || (nearbyPosition
              ? T('Hozircha 50 km ichida koordinatasi bor e’lon topilmadi.')
              : T('Joylashuv faqat siz ruxsat berganingizda aniqlanadi.'))}
            actionLabel={nearbyLoading ? T('Aniqlanmoqda…') : nearbyPosition ? T('Qayta aniqlash') : T('Joylashuvni ulash')}
            actionKind="location"
            actionDisabled={nearbyLoading}
            onAction={requestNearbyLocation}
          />
        </>
      )}

      {/* ================= QANDAY ISHLAYDI ================= */}

      <section className="home-how" aria-labelledby="home-how-title">
        <h2 id="home-how-title">{T('Usta chaqirish qanday ishlaydi?')}</h2>
        <ol className="home-how__steps">
          {HOW_STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title}>
              <span className="home-how__icon"><Icon size={20} /></span>
              <span className="home-how__num">{index + 1}</span>
              <strong>{T(title)}</strong>
              <p>{T(text)}</p>
            </li>
          ))}
        </ol>
        <button type="button" className="home-how__cta" onClick={() => navigate('/request')}>
          <Wrench size={17} /> {T('Usta chaqirish')}
        </button>
      </section>

      {/* ================= 3 TA ROL BANNERI ================= */}

      {/* 3 ta katta banner o'rniga bitta aylanuvchi karusel (Bozor sahifasidagi bilan bir xil) */}
      <div className="home-role-carousel"><RoleCarousel /></div>

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
