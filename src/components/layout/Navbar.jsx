// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/user';
import { getUnreadCount as getNotifUnreadCount } from '../services/notifications';
import { getUnreadCount as getChatUnreadCount } from '../services/chat';
import {
  ShoppingCart,
  MessageCircle,
  Menu,
  X,
  PlusCircle,
  Bell,
  Clapperboard,
  LayoutDashboard,
  Home,
  Wallet,
} from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import '../../styles/navbar.css';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, loading, signOut, getUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [profileAvatar, setProfileAvatar] = useState('');
  const [activeTab, setActiveTab] = useState('business');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  const role = user?.user_metadata?.role || 'user';
  const userName = user?.user_metadata?.full_name || user?.fullName || 'User';

  const getProfileLink = () => {
    const r = getUserRole();
    if (r === 'admin') return '/admin-dashboard';
    if (r === 'bank_employee') return '/bank-dashboard';
    return '/profile';
  };

  const languages = [
    { code: 'uz', label: 'Uzbek', flag: '🇺🇿' },
    { code: 'ru', label: 'Rus', flag: '🇷🇺' },
    { code: 'en', label: 'Eng', flag: '🇬🇧' },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };

  // Tashqariga bosilganda til menyusini yopish
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Profil rasmi
  useEffect(() => {
    if (!user) return;
    getUserProfile()
      .then((res) => setProfileAvatar(res.data.avatar_url || ''))
      .catch(() => {});
  }, [user]);

  // Chat va bildirishnomalar soni
  useEffect(() => {
    if (!user) return;
    const fetchChat = () => {
      getChatUnreadCount()
        .then((res) => setChatUnreadCount(res.data.count || 0))
        .catch(() => {});
    };
    fetchChat();
    const interval = setInterval(fetchChat, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchNotif = () => {
      getNotifUnreadCount()
        .then((res) => setNotifUnreadCount(res.data.count || 0))
        .catch(() => {});
    };
    fetchNotif();
    const interval = setInterval(fetchNotif, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Savat
  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };
  useEffect(() => {
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  // Scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(tab === 'business' ? '/home' : '/physic');
  };

  const avatarUrl =
    profileAvatar ||
    user?.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=00E5FF&color=fff&rounded=true&size=36`;

  const isActive = (path) => location.pathname === path;

  const Tooltip = ({ children }) => (
    <span className="gru-tooltip">
      <span className="tooltip-text">{children}</span>
    </span>
  );

  if (loading) return <div className="gru-navbar-placeholder" />;

  return (
    <>
      {/* ===== YUQORI NAVBAR ===== */}
      <nav className={`gru-navbar ${scrolled ? 'gru-navbar-scrolled' : ''}`}>
        <div className="gru-navbar-container">
          <button
            className="gru-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menyu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="gru-navbar-left">
            <button className="gru-logo" onClick={() => navigate('/home')}>
              G.R.U
            </button>
            <div className="gru-tabs gru-tabs-desktop">
              <button
                className={`gru-tab ${activeTab === 'business' ? 'active' : ''}`}
                onClick={() => handleTabChange('business')}
              >
                {t('nav.business')}
              </button>
              <button
                className={`gru-tab ${activeTab === 'physic' ? 'active' : ''}`}
                onClick={() => handleTabChange('physic')}
              >
                {t('nav.physic')}
              </button>
            </div>
          </div>

          <div className={`gru-tabs-panel ${mobileMenuOpen ? 'gru-tabs-panel-open' : ''}`}>
            <button
              className={`gru-tab ${activeTab === 'business' ? 'active' : ''}`}
              onClick={() => {
                handleTabChange('business');
                setMobileMenuOpen(false);
              }}
            >
              {t('nav.business')}
            </button>
            <button
              className={`gru-tab ${activeTab === 'physic' ? 'active' : ''}`}
              onClick={() => {
                handleTabChange('physic');
                setMobileMenuOpen(false);
              }}
            >
              {t('nav.physic')}
            </button>
          </div>

          <div className="gru-navbar-right">
            <Link to="/cart" className="gru-nav-link gru-desktop-only" style={{ position: 'relative' }}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              <Tooltip>{t('tooltips.cart')}</Tooltip>
            </Link>

            <button
              type="button"
              className="gru-nav-link"
              onClick={() => alert('Hamyon — tez kunda!')}
              style={{ position: 'relative' }}
            >
              <Wallet size={20} />
              <Tooltip>{t('tooltips.wallet')}</Tooltip>
            </button>

            <Link to="/chat" className="gru-nav-link gru-desktop-only" style={{ position: 'relative' }}>
              <MessageCircle size={20} />
              {chatUnreadCount > 0 && (
                <span className="cart-badge" style={{ background: '#ff4444' }}>
                  {chatUnreadCount}
                </span>
              )}
              <Tooltip>{t('tooltips.messages')}</Tooltip>
            </Link>

            {user && (
              <Link to="/notifications" className="gru-nav-link" style={{ position: 'relative' }}>
                <Bell size={20} />
                {notifUnreadCount > 0 && (
                  <span className="cart-badge" style={{ background: '#ff4444' }}>
                    {notifUnreadCount}
                  </span>
                )}
                <Tooltip>{t('tooltips.notifications')}</Tooltip>
              </Link>
            )}

            {role === 'business' && (
              <Link to="/dashboard" className="gru-nav-link gru-desktop-only">
                <LayoutDashboard size={20} />
              </Link>
            )}

            <div className="gru-nav-link gru-desktop-only">
              <ThemeToggle />
            </div>

            {user && (
              <Link
                to="/add-listing"
                className="gru-nav-link gru-add-listing-btn gru-desktop-only"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#00E5FF',
                  color: '#0a0a0a',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00BFFF';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00E5FF';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <PlusCircle size={18} />
                <span>{t('nav.addListing')}</span>
              </Link>
            )}

           {user && (
  <Link
    to="/add-video"
    className="gru-nav-link gru-add-video-btn gru-desktop-only"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      color: '#fff',
      padding: '6px 14px',
      borderRadius: '20px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      textDecoration: 'none',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.05)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
    }}
  >
    <Clapperboard size={18} />
    <span>{t('nav.addVideo', "Video qo'shish")}</span>
  </Link>
)}

            {user ? (
              <Link to={getProfileLink()} className="gru-avatar-btn gru-desktop-only">
                <img src={avatarUrl} alt="Avatar" className="gru-avatar-img" />
              </Link>
            ) : (
              <Link to="/login" className="gru-nav-link">{t('nav.login')}</Link>
            )}

            {/* 🔥 TIL DROPDOWN — ENG O'NG CHEKKA */}
            <div className="gru-lang-wrapper" ref={langMenuRef}>
              <button className="gru-lang-btn" onClick={() => setLangMenuOpen(!langMenuOpen)}>
                {currentLang.flag}
              </button>
              {langMenuOpen && (
                <div className="gru-lang-dropdown">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`gru-lang-option ${i18n.language === lang.code ? 'active' : ''}`}
                      onClick={() => changeLanguage(lang.code)}
                    >
                      <span className="lang-flag">{lang.flag}</span>
                      <span className="lang-label">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MOBIL PASTKI PANEL ===== */}
      {user && (
        <div className="gru-bottom-nav">
          <Link to="/home" className={`gru-bottom-nav-item ${isActive('/home') ? 'active' : ''}`}>
            <Home size={24} />
            <span>Bosh</span>
          </Link>
          <Link to="/cart" className={`gru-bottom-nav-item ${isActive('/cart') ? 'active' : ''}`} style={{ position: 'relative' }}>
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="bottom-badge">{cartCount}</span>}
            <span>Savat</span>
          </Link>
          <button type="button" className="gru-bottom-nav-item gru-bottom-add" onClick={() => setAddMenuOpen(true)}>
            <PlusCircle size={32} />
            <span>Qo'shish</span>
          </button>
          <Link to="/chat" className={`gru-bottom-nav-item ${isActive('/chat') ? 'active' : ''}`} style={{ position: 'relative' }}>
            <MessageCircle size={24} />
            {chatUnreadCount > 0 && <span className="bottom-badge" style={{ background: '#ff4444' }}>{chatUnreadCount}</span>}
            <span>Chat</span>
          </Link>
          <Link to={getProfileLink()} className={`gru-bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}>
            <img src={avatarUrl} alt="Avatar" className="gru-bottom-avatar-img" />
            <span>Profil</span>
          </Link>
        </div>
      )}

      {/* ===== QO'SHISH MODALI ===== */}
      {addMenuOpen && (
        <>
          <div className="gru-add-menu-overlay" onClick={() => setAddMenuOpen(false)} />
          <div className="gru-add-menu">
            <Link to="/add-listing" className="gru-add-menu-item" onClick={() => setAddMenuOpen(false)}>
              <PlusCircle size={20} /> {t('nav.addListing')}
            </Link>
            <Link to="/add-video" className="gru-add-menu-item" onClick={() => setAddMenuOpen(false)}>
              <Clapperboard size={20} /> {t('nav.addVideo', "Video qo'shish")}
            </Link>
          </div>
        </>
      )}
    </>
  );
}