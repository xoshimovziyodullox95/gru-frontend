/* ============================================================
   MARKETPLACE TABBAR — pastki menyu (Asosiy, Savat, Qo'shish, Chat, Profil)
   Marketplace ichida va bosh sahifada (floating) bir xil ishlatiladi.
   ============================================================ */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, PlusCircle, MessageCircle, User, Clapperboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/user';
import { getUnreadCount as getChatUnreadCount } from '../services/chat';
import { getImageUrl } from '../utils/imageUrl';
import { T } from '../utils/T';
import '../../styles/marketplaceLayout.css';

const formatBadge = (n) => (n > 99 ? '99+' : n);

export default function MarketplaceTabbar({ homePath = '/marketplace', floating = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [cartCount, setCartCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [profileAvatar, setProfileAvatar] = useState('');
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  /* ---------- Avatar ---------- */
  useEffect(() => {
    if (!user) return;
    getUserProfile()
      .then((res) => setProfileAvatar(res.data.avatar_url || ''))
      .catch(() => {});
  }, [user]);

  // Profilda rasm almashtirilsa — qayta yuklamasdan yangilanadi
  useEffect(() => {
    const onAvatar = (e) => setProfileAvatar(e.detail || '');
    window.addEventListener('zumo:avatar', onAvatar);
    return () => window.removeEventListener('zumo:avatar', onAvatar);
  }, []);

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

  const isActive = (path) => {
    if (path === '/marketplace') return location.pathname === '/marketplace';
    return location.pathname.startsWith(path);
  };

  const userName =
    user?.user_metadata?.full_name || user?.fullName || T('User');

  const avatarUrl =
    (profileAvatar && getImageUrl(profileAvatar)) ||
    user?.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=00E5FF&color=fff&rounded=true&size=36`;

  const homeActive = location.pathname === homePath;

  return (
    <>
      <nav className={`mkt-tabbar ${floating ? 'mkt-tabbar--floating' : ''}`}>
        {/* Asosiy — ZUMO logo */}
        <button
          type="button"
          className={`mkt-tab ${homeActive ? 'mkt-tab--active' : ''}`}
          onClick={() => navigate(homePath)}
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
          onClick={() => navigate('/cart', { state: { from: location.pathname + location.search, fromHome: homePath } })}
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
          data-tour="add"
          onClick={() => setAddMenuOpen((open) => !open)}
          aria-expanded={addMenuOpen}
          aria-label={t('nav.add', 'Qo‘shish')}
        >
          <PlusCircle size={28} strokeWidth={2} />
          <span>{t('nav.add', 'Qo‘shish')}</span>
        </button>

        {/* Chat */}
        <button
          type="button"
          className={`mkt-tab ${isActive('/chat') ? 'mkt-tab--active' : ''}`}
          data-tour="chat"
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
          data-tour="profile"
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
    </>
  );
}
