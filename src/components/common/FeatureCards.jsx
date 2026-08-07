import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gamepad2, Crown, ArrowRight, Zap, CreditCard, CheckCircle2, Video } from 'lucide-react'; // ✅ Video import qo'shildi
import '../../styles/featureCards.css';

const features = [
  {
    id: 'game',
    icon: Gamepad2,
    title: 'Mini-o‘yin',
    subtitle: 'Dam olish va yutish',
    description: 'Cheklangan formatda bo‘lsa ham zavq oling. Premiumda barcha darajalar, yutuqlar va maxsus rejimlar ochiq!',
    color: '#4B9EFF',
    gradient: 'linear-gradient(135deg, #4B9EFF, #0D47A1)',
    bg: 'rgba(75, 158, 255, 0.04)',
    border: 'rgba(75, 158, 255, 0.15)',
    link: '/game',
    btnText: 'O‘ynash',
    badgeIcon: Gamepad2,
    badgeText: 'Bepul',
    image: '/images/game-bg.png',
    isBackgroundCard: true,
  },
  {
    id: 'moment',
    icon: CreditCard,
    title: 'Moment karta',
    subtitle: 'Universal Bank',
    description: 'Tez va qulay karta! Universal Bankdan bepul “Moment” kartasini oling. Premium aʼzolar uchun 5 tagacha karta mutlaqo bepul!',
    color: '#0055A4',
    gradient: 'linear-gradient(135deg, #0055A4, #00387A)',
    link: 'https://universalbank.uz',
    btnText: 'Karta olish',
    badgeIcon: CreditCard,
    badgeText: 'Bepul',
    image: '/images/moment-card-bg.png',
    isBackgroundCard: true,
  },
  // 🔥 3-KARTA – Video darsliklar (Premium o‘rniga)
  {
    id: 'lessons',
    icon: Video,
    title: 'Video darsliklar',
    subtitle: 'Biznes va rivojlanish',
    description: 'Biznesingizni rivojlantirish uchun eng yaxshi video darsliklar, treninglar va master-klasslar!',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    bg: 'rgba(139, 92, 246, 0.04)',
    border: 'rgba(139, 92, 246, 0.15)',
    link: '/lessons',
    btnText: 'Darsliklarni ko‘rish',
    badgeIcon: Video,
    badgeText: 'Tez orada',
      image: '/images/lesson-card-bg.png',// placeholder rasm (agar bo‘lmasa, gradient ishlatiladi)
    isBackgroundCard: true,
  },
];

export default function FeatureCards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = user?.isPremium || user?.user_metadata?.isPremium || false;

  const handleClick = (feature) => {
    if (feature.link.startsWith('http')) {
      window.open(feature.link, '_blank');
    } else {
      navigate(feature.link);
    }
  };

  return (
    <div className="feature-cards-wrapper">
      <div className="feature-cards-header">
        <div className="feature-cards-title-group">
          <Zap size={24} className="feature-cards-icon" />
          <h2 className="feature-cards-title">Maxsus takliflar</h2>
        </div>
        <p className="feature-cards-sub">Siz uchun eng yaxshi imkoniyatlar</p>
      </div>

      <div className="feature-cards-grid">
        {features.map((feature) => {
          const Icon = feature.icon;
          const BadgeIcon = feature.badgeIcon;
          const isBackground = feature.isBackgroundCard && feature.image;

          return (
            <div
              key={feature.id}
              className={`feature-card ${isBackground ? 'feature-card-bg' : ''}`}
              style={{
                '--card-color': feature.color,
                '--card-bg': feature.bg,
                '--card-border': feature.border,
                borderColor: feature.border,
                background: feature.bg,
              }}
              onClick={() => handleClick(feature)}
            >
              {/* Badge */}
              <div className="feature-card-badge" style={{ background: feature.color }}>
                <BadgeIcon size={12} strokeWidth={2.5} />
                <span>{feature.badgeText}</span>
              </div>

              {/* Fonli kartalar (Game, Moment, Lessons) */}
              {isBackground ? (
                <>
                  <div className="feature-card-bg-image" style={{ backgroundImage: `url(${feature.image})` }} />
                  <div className="feature-card-overlay" />
                  <div className="feature-card-content">
                    <div className="feature-card-icon" style={{ color: '#fff' }}>
                      <Icon size={28} strokeWidth={1.8} />
                    </div>
                    <h3 className="feature-card-title" style={{ color: '#fff' }}>{feature.title}</h3>
                    <span className="feature-card-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {feature.subtitle}
                    </span>
                    <p className="feature-card-desc" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {feature.description}
                    </p>
                    <button
                      className="feature-card-btn"
                      style={{
                        background: feature.gradient,
                        color: '#fff',
                      }}
                    >
                      {feature.btnText} <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}