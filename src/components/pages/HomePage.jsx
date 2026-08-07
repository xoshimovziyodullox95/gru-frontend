import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLevel1 } from '../services/categories';
import CategoryCard from '../common/CategoryCard';
import Marketplace from '../marketplace/Marketplace';
import { Crown, Sparkles, ShoppingBag, Zap } from 'lucide-react';
import '../../styles/home.css';

// Kategoriya uchun meta ma'lumotlar (rasm va emoji)
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

const VISIBLE_DEFAULT = 8;

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const isPremium = user?.isPremium || user?.user_metadata?.isPremium || false;

  // Kategoriyalarni yuklash
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

  // Hero matnlari
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
      {/* ===== HERO ===== */}
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

      {/* ===== KATEGORIYALAR ===== */}
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

      {/* ===== MARKETPLACE ===== */}
      <Marketplace initialLimit={6} />
    </div>
  );
}