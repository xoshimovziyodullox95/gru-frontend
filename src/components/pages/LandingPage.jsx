import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/landing.css';

import { T } from '../utils/T';
export default function LandingPage() {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState('entering');

  useEffect(() => {
    document.body.classList.add('landing-page-active');

    const reducedMotionMedia = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    const timers = [];

    const openHomePage = () => {
      document.body.classList.remove('landing-page-active');

      navigate('/home', {
        replace: true,
      });
    };

    if (reducedMotionMedia.matches) {
      const navigationTimer = window.setTimeout(openHomePage, 500);
      timers.push(navigationTimer);
    } else {
      const activeTimer = window.setTimeout(() => {
        setAnimationPhase('active');
      }, 100);

      const fadeTimer = window.setTimeout(() => {
        setAnimationPhase('fading');
      }, 2200);

      const navigationTimer = window.setTimeout(() => {
        openHomePage();
      }, 2600);

      timers.push(activeTimer, fadeTimer, navigationTimer);
    }

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });

      document.body.classList.remove('landing-page-active');
    };
  }, [navigate]);

  return (
    <main
      className={`gru-splash ${animationPhase}`}
      role="status"
      aria-live="polite"
      aria-label={T('ZUMO yuklanmoqda')}
    >
      {/* Orqa fon effektlari */}
      <div className="gru-splash__background" aria-hidden="true">
        <div className="gru-splash__orb gru-splash__orb--left" />
        <div className="gru-splash__orb gru-splash__orb--right" />
      </div>

      {/* Asosiy kontent */}
      <div className="gru-splash__content">
        <div className="gru-splash__logo-container">
          <div className="gru-splash__glow" aria-hidden="true" />

          <img className="gru-splash__logo" src="/ZUMO.png" alt="" />
          <h1 className="gru-splash__wordmark" aria-label="ZUMO">
            {['Z', 'U', 'M', 'O'].map((letter, index) => (
              <span
                className="gru-splash__letter"
                style={{ '--letter-delay': `${0.25 + index * 0.15}s` }}
                key={letter}
              >
                {letter}
              </span>
            ))}
          </h1>

          <p className="gru-splash__tagline">{T('Yangi imkoniyat')}</p>
        </div>

        {/* Yuklanish chizig'i */}
        <div className="gru-splash__loader" aria-hidden="true">
          <div className="gru-splash__loader-bar" />
        </div>
      </div>
    </main>
  );
}
