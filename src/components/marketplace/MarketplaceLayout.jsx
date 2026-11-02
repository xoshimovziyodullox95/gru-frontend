/* ============================================================
   MARKETPLACE LAYOUT — 2 rejim:
   - mode="shell"  → slide-up animatsiya (marketplace sahifalari)
   - mode="layout" → oddiy layout (butun ilova uchun)
   ============================================================ */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Bell, Wallet } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getUnreadCount as getNotifUnreadCount } from '../services/notifications';
import '../../styles/marketplaceLayout.css';

import MarketplaceTabbar from './MarketplaceTabbar';
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
  const [notifUnread, setNotifUnread] = useState(0);

  /* ---------- Kirish animatsiyasi ---------- */
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

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

  /* ---------- Chiqish (faqat shell rejimida) ---------- */
  const handleClose = () => {
    if (isLayout) return;
    setClosing(true);
    window.setTimeout(() => {
      navigate(closeTarget, { replace: true });
    }, 300);
  };

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
      <MarketplaceTabbar homePath={resolvedHomePath} />
    </div>
  );
}
