import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useGuestMode, hasAccountBefore, getReturnPath, clearReturnPath } from '../../hooks/useGuestMode';
import '../../styles/landing.css';

export default function LandingPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { isGuest, enterAsGuest } = useGuestMode();
  const navigate = useNavigate();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const alreadyRegistered = hasAccountBefore();

  useEffect(() => {
    document.body.classList.add('landing-page-active');
    return () => document.body.classList.remove('landing-page-active');
  }, []);

  // Hero iboralar tarjima massividan
  const heroPhrases = t('landing.heroPhrases', { returnObjects: true }) || [
    "G.R.U har qayerda",
    "G.R.U siz uchun",
    "G.R.U bilan oson",
    "G.R.U kelajak sari",
    "G.R.U yangi imkoniyat",
    "G.R.U sizning hamkoringiz",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentPhraseIndex(prev => (prev + 1) % heroPhrases.length);
        setIsFading(false);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, [heroPhrases]);

  const handleGuestEnter = () => {
    if (loading) return;
    enterAsGuest();
    navigate('/home', { replace: true });
  };

  const handleContinueLoggedIn = () => {
    const dest = getReturnPath() || '/home';
    clearReturnPath();
    navigate(dest, { replace: true });
  };

  if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;

  const showThreeButtons = isGuest || !alreadyRegistered;

  return (
    <div className="landing-container">
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>

      <div className="landing-hero">
        <video className="landing-bg-video" autoPlay muted loop playsInline>
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        <div className="landing-overlay"></div>

        <div className="landing-content">
          <div className="landing-title-wrapper">
            <h1 className={`landing-title ${isFading ? 'fade-out' : 'fade-in'}`}>
              {heroPhrases[currentPhraseIndex]}
            </h1>
            <div className="title-glow"></div>
          </div>

          <div className="landing-divider">
            <span></span>
          </div>

          <div className="landing-buttons">
            {showThreeButtons ? (
              <>
                <Link to="/register" className="landing-btn primary">
                  <span>{t('landing.register')}</span>
                  <span className="btn-glow"></span>
                </Link>
                <div className="btn-divider">{t('landing.or')}</div>
                <Link to="/login" className="landing-btn secondary">
                  <span>{t('landing.login')}</span>
                </Link>
                <button type="button" onClick={handleGuestEnter} className="landing-btn glass">
                  <span>{t('landing.continue')}</span>
                </button>
              </>
            ) : user ? (
              <button type="button" onClick={handleContinueLoggedIn} className="landing-btn primary">
                <span>{t('landing.continue')}</span>
                <span className="btn-glow"></span>
              </button>
            ) : (
              <Link to="/login" className="landing-btn primary">
                <span>{t('landing.continue')}</span>
                <span className="btn-glow"></span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}