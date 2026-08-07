// Footer.jsx
import {
  FiHeart, FiMail, FiPhone, FiMapPin,
  FiSend, FiInstagram, FiYoutube, FiLinkedin, FiGithub, FiTwitter,
  FiArrowRight, FiHome, FiGrid, FiInfo, FiHelpCircle,
  FiFileText, FiShield, FiPhoneCall, FiArrowUp
} from 'react-icons/fi';
import { FaApple, FaGooglePlay, FaTelegramPlane } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';   // <-- qo‘shildi
import '../../styles/footer.css';

export default function Footer() {
  const { t } = useTranslation();                // <-- i18next hook
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[var(--bg)] border-t border-[var(--border)] py-6 mt-12 footer">
      <div className="footer-container">
        {/* ===== ASOSIY GRID ===== */}
        <div className="footer-grid">

          {/* 1 – Kompaniya haqida */}
          <div className="footer-col">
            <div className="footer-brand">
              <span>G.R.U</span>
              <span className="badge">Corp</span>
            </div>
            <p className="footer-description">
              {t('footer.description')}
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="Telegram"><FaTelegramPlane size={18} /></a>
              <a href="#" aria-label="Instagram"><FiInstagram size={18} /></a>
              <a href="#" aria-label="YouTube"><FiYoutube size={18} /></a>
              <a href="#" aria-label="GitHub"><FiGithub size={18} /></a>
              <a href="#" aria-label="LinkedIn"><FiLinkedin size={18} /></a>
              <a href="#" aria-label="Twitter"><FiTwitter size={18} /></a>
            </div>
          </div>

          {/* 2 – Sahifalar */}
          <div className="footer-col">
            <h4 className="footer-title">{t('footer.pagesTitle')}</h4>
            <ul className="footer-links">
              <li><Link to="/"><FiHome size={14} /> {t('footer.links.home')}</Link></li>
              <li><Link to="/marketplace"><FiGrid size={14} /> {t('footer.links.marketplace')}</Link></li>
              <li><Link to="/about"><FiInfo size={14} /> {t('footer.links.about')}</Link></li>
              <li><Link to="/contact"><FiPhoneCall size={14} /> {t('footer.links.contact')}</Link></li>
              <li><Link to="/faq"><FiHelpCircle size={14} /> {t('footer.links.faq')}</Link></li>
            </ul>
          </div>

          {/* 3 – Xizmatlar va huquqiy */}
          <div className="footer-col">
            <h4 className="footer-title">{t('footer.servicesTitle')}</h4>
            <ul className="footer-links">
              <li><Link to="/add-listing"><FiFileText size={14} /> {t('footer.links.addListing')}</Link></li>
              <li><Link to="/profile"><FiShield size={14} /> {t('footer.links.profile')}</Link></li>
              <li><Link to="/terms"><FiFileText size={14} /> {t('footer.links.terms')}</Link></li>
              <li><Link to="/privacy"><FiShield size={14} /> {t('footer.links.privacy')}</Link></li>
            </ul>
          </div>

          {/* 4 – Ilova va aloqa */}
          <div className="footer-col">
            <h4 className="footer-title">{t('footer.appsTitle')}</h4>
            <div className="footer-apps">
              <a href="#">
                <FaApple size={18} />
                <span>
                  <small>{t('footer.apps.download')}</small>
                  {t('footer.apps.appStore')}
                </span>
              </a>
              <a href="#">
                <FaGooglePlay size={16} />
                <span>
                  <small>{t('footer.apps.download')}</small>
                  {t('footer.apps.googlePlay')}
                </span>
              </a>
            </div>
            <div className="footer-contact">
              <p><FiMail size={14} /> {t('footer.contact.email')}</p>
              <p><FiPhone size={14} /> {t('footer.contact.phone')}</p>
              <p><FiMapPin size={14} /> {t('footer.contact.address')}</p>
            </div>
          </div>
        </div>

        {/* ===== OBUNA FORMASI ===== */}
        <div className="footer-subscribe">
          <div className="footer-subscribe-text">
            <span>{t('footer.subscribe.title')}</span>
            <p>{t('footer.subscribe.desc')}</p>
          </div>
          <form className="footer-subscribe-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.subscribe.placeholder')}
              required
            />
            <button type="submit">
              {subscribed
                ? t('footer.subscribe.thankYou')
                : <>{t('footer.subscribe.button')} <FiSend size={16} /></>
              }
            </button>
          </form>
        </div>

        {/* ===== COPYRIGHT ===== */}
        <div className="footer-copyright">
          <p>{t('footer.copyright.text', { year: currentYear })}</p>
          <p className="footer-made-with">
            <FiHeart size={13} className="heart" />
            {t('footer.copyright.madeWith')}
          </p>
        </div>
      </div>

      {/* ===== YUQORIGA QAYTISH (position:fixed) ===== */}
      <button className="footer-to-top" onClick={scrollToTop} aria-label={t('common.back') || 'Yuqoriga'}>
        <FiArrowUp size={18} />
      </button>
    </footer>
  );
}