/* ============================================================
   MARKETPLACE LAYOUT — 2 rejim:
   - mode="shell"  → slide-up animatsiya (marketplace sahifalari)
   - mode="layout" → oddiy layout (butun ilova uchun)
   ============================================================ */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShoppingCart,
  PlusCircle,
  MessageCircle,
  Bell,
  Wallet,
  User,
  Clapperboard,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/user';
import { getUnreadCount as getNotifUnreadCount } from '../services/notifications';
import { getUnreadCount as getChatUnreadCount } from '../services/chat';
import '../../styles/marketplaceLayout.css';

const formatBadge = (n) => (n > 99 ? '99+' : n);

export default function MarketplaceLayout({ children, mode = 'shell', homePath = '/marketplace' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const resolvedHomePath = location.pathname === '/cart'
    ? (location.state?.fromHome || homePath)
    : homePath;
  const closeTarget = location.pathname === resolvedHomePath ? '/home' : resolvedHomePath;

  const isLayout = mode === 'layout';

  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [profileAvatar, setProfileAvatar] = useState('');
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  /* ---------- Kirish animatsiyasi ---------- */
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* ---------- Avatar ---------- */
  useEffect(() => {
    if (!user) return;
    getUserProfile()
      .then((res) => setProfileAvatar(res.data.avatar_url || ''))
      .catch(() => {});
  }, [user]);

  /* ---------- Chat unread ---------- */
  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      getChatUnreadCount()
        .then((res) => setChatUnread(res.data.count || 0))
        .catch(() => {});
    };
    refresh();
    window.addEventListener('chatRead', refresh);
    const interval = setInterval(refresh, 30000);
    return () => {
      window.removeEventListener('chatRead', refresh);
      clearInterval(interval);
    };
  }, [user]);

  /* ---------- Bildirishnoma unread ---------- */
  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      getNotifUnreadCount()
        .then((res) => setNotifUnread(res.data.count || 0))
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [user]);

  /* ---------- Savat ---------- */
  useEffect(() => {
    const update = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        setCartCount(0);
      }
    };
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  /* ---------- Chiqish (faqat shell rejimida) ---------- */
  const handleClose = () => {
    if (isLayout) return;
    setClosing(true);
    window.setTimeout(() => {
      navigate(closeTarget, { replace: true });
    }, 300);
  };

  const isActive = (path) => {
    if (path === '/marketplace') return location.pathname === '/marketplace';
    return location.pathname.startsWith(path);
  };

  const userName =
    user?.user_metadata?.full_name || user?.fullName || 'User';

  const avatarUrl =
    profileAvatar ||
    user?.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=00E5FF&color=fff&rounded=true&size=36`;

  const homeActive = location.pathname === resolvedHomePath;

  return (
    <div
      className={`mkt-shell ${isLayout ? 'mkt-shell--layout' : ''} ${
        mounted && !closing ? 'mkt-shell--open' : ''
      } ${closing ? 'mkt-shell--closing' : ''}`}
    >
      {/* ==================== TOP NAVBAR ==================== */}
      <header className="mkt-navbar">
        <button
          type="button"
          className="mkt-navbar__logo"
            onClick={() => navigate(resolvedHomePath)}
        >
          ZUMO
        </button>

        <div className="mkt-navbar__actions">
          <button
            type="button"
            className="mkt-navbar__btn"
            onClick={() => alert(t('wallet.soon'))}
            aria-label={t('tooltips.wallet', 'Hamyon')}
          >
            <Wallet size={19} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            className="mkt-navbar__btn"
            onClick={() => navigate('/notifications')}
            aria-label={t('tooltips.notifications', 'Bildirishnoma')}
          >
            <Bell size={19} strokeWidth={2.2} />
            {notifUnread > 0 && (
              <span className="mkt-badge mkt-badge--red">
                {formatBadge(notifUnread)}
              </span>
            )}
          </button>

          {/* X — faqat shell rejimida */}
          {!isLayout && (
            <button
              type="button"
              className="mkt-navbar__btn mkt-navbar__btn--close"
              onClick={handleClose}
              aria-label={t('common.close', 'Yopish')}
            >
              <X size={20} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </header>

      {/* ==================== CONTENT ==================== */}
      <main className="mkt-content">{children}</main>

      {/* ==================== BOTTOM NAV ==================== */}
      <nav className="mkt-tabbar">
        {/* Asosiy — ZUMO logo */}
        <button
          type="button"
          className={`mkt-tab ${homeActive ? 'mkt-tab--active' : ''}`}
          onClick={() => navigate(resolvedHomePath)}
        >
          <img
            src="/ZUMO.png"
            alt="ZUMO"
            className={`mkt-tab__logo ${
              homeActive ? 'mkt-tab__logo--active' : ''
            }`}
          />
          <span>{t('nav.home', 'Asosiy')}</span>
        </button>

        {/* Savat */}
        <button
          type="button"
          className={`mkt-tab ${isActive('/cart') ? 'mkt-tab--active' : ''}`}
          onClick={() => navigate('/cart', { state: { from: location.pathname + location.search, fromHome: resolvedHomePath } })}
        >
          <span className="mkt-tab__iconwrap">
            <ShoppingCart size={23} strokeWidth={isActive('/cart') ? 2.5 : 1.9} />
            {cartCount > 0 && <span className="mkt-badge">{cartCount}</span>}
          </span>
          <span>{t('nav.cart', 'Savat')}</span>
        </button>

        {/* Qo'shish */}
        <button
          type="button"
          className="mkt-tab mkt-tab--add"
          onClick={() => setAddMenuOpen((open) => !open)}
          aria-expanded={addMenuOpen}
          aria-label={t('nav.add', 'Qo‘shish')}
        >
          <PlusCircle size={32} strokeWidth={2} />
          <span>{t('nav.add', 'Qo‘shish')}</span>
        </button>

        {/* Chat */}
        <button
          type="button"
          className={`mkt-tab ${isActive('/chat') ? 'mkt-tab--active' : ''}`}
          onClick={() => navigate('/chat')}
        >
          <span className="mkt-tab__iconwrap">
            <MessageCircle size={23} strokeWidth={isActive('/chat') ? 2.5 : 1.9} />
            {chatUnread > 0 && (
              <span className="mkt-badge mkt-badge--red">
                {formatBadge(chatUnread)}
              </span>
            )}
          </span>
          <span>{t('nav.chat', 'Chat')}</span>
        </button>

        {/* Profil */}
        <button
          type="button"
          className={`mkt-tab ${
            isActive('/marketplace/profile') ? 'mkt-tab--active' : ''
          }`}
          onClick={() => navigate('/marketplace/profile')}
        >
          {user ? (
            <img src={avatarUrl} alt="" className="mkt-tab__avatar" />
          ) : (
            <User size={23} strokeWidth={1.9} />
          )}
          <span>{t('nav.profile', 'Profil')}</span>
        </button>
      </nav>

      {addMenuOpen && (
        <>
          <button
            type="button"
            className="mkt-add-menu-backdrop"
            aria-label={t('common.close', 'Yopish')}
            onClick={() => setAddMenuOpen(false)}
          />
          <div className="mkt-add-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setAddMenuOpen(false); navigate('/add-listing'); }}
            >
              <PlusCircle size={20} /> {t('nav.addListing', 'E’lon joylash')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => { setAddMenuOpen(false); navigate('/add-video'); }}
            >
              <Clapperboard size={20} /> {t('nav.addVideo', 'Video post qo‘shish')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
