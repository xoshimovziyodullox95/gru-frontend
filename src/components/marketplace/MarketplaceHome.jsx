// src/components/marketplace/MarketplaceHome.jsx
/* ============================================================
   MARKETPLACE HOME — ZUMO
   Search + AI Chat + Role Carousel + Kategoriyalar + Reels + Tovarlar
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ArrowRight,
  Package,
  TrendingUp,
  Wrench,
  Store,
  Briefcase,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getLevel1 } from '../services/categories';
import { getEquipment } from '../services/equipment';
import { getLocations } from '../services/locations';
import { getServiceProviders } from '../services/serviceProviders';
import { getPosts } from '../services/videos';
import { formatPrice } from '../utils/formatPrice';
import UniversalCard from '../pages/UniversalCard';
import MarketplaceReels from './MarketplaceReels';
import SearchOverlay from '../common/SearchOverlay';
import '../../styles/marketplaceHome.css';

/* ============================================================
   YORDAMCHILAR
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

const CATEGORY_EMOJI = {
  Agro: '🌱',
  'Restoran/Kafe': '🍽️',
  Klinika: '🏥',
  Service: '🔧',
  "Ta'lim": '🎓',
  "Do'konlar": '🏪',
  "Ko'ngilochar": '🎉',
  'Yangi biznes': '💡',
};

const CATEGORY_COLORS = {
  Agro: ['#2fd576', '#0a9a52'],
  'Restoran/Kafe': ['#ff5c7a', '#e0264f'],
  Klinika: ['#4b8dff', '#2a4fe0'],
  Service: ['#22d3c5', '#0a8f8a'],
  "Ta'lim": ['#a78bfa', '#6d3fe0'],
  "Do'konlar": ['#ff8a2a', '#e8500a'],
  "Ko'ngilochar": ['#ff5fc4', '#c21fa0'],
  'Yangi biznes': ['#ffe14d', '#f5a300'],
};

const FALLBACK_COLORS = [
  ['#7c86ff', '#4a3fe0'],
  ['#a3e635', '#5fa30f'],
  ['#38bdf8', '#0369a1'],
  ['#94a3b8', '#475569'],
];

const ROLE_IMAGES = {
  provider: '/images/service-human.png',
  seller: '/images/seler-human.png',
  business: '/images/biznes-human.png',
};

const PRODUCTS_PREVIEW_LIMIT = 12;

const REEL_SOURCES = [
  {
    key: 'locations',
    itemType: 'location',
    labelFallback: 'Joy',
    getLink: (id) => `/location/${id}`,
    avatarColor: '00C8F8',
  },
  {
    key: 'equipment',
    itemType: 'equipment',
    labelFallback: 'Jihoz',
    getLink: (id) => `/equipment/${id}`,
    avatarColor: 'F59E0B',
  },
  {
    key: 'services',
    itemType: 'service',
    labelFallback: 'Xizmat',
    getLink: (id) => `/service-provider/${id}`,
    avatarColor: '008FC7',
  },
  {
    key: 'posts',
    itemType: 'post',
    labelFallback: 'Post',
    getLink: (id) => `/posts/${id}`,
    avatarColor: '00C8F8',
  },
];

const EMPTY_CONTENT = { locations: [], equipment: [], services: [], posts: [] };

/* ============================================================
   HELPERS
   ============================================================ */

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
        '/images/zumo-placeholder.svg',
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

function buildReels(items, source, currentUserId) {
  if (!Array.isArray(items)) return [];
  const typeLabel = source.labelFallback;

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

function formatProduct(item) {
  const id = item._id || item.id;
  return {
    id,
    type: 'equipment',
    title: item.title || item.name || 'Tovar',
    image:
      item.images?.[0] ||
      item.image ||
      item.thumbnail ||
      '/images/zumo-placeholder.svg',
    price: formatPrice(item.price, item.currency) || 'Narxi yo‘q',
    link: `/equipment/${id}`,
    isTop: Boolean(item.isTop || item.is_top),
    isVerified: Boolean(item.isVerified || item.is_verified),
    maxQuantity:
      typeof item.stockQuantity === 'number' ? item.stockQuantity : undefined,
  };
}

/* ============================================================
   ROLE CAROUSEL
   ============================================================ */

function RoleCarousel() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [failedImages, setFailedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const banners = useMemo(
    () => [
      {
        id: 'provider',
        image: ROLE_IMAGES.provider,
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
        image: ROLE_IMAGES.seller,
        icon: Store,
        accent: '#00cfff',
        title: t('home.providerBanner.sellerTitle', 'Tovaringiz bormi?'),
        subtitle: t('home.providerBanner.sellerSubtitle', 'Biz bilan soting'),
        path: '/add-equipment',
      },
      {
        id: 'business',
        image: ROLE_IMAGES.business,
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

  useEffect(() => {
    if (isPaused) return undefined;
    const id = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [isPaused, banners.length]);

  const goTo = (index) => {
    setCurrentIndex(index);
    setIsPaused(true);
    window.setTimeout(() => setIsPaused(false), 8000);
  };

  return (
    <section
      className="mkt-role-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mkt-role-carousel__viewport">
        <div
          className="mkt-role-carousel__track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => {
            const Icon = banner.icon;
            const hasImage =
              Boolean(banner.image) && !failedImages.includes(banner.id);

            return (
              <article
                key={banner.id}
                className={`mkt-role-card mkt-role-card--${banner.id}`}
                style={{ '--role-accent': banner.accent }}
                role="button"
                tabIndex={0}
                onClick={() => navigate(banner.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(banner.path);
                  }
                }}
              >
                <div className="mkt-role-card__media" aria-hidden="true">
                  {hasImage ? (
                    <img
                      className="mkt-role-card__image"
                      src={banner.image}
                      alt=""
                      loading="lazy"
                      onError={() =>
                        setFailedImages((current) =>
                          current.includes(banner.id)
                            ? current
                            : [...current, banner.id]
                        )
                      }
                    />
                  ) : (
                    <span className="mkt-role-card__icon">
                      <Icon size={26} strokeWidth={1.8} />
                    </span>
                  )}
                </div>

                <div className="mkt-role-card__content">
                  <strong>{banner.title}</strong>
                  <span>{banner.subtitle}</span>
                </div>

                <span className="mkt-role-card__arrow" aria-hidden="true">
                  <ArrowRight size={16} />
                </span>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mkt-role-carousel__dots">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            className={`mkt-role-carousel__dot ${
              index === currentIndex ? 'is-active' : ''
            }`}
            onClick={() => goTo(index)}
            aria-label={`${index + 1}-slayd`}
          />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   ASOSIY KOMPONENT
   ============================================================ */

export default function MarketplaceHome() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const userId = user?.id || user?._id || null;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [content, setContent] = useState(EMPTY_CONTENT);
  const [reelOverrides, setReelOverrides] = useState({});

  /* ✅ HAMMA "Barchasi" va "Yana ko'rish" shu yo'lga olib boradi */
  const ALL_MARKETPLACE_PATH = '/marketplace/all';

  /* ---------- Kategoriyalar ---------- */
  useEffect(() => {
    let mounted = true;

    getLevel1()
      .then((response) => {
        if (!mounted) return;
        const raw = getResponseArray(response);

        const formatted = raw
          .filter((item) => item?.key)
          .map((item, index) => {
            const colors =
              CATEGORY_COLORS[item.key] ||
              FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            return {
              key: item.key,
              name: t(`categories.${item.key}`, {
                defaultValue: item.name || item.key,
              }),
              emoji: CATEGORY_EMOJI[item.key] || '📦',
              colors,
            };
          });

        setCategories(formatted);
      })
      .catch((error) => {
        console.error('Kategoriyalar yuklanmadi:', error);
        if (mounted) setCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, [t, i18n.resolvedLanguage]);

  /* ---------- Tovarlar + Reels ma'lumotlari ---------- */
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const results = await Promise.allSettled([
        getEquipment({ limit: 50 }),
        getLocations({ limit: 50 }),
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

      const equipment = pick(results[0], 'Tovarlar');

      setProducts(
        equipment
          .filter((i) => i?._id || i?.id)
          .slice(0, PRODUCTS_PREVIEW_LIMIT)
          .map(formatProduct)
      );

      setContent({
        equipment,
        locations: pick(results[1], 'Joylar'),
        services: pick(results[2], 'Xizmatlar'),
        posts: pick(results[3], 'Postlar'),
      });

      setLoading(false);
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleCategories = useMemo(
    () => categories.slice(0, 8),
    [categories]
  );

  const searchSuggestions = useMemo(() => {
    const categorySuggestions = categories.map((category) => ({
      id: category.key,
      label: category.name,
      kind: 'category',
      hint: t('mkt.categories', 'Kategoriya'),
    }));
    const listingSuggestions = [
      ...content.equipment.map((item) => ({ ...item, label: item?.title, kind: 'listing', hint: t('marketplace.types.equipment', 'Tovar') })),
      ...content.locations.map((item) => ({ ...item, label: item?.title, kind: 'listing', hint: t('marketplace.types.location', 'Joy') })),
      ...content.services.map((item) => ({ ...item, label: item?.name || item?.title, kind: 'listing', hint: t('marketplace.types.service', 'Xizmat') })),
    ].filter((item) => item.label?.trim());
    const unique = new Map();
    [...categorySuggestions, ...listingSuggestions].forEach((item) => {
      const key = `${item.kind}:${item.label.trim().toLocaleLowerCase('uz-UZ')}`;
      if (!unique.has(key)) unique.set(key, item);
    });
    return [...unique.values()];
  }, [categories, content, t, i18n.resolvedLanguage]);

  const reels = useMemo(
    () =>
      REEL_SOURCES.flatMap((source) =>
        buildReels(content[source.key], source, userId)
      ).map((reel) =>
        reelOverrides[reel.id] ? { ...reel, ...reelOverrides[reel.id] } : reel
      ),
    [content, userId, reelOverrides]
  );

  const handleReelUpdate = (reelId, updates) => {
    setReelOverrides((current) => ({
      ...current,
      [reelId]: { ...current[reelId], ...updates },
    }));
  };

  return (
    <div className="mkt-home2">
      {/* ==================== SEARCH + AI CHAT ==================== */}
      <div className="mkt-search-row">
        <form
          className="mkt-search"
          onSubmit={(event) => {
            event.preventDefault();
            const query = searchTerm.trim();
            navigate(`${ALL_MARKETPLACE_PATH}${query ? `?q=${encodeURIComponent(query)}` : ''}`);
          }}
          onClick={(event) => {
            if (event.target.closest('button')) return;
            event.preventDefault();
            setIsSearchOpen(true);
          }}
        >
          <Search size={18} strokeWidth={2.2} />
          <input
            type="text"
            placeholder={t('mkt.searchPlaceholder', 'Qidirish...')}
            className="mkt-search__input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            readOnly
            aria-label={t('mkt.searchPlaceholder', 'Qidirish...')}
          />
          <button type="submit" className="mkt-search__submit" aria-label={t('marketplacePage.search', 'Qidirish')}>
            <ArrowRight size={17} />
          </button>
        </form>
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSearch={(query) => {
            setSearchTerm(query);
            navigate(`${ALL_MARKETPLACE_PATH}${query ? `?q=${encodeURIComponent(query)}` : ''}`);
          }}
          suggestions={searchSuggestions}
          onSelectSuggestion={(suggestion) => {
            if (suggestion.kind === 'category') {
              navigate(`${ALL_MARKETPLACE_PATH}?level1=${encodeURIComponent(suggestion.id)}`);
              return;
            }
            const query = suggestion.label.trim();
            setSearchTerm(query);
            navigate(`${ALL_MARKETPLACE_PATH}?q=${encodeURIComponent(query)}`);
          }}
          storageKey="zumo_recent_search_marketplace"
          placeholder={t('mkt.searchPlaceholder', 'Qidirish...')}
          initialValue={searchTerm}
        />

        
      </div>

      {/* ==================== ROLE CAROUSEL ==================== */}
      <RoleCarousel />

      {/* ==================== KATEGORIYALAR ==================== */}
      {visibleCategories.length > 0 && (
        <section className="mkt-block">
          <header className="mkt-block__head">
            <h2 className="mkt-block__title">
              {t('mkt.categories', 'Kategoriyalar')}
            </h2>
            <button
              type="button"
              className="mkt-block__more"
              onClick={() => navigate(ALL_MARKETPLACE_PATH)}
            >
              {t('mkt.all', 'Barchasi')}
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          </header>

          <div className="mkt-cat-grid">
            {visibleCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className="mkt-cat"
                style={{
                  '--cat-from': cat.colors[0],
                  '--cat-to': cat.colors[1],
                }}
                onClick={() =>
                  navigate(`${ALL_MARKETPLACE_PATH}?level1=${encodeURIComponent(cat.key)}`)
                }
              >
                <span className="mkt-cat__shape">
                  <span className="mkt-cat__emoji">{cat.emoji}</span>
                </span>
                <span className="mkt-cat__name">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ==================== VIDEO REELS ==================== */}
      {reels.length > 0 && (
        <section className="mkt-block mkt-block--reels">
          <MarketplaceReels
            reels={reels}
            currentUser={user}
            variant="grid2"
            onReelUpdate={handleReelUpdate}
          />
        </section>
      )}

      {/* ==================== TOVARLAR ==================== */}
      <section className="mkt-block">
        <header className="mkt-block__head">
          <h2 className="mkt-block__title">
            <TrendingUp size={18} strokeWidth={2.4} />
            {t('mkt.popular', 'Mashhur tovarlar')}
          </h2>
          <button
            type="button"
            className="mkt-block__more"
            onClick={() => navigate(ALL_MARKETPLACE_PATH)}
          >
            {t('mkt.all', 'Barchasi')}
            <ArrowRight size={14} strokeWidth={2.4} />
          </button>
        </header>

        {loading ? (
          <div className="mkt-skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mkt-skeleton" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="uc-grid mkt-products-grid">
            {products.slice(0, PRODUCTS_PREVIEW_LIMIT).map((item) => (
              <UniversalCard
                key={`mkt-${item.id}`}
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
          <div className="mkt-empty">
            <Package size={34} strokeWidth={1.7} />
            <p>{t('mkt.noProducts', 'Hozircha tovarlar yo‘q')}</p>
          </div>
        )}
      </section>

      {/* ==================== YANA KO'RISH ==================== */}
      <div className="mkt-see-more">
        <button
          type="button"
          className="mkt-see-more__btn"
          onClick={() => navigate(ALL_MARKETPLACE_PATH)}
        >
          <span>{t('home.seeMore', 'Yana ko‘rish')}</span>
          <ArrowRight size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
