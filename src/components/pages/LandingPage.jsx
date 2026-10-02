import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] =
    useState('entering');

  useEffect(() => {
    document.body.classList.add('landing-page-active');

    const reducedMotionMedia = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    const timers = [];

    const openHomePage = () => {
      document.body.classList.remove(
        'landing-page-active'
      );

      navigate('/home', {
        replace: true,
      });
    };

    if (reducedMotionMedia.matches) {
      const navigationTimer = window.setTimeout(
        openHomePage,
        500
      );

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

      timers.push(
        activeTimer,
        fadeTimer,
        navigationTimer
      );
    }

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });

      document.body.classList.remove(
        'landing-page-active'
      );
    };
  }, [navigate]);

  return (
    <main
      className={`gru-splash ${animationPhase}`}
      role="status"
      aria-live="polite"
      aria-label="G.R.U yuklanmoqda"
    >
      {/* Orqa fon effektlari */}
      <div
        className="gru-splash__background"
        aria-hidden="true"
      >
        <div className="gru-splash__orb gru-splash__orb--left" />
        <div className="gru-splash__orb gru-splash__orb--right" />
      </div>

      {/* Asosiy kontent */}
      <div className="gru-splash__content">
        <div className="gru-splash__logo-container">
          <div
            className="gru-splash__glow"
            aria-hidden="true"
          />

          <h1
            className="gru-splash__logo"
            aria-label="G.R.U"
          >
            <span
              className="gru-splash__letter"
              style={{
                '--letter-delay': '0.25s',
              }}
            >
              G
            </span>

            <span
              className="gru-splash__dot"
              style={{
                '--dot-delay': '0.4s',
              }}
              aria-hidden="true"
            />

            <span
              className="gru-splash__letter"
              style={{
                '--letter-delay': '0.45s',
              }}
            >
              R
            </span>

            <span
              className="gru-splash__dot"
              style={{
                '--dot-delay': '0.6s',
              }}
              aria-hidden="true"
            />

            <span
              className="gru-splash__letter"
              style={{
                '--letter-delay': '0.65s',
              }}
            >
              U
            </span>
          </h1>

          <p className="gru-splash__tagline">
            Yangi imkoniyat
          </p>
        </div>

        {/* Yuklanish chizig‘i */}
        <div
          className="gru-splash__loader"
          aria-hidden="true"
        >
          <div className="gru-splash__loader-bar" />
        </div>
      </div>
    </main>
  );
}