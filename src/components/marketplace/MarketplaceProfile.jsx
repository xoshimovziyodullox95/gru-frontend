/* ============================================================
   MARKETPLACE PROFILE — Yandex Go uslubidagi ODDIY profil
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Phone,
  CreditCard,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function MarketplaceProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  /* ------------------------------------------------------------
     Foydalanuvchi ma'lumotlari
     ------------------------------------------------------------ */

  const name =
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'Foydalanuvchi';

  const phone = user?.phone || user?.phoneNumber || '—';

  const avatar =
    user?.avatar_url || user?.avatarUrl || user?.user_metadata?.avatar_url;

  /* ------------------------------------------------------------
     Sozlamalar qatorlari
     ------------------------------------------------------------ */

  const rows = [
    {
      key: 'payment',
      icon: CreditCard,
      label: t('mkt.profile.payment', 'To‘lov usullari'),
    },
    {
      key: 'settings',
      icon: Settings,
      label: t('mkt.profile.settings', 'Sozlamalar'),
    },
    {
      key: 'help',
      icon: HelpCircle,
      label: t('mkt.profile.help', 'Yordam'),
    },
    {
      key: 'about',
      icon: Info,
      label: t('mkt.profile.about', 'Ilova haqida'),
    },
  ];

  /* ------------------------------------------------------------
     Chiqish
     ------------------------------------------------------------ */

  const handleLogout = async () => {
    try {
      if (typeof logout === 'function') {
        await logout();
      }
    } finally {
      navigate('/home', { replace: true });
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="mkt-profile">
      {/* ==================== HEADER KARTA ==================== */}
      <div className="mkt-profile__card">
        <div className="mkt-profile__avatar">
          {avatar ? (
            <img src={avatar} alt="" />
          ) : (
            <User size={32} strokeWidth={2} />
          )}
        </div>

        <div className="mkt-profile__info">
          <strong>{name}</strong>
          <span className="mkt-profile__phone">
            <Phone size={13} strokeWidth={2.2} />
            {phone}
          </span>
        </div>

        <span className="mkt-profile__verified" aria-hidden="true">
          <ShieldCheck size={18} strokeWidth={2.2} />
        </span>
      </div>

      {/* ==================== SOZLAMALAR RO'YXATI ==================== */}
      <div className="mkt-profile__list">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <button
              key={row.key}
              type="button"
              className="mkt-profile__row"
            >
              <span className="mkt-profile__row-icon">
                <Icon size={19} strokeWidth={2} />
              </span>

              <span className="mkt-profile__row-label">{row.label}</span>

              <ChevronRight
                size={18}
                strokeWidth={2}
                className="mkt-profile__row-arrow"
              />
            </button>
          );
        })}
      </div>

      {/* ==================== CHIQISH TUGMASI ==================== */}
      <button
        type="button"
        className="mkt-profile__logout"
        onClick={handleLogout}
      >
        <LogOut size={18} strokeWidth={2.2} />
        {t('mkt.profile.logout', 'Chiqish')}
      </button>

      {/* ==================== VERSIYA ==================== */}
      <p className="mkt-profile__version">
        ZUMO Marketplace · v1.0.0
      </p>
    </div>
  );
}