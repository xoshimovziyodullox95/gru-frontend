// src/pages/HomePage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLevel1 } from '../services/categories';
import CategoryCard from '../common/CategoryCard';
import MarketplaceReels from '../marketplace/MarketplaceReels';
import { getPosts } from '../services/videos';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';

import { Crown, Sparkles, ShoppingBag, Zap } from 'lucide-react';
import '../../styles/home.css';
import { MapPin, Package, Briefcase, Landmark } from 'lucide-react';

// ============================================================
// Kategoriya meta ma'lumotlar
// ============================================================
const categoryMeta = {
  Agro: { icon: '🌾', defaultImage: '/images/categories/Agro.jpg' },
  'Restoran/Kafe': { icon: '🍽️', defaultImage: '/images/categories/restoran.jpg' },
  Klinika: { icon: '🏥', defaultImage: '/images/categories/klinika.jpg' },
  Service: { icon: '🔧', defaultImage: '/images/categories/service.jpg' },
  "Ta'lim": { icon: '📚', defaultImage: '/images/categories/talim.jpg' },
  "Do'konlar": { icon: '🛍️', defaultImage: '/images/categories/dokonlar.jpg' },
  "Ko'ngilochar": { icon: '🎢', defaultImage: '/images/categories/kongilochar.jpg' },
  'Yangi biznes': { icon: '💡', defaultImage: '/images/categories/yangi-biznes.jpg' },
};

// ============================================================
// Reels yig'ish (comments to'g'ri formatda)
// ============================================================
function buildReelsFrom(items, { typeLabelKey, link, fallbackAvatarBg, itemType }, currentUser, t) {
  if (!Array.isArray(items)) return [];
  const typeLabel = t(typeLabelKey);
  return items.flatMap(item => {
    const mediaArray = [...(item.media || []), ...(item.images || [])];
    const videos = mediaArray.filter(url =>
      /\.(mp4|webm|mov|avi|m3u8|ts|mkv)$/i.test(url) ||
      url.includes('/video/') ||
      url.includes('video')
    );
    if (!videos.length) return [];

    const ownerObj = typeof item.userId === 'object' && item.userId !== null ? item.userId : null;
    const userName = ownerObj?.fullName || ownerObj?.full_name || ownerObj?.email || 'Foydalanuvchi';
    const avatarUrl = ownerObj?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${fallbackAvatarBg}&color=fff&rounded=true&size=60`;

    return videos.map((videoUrl) => ({
      id: item._id,
      videoUrl,
      title: item.title || item.name,
      typeLabel,
      link: link(item),
      userId: ownerObj?._id,
      userName,
      avatarUrl,
      itemType,
      liked: item.likes?.includes(currentUser?.id) || false,
      likesCount: item.likes?.length || 0,
      comments: (item.comments || []).map(c => ({
        id: c._id,
        userName: c.userId?.fullName || c.userId?.full_name || 'Foydalanuvchi',
        avatarUrl: c.userId?.avatar_url || '/images/placeholder.jpg',
        text: c.text,
        replies: (c.replies || []).map(r => ({
          id: r._id,
          userName: r.userId?.fullName || r.userId?.full_name || 'Foydalanuvchi',
          avatarUrl: r.userId?.avatar_url || '/images/placeholder.jpg',
          text: r.text,
        })),
      })),
    }));
  });
}

function buildPostReels(posts, currentUser, t) {
  return (posts || [])
    .filter(post => post.videoUrl)
    .map(post => {
      const owner = post.userId;
      return {
        id: post._id,
        videoUrl: post.videoUrl,
        title: post.title,
        typeLabel: t('marketplace.reels.post'),
        link: `/posts/${post._id}`,
        userId: owner?._id,
        userName: owner?.full_name || owner?.fullName || 'Foydalanuvchi',
        avatarUrl: owner?.avatar_url || '/images/placeholder.jpg',
        itemType: 'post',
        liked: post.likes?.includes(currentUser?.id) || false,
        likesCount: post.likes?.length || 0,
        comments: (post.comments || []).map(c => ({
          id: c._id,
          userName: c.userId?.fullName || c.userId?.full_name || 'Foydalanuvchi',
          avatarUrl: c.userId?.avatar_url || '/images/placeholder.jpg',
          text: c.text,
          replies: (c.replies || []).map(r => ({
            id: r._id,
            userName: r.userId?.fullName || r.userId?.full_name || 'Foydalanuvchi',
            avatarUrl: r.userId?.avatar_url || '/images/placeholder.jpg',
            text: r.text,
          })),
        })),
      };
    });
}

const VISIBLE_DEFAULT = 8;

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [reels, setReels] = useState([]);

  const isPremium = user?.isPremium || user?.user_metadata?.isPremium || false;

  // ===== REELS YUKLASH =====
  useEffect(() => {
    const fetchReels = async () => {
      try {
        const [locRes, eqRes, servRes, postRes] = await Promise.all([
          getLocations({ limit: 50 }),
          getEquipment({ limit: 50 }),
          getServiceProviders({ limit: 50 }),
          getPosts(),
        ]);
        setReels([
          ...buildReelsFrom(locRes.data, {
            typeLabelKey: 'marketplace.reels.location',
            link: (i) => `/location/${i._id}`,
            fallbackAvatarBg: '00E5FF',
            itemType: 'location'
          }, user, t),
          ...buildReelsFrom(eqRes.data, {
            typeLabelKey: 'marketplace.reels.equipment',
            link: (i) => `/equipment/${i._id}`,
            fallbackAvatarBg: 'F59E0B',
            itemType: 'equipment'
          }, user, t),
          ...buildReelsFrom(servRes.data, {
            typeLabelKey: 'marketplace.reels.service',
            link: (i) => `/services/${i.service_category}`,
            fallbackAvatarBg: '8B5CF6',
            itemType: 'service'
          }, user, t),
          ...buildPostReels(postRes.data, user, t),
        ]);
      } catch (err) {
        console.error('Reels yuklanmadi:', err);
      }
    };
    fetchReels();
  }, [user, t]);

  // ===== KATEGORIYALAR =====
  useEffect(() => {
    getLevel1()
      .then((res) => {
        const data = res.data.map((item) => {
          const meta = categoryMeta[item.key];
          const name = t(`categories.${item.key}`, { defaultValue: item.key });
          return {
            key: item.key,
            name,
            emoji: meta?.icon || '📦',
            imageUrl: item.level1_icon || null,
          };
        });
        setCategories(data);
      })
      .catch(console.error);
  }, [t, i18n.language]);

  // ===== HERO MATNLARI =====
  const heroPhrases = t('home.heroPhrases', { returnObjects: true }) || [];

  useEffect(() => {
    if (heroPhrases.length === 0) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % heroPhrases.length);
        setIsFading(false);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, [heroPhrases]);

  const visible = showAll ? categories : categories.slice(0, VISIBLE_DEFAULT);

  return (
    <div className="home-container">
      {/* HERO */}
      <div className="hero-section">
        <video className="hero-bg-video" autoPlay muted loop playsInline>
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
         <div className="hero-title-wrapper">
  <h1 className={`hero-title ${isFading ? 'fade-out' : 'fade-in'}`}>
    {heroPhrases[currentPhraseIndex] || 'G.R.U'}
  </h1>
</div>

          <div className="hero-cta-buttons">
            <button className="hero-cta-btn cta-ai" onClick={() => navigate('/ai-assistant')}>
              <Sparkles size={18} />
              <span>{t('home.ctaAi')}</span>
            </button>
            <button className="hero-cta-btn cta-marketplace" onClick={() => navigate('/marketplace')}>
              <ShoppingBag size={18} />
              <span>{t('home.ctaMarketplace')}</span>
            </button>
            <button className="hero-cta-btn cta-digitalize" onClick={() => navigate('/business')}>
              <Zap size={18} />
              <span>{t('home.ctaBusiness')}</span>
            </button>
          </div>

          {isPremium && (
            <div className="hero-premium-badge">
              <Crown size={18} />
              <span>{t('home.premiumBadge')}</span>
            </div>
          )}
        </div>
      </div>

      {/* KATEGORIYALAR */}
      <section className="cats-section">
        <div className="cats-header">
          <h2 className="cats-title">{t('home.categoriesTitle')}</h2>
          <p className="cats-sub">{t('home.categoriesSub')}</p>
        </div>

        <div className="cats-grid">
          {visible.map((cat, idx) => (
            <CategoryCard
              key={cat.key}
              title={cat.name}
              emoji={cat.emoji}
              imageUrl={cat.imageUrl}
              linkTo={`/category/${encodeURIComponent(cat.key)}`}
              delay={idx * 0.05}
              colorIndex={idx}
            />
          ))}
        </div>

        {categories.length > VISIBLE_DEFAULT && (
          <div className="cats-btn-wrap">
            <button className="cats-show-btn" onClick={() => setShowAll((prev) => !prev)}>
              {showAll
                ? `↑ ${t('home.showLess')}`
                : `↓ ${t('home.showAll')} (${categories.length})`}
            </button>
          </div>
        )}
      </section>

      {/* BOZOR — KIRISH BO'LIMI (TARJIMA QILINGAN) */}
      <section className="home-market-teaser">
        <div className="cats-header">
          <h2 className="cats-title">{t('home.marketplaceTitle', 'Bozor')}</h2>
          <p className="cats-sub">{t('home.marketplaceSub', 'Kerakli bo\'limni tanlang')}</p>
        </div>
        <div className="home-market-grid">
          <button className="home-market-card" onClick={() => navigate('/marketplace/locations')}>
            <MapPin size={30} />
            <span>{t('home.marketplaceLocations', 'Joylar')}</span>
          </button>
          <button className="home-market-card" onClick={() => navigate('/marketplace/products')}>
            <Package size={30} />
            <span>{t('home.marketplaceProducts', 'Tovarlar')}</span>
          </button>
          <button className="home-market-card" onClick={() => navigate('/marketplace/services')}>
            <Briefcase size={30} />
            <span>{t('home.marketplaceServices', 'Xizmatlar')}</span>
          </button>
          <button className="home-market-card" onClick={() => navigate('/marketplace/bank')}>
            <img
              src="/images/logo/universalbank.jpg"
              alt={t('home.marketplaceBankAlt', 'Bank xizmatlari')}
              className="home-market-bank-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/placeholder-bank.jpg';
              }}
            />
            <span>{t('home.marketplaceBank', 'Bank xizmatlari')}</span>
          </button>
        </div>
      </section>

      {/* REELS */}
      {reels.length > 0 && (
        <MarketplaceReels
          reels={reels}
          currentUser={user}
          variant="grid2"
          onReelUpdate={(reelId, updates) => {
            setReels(prev => prev.map(r => r.id === reelId ? { ...r, ...updates } : r));
          }}
        />
      )}
    </div>
  );
}