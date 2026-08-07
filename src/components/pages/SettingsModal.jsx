// src/components/SettingsModal.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings, X, LogOut, QrCode, Bell, Shield, User,
  CheckCircle, Globe, Clock, Smartphone, Key, Users,
  ChevronRight, Crown, Eye, Lock, Database, Server,
  Briefcase, Calendar, Mail, Hash, Sun, Moon, Edit,
} from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import ActivityList from './ActivityList';
import ToggleSwitch from '../common/ToggleSwitch';
import ThemeToggle from '../common/ThemeToggle';
import '../../styles/settings.css';

// ============================================================
// 1. PROFESSIONAL ACCOUNT
// ============================================================
const ProfessionalAccountModal = ({ onClose, profile, isPremium }) => {
  const { t } = useTranslation();
  return (
    <div className="settings-submodal" onClick={onClose}>
      <div className="settings-submodal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-submodal-header">
          <h3><Briefcase size={20} /> {t('settings.professional')}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="settings-submodal-body">
          <div className="prof-item">
            <span>{t('settings.accountType')}</span>
            <span>{(profile?.role === 'business' || profile?.role === 'company') ? t('settings.accountTypeBusiness') : t('settings.accountTypeRegular')}</span>
          </div>
          <div className="prof-item">
            <span>{t('settings.premiumStatus')}</span>
            <span>{isPremium ? t('settings.premiumActive') : t('settings.premiumInactive')}</span>
          </div>
          {!isPremium && (
            <Link to="/premium" className="settings-link-btn">
              <Crown size={16} /> {t('settings.becomePremium')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 2. NOTIFICATIONS
// ============================================================
const NotificationsModal = ({ onClose }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    likes: true,
    comments: true,
    followers: true,
    messages: true,
  });

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const rows = [
    { key: 'likes', label: t('settings.notifLikes') },
    { key: 'comments', label: t('settings.notifComments') },
    { key: 'followers', label: t('settings.notifFollowers') },
    { key: 'messages', label: t('settings.notifMessages') },
  ];

  return (
    <div className="settings-submodal" onClick={onClose}>
      <div className="settings-submodal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-submodal-header">
          <h3><Bell size={20} /> {t('settings.notifications')}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="settings-submodal-body">
          {rows.map((row) => (
            <div className="notif-item" key={row.key}>
              <span>{row.label}</span>
              <ToggleSwitch
                checked={settings[row.key]}
                onChange={() => toggle(row.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 3. ACCOUNT INFO
// ============================================================
const AccountInfoModal = ({ onClose, profile }) => {
  const { t } = useTranslation();
  const createdDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'Noma\'lum';

  const rows = [
    { icon: User, label: t('settings.accountName'), value: profile?.fullName || 'Ism sharif' },
    { icon: Mail, label: t('settings.accountEmail'), value: profile?.email },
    { icon: Calendar, label: t('settings.accountCreated'), value: createdDate },
    { icon: Hash, label: t('settings.accountId'), value: profile?._id || '—', mono: true },
  ];

  return (
    <div className="settings-submodal" onClick={onClose}>
      <div className="settings-submodal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-submodal-header">
          <h3><User size={20} /> {t('settings.accountInfo')}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="settings-submodal-body account-info-body-v2">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div className="account-info-row" key={row.label}>
                <div className="account-info-icon"><Icon size={16} /></div>
                <div className="account-info-text">
                  <span className="account-info-label">{row.label}</span>
                  <span className={`account-info-value ${row.mono ? 'mono' : ''}`}>{row.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 4. VERIFIED
// ============================================================
const VerifiedModal = ({ onClose, isPremium }) => {
  const { t } = useTranslation();
  return (
    <div className="settings-submodal" onClick={onClose}>
      <div className="settings-submodal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-submodal-header">
          <h3><CheckCircle size={20} color="#0095f6" /> {t('settings.verified')}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="settings-submodal-body">
          {isPremium ? (
            <div className="verified-active">
              <CheckCircle size={48} color="#00e5ff" />
              <h4>{t('settings.verifiedActive')}</h4>
              <p>{t('settings.verifiedActiveDesc')}</p>
            </div>
          ) : (
            <div className="verified-inactive">
              <h4>{t('settings.verifiedInactive')}</h4>
              <p>{t('settings.verifiedInactiveDesc')}</p>
              <Link to="/premium" className="settings-link-btn primary">
                <Crown size={16} /> {t('settings.becomePremium')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 5. INTERFACE
// ============================================================
const InterfaceModal = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'uz';

  const changeLang = (code) => {
    i18n.changeLanguage(code);
  };

  const languages = [
    { code: 'uz', label: t('settings.langUz') },
    { code: 'ru', label: t('settings.langRu') },
    { code: 'en', label: t('settings.langEn') },
  ];

  return (
    <div className="settings-submodal" onClick={onClose}>
      <div className="settings-submodal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-submodal-header">
          <h3><Globe size={20} /> {t('settings.interface')}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="settings-submodal-body">
          <div className="interface-section">
            <span className="interface-section-title">{t('settings.interfaceLanguage')}</span>
            <div className="interface-lang-options">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`interface-lang-btn ${currentLang === lang.code ? 'active' : ''}`}
                  onClick={() => changeLang(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="interface-section">
            <span className="interface-section-title">{t('settings.interfaceTheme')}</span>
            <div className="interface-theme-row">
              <div className="interface-theme-label">
                <Sun size={16} /> / <Moon size={16} />
                <span>{t('settings.interfaceThemeLabel')}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ASOSIY SETTINGS MODAL
// ============================================================
export default function SettingsModal({
  isOpen,
  onClose,
  profile,
  user,
  stats,
  isPremium,
  onLogout,
  onOpenEditProfile
}) {
  const { t } = useTranslation();
  const [subModal, setSubModal] = useState(null);

  if (!isOpen) return null;

  const menuItems = [
    { id: 'edit-account', label: t('settings.editAccount'), icon: Edit },
    { id: 'professional', label: t('settings.professional'), icon: Briefcase, component: ProfessionalAccountModal },
    { id: 'qr', label: t('settings.qrCode'), icon: QrCode, component: 'qr' },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell, component: NotificationsModal },
    { id: 'interface', label: t('settings.interface'), icon: Globe, component: InterfaceModal },
    { id: 'account', label: t('settings.accountInfo'), icon: User, component: AccountInfoModal },
    { id: 'verified', label: t('settings.verified'), icon: CheckCircle, component: VerifiedModal },
  ];

  const handleMenuItemClick = (item) => {
    if (item.id === 'edit-account') {
      if (onOpenEditProfile) {
        onClose();
        onOpenEditProfile();
      }
      return;
    }

    if (item.id === 'qr') {
      setSubModal('qr');
    } else {
      setSubModal(item.id);
    }
  };

  const renderSubModal = () => {
    if (subModal === 'qr') {
      const profileUrl = `${window.location.origin}/profile/${profile?._id || user?.id}`;
      return (
        <div className="settings-submodal" onClick={() => setSubModal(null)}>
          <div className="settings-submodal-content" onClick={e => e.stopPropagation()}>
            <div className="settings-submodal-header">
              <h3><QrCode size={20} /> {t('settings.qrTitle')}</h3>
              <button onClick={() => setSubModal(null)}><X size={20} /></button>
            </div>
            <div className="settings-submodal-body">
              <QRCodeGenerator value={profileUrl} onClose={() => setSubModal(null)} />
            </div>
          </div>
        </div>
      );
    }

    const item = menuItems.find(i => i.id === subModal);
    if (!item) return null;

    const Component = item.component;
    if (item.id === 'professional') {
      return <Component onClose={() => setSubModal(null)} profile={profile} isPremium={isPremium} />;
    }
    if (item.id === 'verified') {
      return <Component onClose={() => setSubModal(null)} isPremium={isPremium} />;
    }
    if (item.id === 'account') {
      return <Component onClose={() => setSubModal(null)} profile={profile} />;
    }
    return <Component onClose={() => setSubModal(null)} />;
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h3><Settings size={20} /> {t('settings.title')}</h3>
          <button className="settings-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="settings-menu-item"
                onClick={() => handleMenuItemClick(item)}
              >
                <Icon size={20} color={item.id === 'verified' ? '#0095f6' : undefined} />
                <span>{item.label}</span>
                <ChevronRight size={16} className="settings-menu-arrow" />
              </button>
            );
          })}

          <button className="settings-menu-item logout" onClick={onLogout}>
            <LogOut size={20} />
            <span>{t('settings.logout')}</span>
            <ChevronRight size={16} className="settings-menu-arrow" />
          </button>
        </div>
      </div>

      {subModal && renderSubModal()}
    </div>
  );
}