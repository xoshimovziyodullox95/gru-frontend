/* ============================================================
   G.R.U HOME PAGE
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
  Landmark,
  Lightbulb,
  MapPin,
  Package,
  PartyPopper,
  ShoppingBag,
  Sparkles,
  Sprout,
  Store,
  UtensilsCrossed,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import CategoryCard from '../common/CategoryCard';
import UniversalCard from './UniversalCard';
import MarketplaceReels from '../marketplace/MarketplaceReels';

import { getLevel1 } from '../services/categories';
import { getPosts } from '../services/videos';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';

import { formatPrice } from '../utils/formatPrice';

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
const HOME_PRODUCTS_LIMIT = 8;

const FALLBACK_HERO_PHRASES = [
  'G.R.U kelajak sari',
  'Yangi imkoniyatlar sari',
  'Biznesingizni rivojlantiring',
];

/* Marketplace teaser — 4 yo'nalish.
   Bank rangi: toza qizil (#e63946), pushti emas. */
const MARKET_ITEMS = [
  {
    id: 'locations',
    icon: MapPin,
    accent: '#00b4d8',
    titleKey: 'home.marketplaceLocations',
    titleFallback: 'Joylar',
    subKey: 'home.marketplaceLocationsSub',
    subFallback: 'Eng yaxshi maskanlar',
    path: '/marketplace/locations',
  },
  {
    id: 'products',
    icon: Package,
    accent: '#eab308',
    titleKey: 'home.marketplaceProducts',
    titleFallback: 'Tovarlar',
    subKey: 'home.marketplaceProductsSub',
    subFallback: 'Sifatli mahsulotlar',
    path: '/marketplace/products',
  },
  {
    id: 'services',
    icon: Briefcase,
    accent: '#10b981',
    titleKey: 'home.marketplaceServices',
    titleFallback: 'Xizmatlar',
    subKey: 'home.marketplaceServicesSub',
    subFallback: 'Ishonchli xizmatlar',
    path: '/marketplace/services',
  },
  {
    id: 'bank',
    icon: Landmark,
    image: '/images/logo/universalbank.jpg',
    accent: '#e63946',
    titleKey: 'home.marketplaceBank',
    titleFallback: 'Bank xizmatlari',
    subKey: 'home.marketplaceBankSub',
    subFallback: 'Moliyaviy yechimlar',
    path: '/marketplace/bank',
  },
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

function formatMarketplaceProducts(items) {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item?._id || item?.id)
    .slice(0, HOME_PRODUCTS_LIMIT)
    .map((item) => {
      const id = item._id || item.id;

      return {
        id,
        type: 'equipment',
        title: item.title || item.name || 'Tovar',
        image:
          item.images?.[0] ||
          item.image ||
          item.thumbnail ||
          '/images/placeholder-equipment.jpg',
        price:
          formatPrice(item.price, item.currency) || 'Narxi mavjud emas',
        link: `/equipment/${id}`,
        isTop: Boolean(item.isTop || item.is_top),
        isVerified: Boolean(item.isVerified || item.is_verified),
        maxQuantity:
          typeof item.stockQuantity === 'number'
            ? item.stockQuantity
            : undefined,
      };
    });
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function SeeMoreButton({ label, onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`home-products-see-all ${className}`.trim()}
      onClick={onClick}
    >
      <span>{label}</span>
      <ArrowRight size={16} />
    </button>
  );
}

function ProductSkeletons() {
  return (
    <div className="home-products-grid">
      {Array.from({ length: HOME_PRODUCTS_LIMIT }).map((_, index) => (
        <div
          key={`product-skeleton-${index}`}
          className="home-product-skeleton"
          aria-hidden="true"
        >
          <div className="home-product-skeleton__image" />
          <div className="home-product-skeleton__body">
            <div className="home-product-skeleton__line home-product-skeleton__line--title" />
            <div className="home-product-skeleton__line" />
            <div className="home-product-skeleton__line home-product-skeleton__line--price" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   HOME ROLE BANNERS
   Rasmlar: public/images/ ichida (PNG, fon shaffof, atrofi kesilgan)
   `wide: true` — yotiq (keng) rasm uchun, ko'proq joy beriladi
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
  const { t, i18n } = useTranslation();

  const userId = user?.id || user?._id || null;
  const isPremium = Boolean(user?.isPremium || user?.user_metadata?.isPremium);

  const [rawCategories, setRawCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [content, setContent] = useState(EMPTY_CONTENT);
  const [contentLoading, setContentLoading] = useState(true);

  const [reelOverrides, setReelOverrides] = useState({});

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isPhraseFading, setIsPhraseFading] = useState(false);

  const [failedMarketImages, setFailedMarketImages] = useState({});

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
    setPhraseIndex(0);
    setIsPhraseFading(false);

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

    getLevel1()
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
      const results = await Promise.allSettled([
        getLocations({ limit: 50 }),
        getEquipment({ limit: 50 }),
        getServiceProviders({ limit: 50 }),
        getPosts(),
      ]);

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

      setContentLoading(false);
    }

    loadHomeContent();

    return () => {
      mounted = false;
    };
  }, []);

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

  const marketProducts = useMemo(
    () => formatMarketplaceProducts(content.equipment),
    [content.equipment]
  );

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

  const handleReelUpdate = (reelId, updates) => {
    setReelOverrides((current) => ({
      ...current,
      [reelId]: { ...current[reelId], ...updates },
    }));
  };

  const goMarketplace = () => navigate('/marketplace');
  const seeMoreLabel = t('home.seeMore', 'Yana ko‘rish');

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <main className="home-container">
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
              className={`hero-title ${isPhraseFading ? 'fade-out' : 'fade-in'}`}
            >
              {heroPhrases[phraseIndex] || FALLBACK_HERO_PHRASES[0]}
            </h1>
          </div>

          <div className="hero-cta-buttons">
            <button
              type="button"
              className="hero-cta-btn cta-ai"
              onClick={() => navigate('/ai-assistant')}
            >
              <Sparkles size={18} strokeWidth={2} />
              <span>{t('home.ctaAi', 'AI yordamchi')}</span>
            </button>

            <button
              type="button"
              className="hero-cta-btn cta-marketplace"
              onClick={goMarketplace}
            >
              <ShoppingBag size={18} strokeWidth={2} />
              <span>{t('home.ctaMarketplace', 'Bozor')}</span>
            </button>

            <button
              type="button"
              className="hero-cta-btn cta-digitalize"
              onClick={() => navigate('/business')}
            >
              <Zap size={18} strokeWidth={2} />
              <span>{t('home.ctaBusiness', 'Biznes')}</span>
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
            {t('home.categoriesSub', 'Sizga kerakli yo‘nalishni tanlang')}
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
                ? `↑ ${t('home.showLess', 'Kamroq ko‘rsatish')}`
                : `↓ ${t('home.showAll', 'Barchasini ko‘rsatish')} (${categories.length})`}
            </button>
          </div>
        )}
      </section>

      {/* ================= 3 TA ROL BANNERI ================= */}

      <HomeRoleBanners t={t} navigate={navigate} />

      {/* ================= PRODUCTS ================= */}

      <section className="home-products-section">
        <header className="home-products-header">
          <span className="home-products-eyebrow">
            <Package size={14} strokeWidth={2.4} />
            {t('home.productsEyebrow', 'Marketplace')}
          </span>

          <h2 className="home-products-title">
            {t('home.latestProducts', 'Yangi tovarlar')}
          </h2>

          <p className="home-products-subtitle">
            {t('home.latestProductsSub', 'Marketplace’dagi so‘nggi takliflar')}
          </p>

          <SeeMoreButton
            label={seeMoreLabel}
            onClick={goMarketplace}
            className="home-products-see-all--top"
          />
        </header>

        {contentLoading ? (
          <ProductSkeletons />
        ) : marketProducts.length > 0 ? (
          <div className="uc-grid home-products-grid">
            {marketProducts.map((item) => (
              <UniversalCard
                key={`home-equipment-${item.id}`}
                id={item.id}
                type={item.type}
                title={item.title}
                image={item.image}
                price={item.price}
                link={item.link}
                isTop={item.isTop}
                isVerified={item.isVerified}
                maxQuantity={item.maxQuantity}
              />
            ))}
          </div>
        ) : (
          <div className="home-products-empty">
            <div className="home-products-empty__icon">
              <Package size={34} strokeWidth={1.7} />
            </div>
            <p className="home-products-empty__title">
              {t('home.noProducts', 'Hozircha tovarlar mavjud emas')}
            </p>
            <p className="home-products-empty__hint">
              {t(
                'home.noProductsHint',
                'Tez orada yangi takliflar paydo bo‘ladi'
              )}
            </p>
          </div>
        )}

        <div className="home-products-more">
          <SeeMoreButton label={seeMoreLabel} onClick={goMarketplace} />
        </div>
      </section>

      {/* ================= MARKET ================= */}

      <section className="home-market-teaser">
        <header className="cats-header">
          <h2 className="cats-title">{t('home.marketplaceTitle', 'Bozor')}</h2>
          <p className="cats-sub">
            {t('home.marketplaceSub', 'Kerakli bo‘limni tanlang')}
          </p>
        </header>

        <div className="home-market-grid">
          {MARKET_ITEMS.map((item) => {
            const Icon = item.icon;
            const hasImage =
              Boolean(item.image) && !failedMarketImages[item.id];

            return (
              <button
                key={item.id}
                type="button"
                className={`home-market-card home-market-card--${item.id}`}
                style={{ '--market-accent': item.accent }}
                onClick={() => navigate(item.path)}
              >
                <span
                  className={`home-market-card__icon${
                    hasImage ? ' home-market-card__icon--logo' : ''
                  }`}
                  aria-hidden="true"
                >
                  {hasImage ? (
                    <img
                      className="home-market-card__logo"
                      src={item.image}
                      alt=""
                      loading="lazy"
                      onError={() =>
                        setFailedMarketImages((current) => ({
                          ...current,
                          [item.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <Icon size={24} strokeWidth={2} />
                  )}
                </span>

                <span className="home-market-card__text">
                  <strong>{t(item.titleKey, item.titleFallback)}</strong>
                  <small>{t(item.subKey, item.subFallback)}</small>
                </span>

                <span className="home-market-card__arrow" aria-hidden="true">
                  <ArrowRight size={15} strokeWidth={2.4} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

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