// src/pages/PhysicPage.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ShoppingBag } from 'lucide-react';
import '../../styles/home.css';
import '../../styles/physicPage.css';

const physicCategories = [
  { key: 'otkazmalar', name: "To'lovlar va o'tkazmalar", emoji: '💸' },
  { key: 'moliya', name: 'Bank va moliya xizmatlari', emoji: '🏦' },
  { key: 'kochmasmulk', name: "Ko'chmas mulk va ta'mirlash", emoji: '🏗️' },
  { key: 'talim', name: "Ta'lim va kurslar", emoji: '🎓' },
  { key: 'shaxsiyxizmat', name: 'Shaxsiy xizmatlar (usta, tozalash)', emoji: '🔧' },
  { key: 'ish', name: 'Ish va frilans', emoji: '💼' },
  { key: 'sugurta', name: "Sug'urta xizmatlari", emoji: '🛡️' },
  { key: 'ikkilamchi', name: "Ikkilamchi bozor (foydalanilgan tovarlar)", emoji: '♻️' },
];

const COLOR_PALETTE = [
  ['#22c55e', '#0d9c56'],
  ['#f97316', '#c2410c'],
  ['#3b82f6', '#1d4ed8'],
  ['#a855f7', '#7e22ce'],
  ['#ef4444', '#b91c1c'],
  ['#14b8a6', '#0f766e'],
  ['#eab308', '#a16207'],
  ['#ec4899', '#be185d'],
];

export default function PhysicPage() {
  const { t } = useTranslation();

  return (
    <div className="home-container">
      {/* HERO (soddalashtirilgan) */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-title-wrapper">
            <h1 className="hero-title">GRU — har bir inson uchun</h1>
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
          </div>
        </div>
      </div>

      {/* KATEGORIYALAR */}
      <section className="cats-section">
        <div className="cats-header">
          <h2 className="cats-title">Jismoniy shaxslar uchun yo'nalishlar</h2>
          <p className="cats-sub">Tez orada ishga tushadi</p>
        </div>
        <div className="cats-grid">
          {physicCategories.map((cat, idx) => {
            const [colorFrom, colorTo] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
            return (
              <Link
                key={cat.key}
                to={`/physic/${cat.key}`}
                className="physic-card-modern"
                style={{
                  animationDelay: `${idx * 0.05}s`,
                  background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
                }}
              >
                <div className="physic-card-glass"></div>
                <div className="physic-card-glow"></div>
                <div className="physic-card-shimmer"></div>
                <div className="physic-card-border"></div>
                <span className="physic-card-emoji">{cat.emoji}</span>
                <span className="physic-card-title">{cat.name}</span>
                <span className="physic-card-badge">Tez kunda</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}