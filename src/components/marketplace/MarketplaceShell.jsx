/* Marketplace Shell — top navbar + tabs */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  House,
  MapPin,
  Package,
  Briefcase,
  User,
  X,
  Plus,
  MessageCircle,
} from 'lucide-react';

import '../../styles/marketplaceShell.css';

export default function MarketplaceShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { key: 'home', icon: House, path: '/marketplace', label: t('mkt.tabs.home', 'Asosiy') },
    { key: 'locations', icon: MapPin, path: '/marketplace/locations', label: t('mkt.tabs.locations', 'Joylar') },
    { key: 'products', icon: Package, path: '/marketplace/products', label: t('mkt.tabs.products', 'Tovarlar') },
    { key: 'services', icon: Briefcase, path: '/marketplace/services', label: t('mkt.tabs.services', 'Xizmatlar') },
    { key: 'profile', icon: User, path: '/marketplace/profile', label: t('mkt.tabs.profile', 'Profil') },
  ];

  const isActive = (path) => {
    if (path === '/marketplace') return location.pathname === '/marketplace';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="mkt-shell">
      {/* ==================== TOP NAVBAR ==================== */}
      <header className="mkt-topbar">
        <button
          type="button"
          className="mkt-topbar__btn mkt-topbar__btn--close"
          onClick={() => navigate('/home')}
          aria-label="Yopish"
        >
          <X size={20} strokeWidth={2.4} />
        </button>

        <span className="mkt-topbar__title">
          {t('mkt.brand', 'Marketplace')}
        </span>

        <button
          type="button"
          className="mkt-topbar__btn"
          onClick={() => navigate('/chat')}
          aria-label="Xabarlar"
        >
          <MessageCircle size={20} strokeWidth={2.2} />
        </button>
      </header>

      {/* ==================== TABS (2-qator) ==================== */}
      <nav className="mkt-tabs" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`mkt-tabs__tab ${active ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <Icon size={16} strokeWidth={active ? 2.6 : 2} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          className="mkt-tabs__add"
          onClick={() => navigate('/add-listing')}
        >
          <Plus size={15} strokeWidth={3} />
          <span>{t('mkt.add', 'Qo‘shish')}</span>
        </button>
      </nav>

      {/* ==================== CONTENT ==================== */}
      <main className="mkt-content">{children}</main>
    </div>
  );
}