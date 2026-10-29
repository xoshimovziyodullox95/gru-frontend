/* ============================================================
   SETTINGS PAGE — /settings
   Hisob, faoliyat, bildirishnomalar (serverda saqlanadi), til,
   yordam, xavfsizlik va hisobni o'chirish. Avval bu SettingsModal edi.
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  ArrowLeft, ChevronRight, Pencil, QrCode, Crown, Copy, Package, Wrench, Heart, Inbox,
  MessageCircle, ShoppingBag, MessageSquare, ThumbsUp, Megaphone, BellRing, Volume2,
  Globe, Sparkles, Bot, Palette, LogOut, MonitorSmartphone, Trash2, X, Loader2, LogIn, UserPlus, ShieldCheck,
} from 'lucide-react';

import api from '../services/api';
import { getUserProfile } from '../services/user';
import { registerPush } from '../services/push';
import { isChatMuted, setChatMuted } from '../services/chatSound';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { IS_IOS_APP } from '../utils/platform';
import { getImageUrl } from '../utils/imageUrl';
import { openZumoGuide } from '../common/zumoGuideEvents.js';
import QRCodeGenerator from './QRCodeGenerator';

import '../../styles/settingsPage.css';

// NotificationListener ham shu kalitlarni o'qiydi (ilova ochiq paytdagi toast/ovoz uchun)
const PREFS_KEY = 'zumo_notification_preferences';

const NOTIF_ROWS = [
  { key: 'messages', icon: MessageCircle, hint: true },
  { key: 'orders', icon: ShoppingBag, hint: true },
  { key: 'comments', icon: MessageSquare, hint: true },
  { key: 'likes', icon: ThumbsUp },
  { key: 'ads', icon: Megaphone },
];

const LANGS = [
  { code: 'uz', label: 'O‘zbek' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

const ROLES = ['user', 'business', 'company', 'bank_employee', 'admin'];

const readLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const writeLocal = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* saqlab bo'lmasa ham ishlayveradi */ }
};

const LOCALES = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
const formatDate = (value, lang) =>
  value ? new Date(value).toLocaleDateString(LOCALES[lang] || 'uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

function pushState() {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  return Notification.permission; // granted | denied | default
}

/* ---------------- Kichik bloklar ---------------- */

function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`st-switch ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function Row({ icon: Icon, label, hint, value, onClick, right, danger }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`st-row ${danger ? 'st-row--danger' : ''}`} onClick={onClick}>
      <span className="st-row__icon"><Icon size={18} /></span>
      <span className="st-row__text">
        <span className="st-row__label">{label}</span>
        {hint && <span className="st-row__hint">{hint}</span>}
      </span>
      {value && <span className="st-row__value">{value}</span>}
      {right}
      {onClick && !right && <ChevronRight size={18} className="st-row__chev" />}
    </Tag>
  );
}

function Group({ title, children, note }) {
  return (
    <section className="st-group">
      {title && <h2 className="st-group__title">{title}</h2>}
      <div className="st-card">{children}</div>
      {note && <p className="st-group__note">{note}</p>}
    </section>
  );
}

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="st-sheet" onClick={onClose}>
      <div className="st-sheet__panel" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="st-sheet__head">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Yopish"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   SAHIFA
   ============================================================ */

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  // Ro'yxatdan o'tmagan foydalanuvchi ham kiradi: mavzu, til, ovoz, yordam ishlaydi
  const isGuest = !user;
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  const [profile, setProfile] = useState(null);
  const [prefs, setPrefs] = useState(() => ({
    messages: true, orders: true, comments: true, likes: true, ads: true, ...readLocal(PREFS_KEY, {}),
  }));
  const [sound, setSound] = useState(() => !isChatMuted());
  const [push, setPush] = useState(pushState);
  const [pushBusy, setPushBusy] = useState(false);
  const [sheet, setSheet] = useState(null); // 'qr' | 'delete' | 'devices'
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  const lang = (i18n.language || 'uz').split('-')[0];

  const load = useCallback(async () => {
    try {
      const [profRes, setRes] = await Promise.all([getUserProfile(), api.get('/user/settings')]);
      setProfile(profRes.data);
      const serverPrefs = setRes.data?.notificationPrefs;
      if (serverPrefs) {
        setPrefs(serverPrefs);
        writeLocal(PREFS_KEY, serverPrefs);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t('settingsPage.loadError', 'Sozlamalarni yuklab bo‘lmadi'));
    }
  }, [t]);

  useEffect(() => {
    if (isGuest) return undefined;
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load, isGuest]);

  /* ---------- Bildirishnomalar ---------- */

  const togglePref = async (key, value) => {
    const prev = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    writeLocal(PREFS_KEY, next);
    if (isGuest) return; // mehmonda faqat shu qurilmada saqlanadi
    try {
      await api.put('/user/settings', { notificationPrefs: { [key]: value } });
    } catch {
      setPrefs(prev);
      writeLocal(PREFS_KEY, prev);
      toast.error(t('settingsPage.saveError', 'Saqlab bo‘lmadi, internetni tekshiring'));
    }
  };

  const toggleSound = (value) => {
    setSound(value);
    setChatMuted(!value);
  };

  const enablePush = async () => {
    setPushBusy(true);
    try {
      const ok = await registerPush();
      setPush(pushState());
      if (ok) toast.success(t('settingsPage.pushOn', 'Push-bildirishnomalar yoqildi'));
      else if (pushState() === 'denied') toast.info(t('settingsPage.pushAllow', 'Brauzer sozlamalaridan ruxsat bering'));
    } finally {
      setPushBusy(false);
    }
  };

  /* ---------- Hisob ---------- */

  const profileUrl = profile?._id ? `${window.location.origin}/profile/${profile._id}` : '';

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(profile?._id || ''));
      toast.success(t('settingsPage.idCopied', 'ID nusxalandi'));
    } catch {
      toast.error(t('settingsPage.copyError', 'Nusxalab bo‘lmadi'));
    }
  };

  const logout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const logoutEverywhere = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
      await signOut();
      navigate('/', { replace: true });
      toast.success(t('settingsPage.loggedOutAll', 'Barcha qurilmalardan chiqildi'));
    } catch {
      toast.error(t('settingsPage.logoutError', 'Chiqib bo‘lmadi, qayta urinib ko‘ring'));
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await api.delete('/user/account', { data: { confirm: confirmText } });
      await signOut().catch(() => {});
      navigate('/', { replace: true });
      toast.success(t('settingsPage.deleted', 'Hisobingiz o‘chirildi'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('settingsPage.deleteError', 'Hisobni o‘chirib bo‘lmadi'));
      setBusy(false);
    }
  };

  const closeSheet = useCallback(() => {
    if (busy) return;
    setSheet(null);
    setConfirmText('');
  }, [busy]);

  /* ---------- Ko'rinish ---------- */

  const premiumValue = profile?.isPremium
    ? (profile.premiumUntil ? t('settingsPage.until', '{{date}} gacha', { date: formatDate(profile.premiumUntil, lang) }) : t('settingsPage.premiumActive', 'Faol'))
    : t('settingsPage.premiumOff', 'Ulanmagan');
  const pushRow = {
    granted: { value: t('settingsPage.pushGranted', 'Yoqilgan') },
    denied: { value: t('settingsPage.pushDenied', 'Bloklangan'), hint: t('settingsPage.pushDeniedHint', 'Brauzer sozlamalarida ZUMO uchun ruxsat bering') },
    default: { hint: t('settingsPage.pushDefaultHint', 'Ilova yopiq bo‘lsa ham xabar keladi') },
    unsupported: { value: t('settingsPage.pushUnsupported', 'Mavjud emas'), hint: t('settingsPage.pushUnsupportedHint', 'Bu brauzer push-bildirishnomani qo‘llamaydi') },
  }[push];
  const deleteReady = confirmText.toUpperCase().replace(/[^A-Z]/g, '') === 'OCHIRISH';

  return (
    <div className="st-page">
      <header className="st-top">
        <button type="button" className="st-back" onClick={() => navigate(-1)} aria-label={t('settingsPage.back', 'Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <h1>{t('settingsPage.title', 'Sozlamalar')}</h1>
      </header>

      <div className="st-wrap">
        {isGuest ? (
          <section className="st-guest">
            <span className="st-guest__logo">Z</span>
            <strong>{t('settingsPage.guestTitle', 'ZUMO’ga xush kelibsiz')}</strong>
            <p>{t('settingsPage.guestText', 'Buyurtma berish, e’lon joylash va xabar yozish uchun hisobingizga kiring. Mavzu va tilni hozir ham sozlashingiz mumkin.')}</p>
            <div className="st-guest__actions">
              <button type="button" className="st-btn st-btn--primary" onClick={() => navigate('/login', { state: { from: '/settings' } })}>
                <LogIn size={17} /> {t('settingsPage.guestLogin', 'Kirish')}
              </button>
              <button type="button" className="st-btn st-btn--ghost" onClick={() => navigate('/register')}>
                <UserPlus size={17} /> {t('settingsPage.guestRegister', 'Ro‘yxatdan o‘tish')}
              </button>
            </div>
          </section>
        ) : (
        <>
        {/* ---------- Profil kartasi ---------- */}
        <button type="button" className="st-profile" onClick={() => navigate('/profile')}>
          {profile?.avatar_url ? (
            <img src={getImageUrl(profile.avatar_url)} alt="" className="st-profile__avatar" />
          ) : (
            <span className="st-profile__avatar st-profile__avatar--letter">
              {(profile?.fullName || 'Z').trim()[0]?.toUpperCase()}
            </span>
          )}
          <span className="st-profile__text">
            <strong>{profile ? profile.fullName || t('settingsPage.noName', 'Ism kiritilmagan') : <span className="st-skel" />}</strong>
            <span>{profile?.phone || profile?.email || ' '}</span>
            <span className="st-badges">
              {profile && <span className="st-badge">{t(`settingsPage.role.${ROLES.includes(profile.role) ? profile.role : 'user'}`)}</span>}
              {profile?.isPremium && <span className="st-badge st-badge--premium"><Crown size={12} /> Premium</span>}
            </span>
          </span>
          <ChevronRight size={20} className="st-row__chev" />
        </button>

        {(profile?.role === 'admin' || user?.user_metadata?.role === 'admin') && (
          <Group title={t('settingsPage.group.admin', 'Boshqaruv')}>
            <Row icon={ShieldCheck} label={t('settingsPage.adminPanel', 'Admin panel')} hint={t('settingsPage.adminPanelHint', 'Foydalanuvchilar, statistika, rollar')} onClick={() => navigate('/admin-dashboard')} />
          </Group>
        )}

        <Group title={t('settingsPage.group.account', 'Hisob')}>
          <Row icon={Pencil} label={t('settingsPage.editProfile', 'Profilni tahrirlash')} hint={t('settingsPage.editProfileHint', 'Ism, telefon, rasm, bio')} onClick={() => navigate('/profile?edit=1')} />
          <Row icon={QrCode} label={t('settingsPage.myQr', 'Mening QR kodim')} hint={t('settingsPage.myQrHint', 'Profilingizni tez ulashish')} onClick={() => profileUrl && setSheet('qr')} />
          {!IS_IOS_APP && <Row icon={Crown} label={t('settingsPage.premium', 'Premium')} value={premiumValue} onClick={() => navigate('/premium')} />}
          <Row
            icon={Copy}
            label={t('settingsPage.accountId', 'Hisob ID')}
            hint={t('settingsPage.joined', 'Ro‘yxatdan o‘tgan: {{date}}', { date: formatDate(profile?.createdAt, lang) })}
            value={profile?._id ? `…${String(profile._id).slice(-6)}` : ''}
            onClick={profile?._id ? copyId : undefined}
            right={profile?._id ? <span className="st-row__action">{t('settingsPage.copy', 'Nusxa')}</span> : null}
          />
        </Group>

        <Group title={t('settingsPage.group.activity', 'Faoliyatim')}>
          <Row icon={Package} label={t('settingsPage.myOrders', 'Buyurtmalarim')} onClick={() => navigate('/my-orders')} />
          <Row icon={Wrench} label={t('settingsPage.myRequests', 'Xizmat so‘rovlarim')} onClick={() => navigate('/my-requests')} />
          {/* Tovar e'lon qilgan har kim sotuvchi — rolga qaramaymiz */}
          <Row icon={Inbox} label={t('settingsPage.receivedOrders', 'Kelgan buyurtmalar')} hint={t('settingsPage.receivedOrdersHint', 'Tovaringizni sotib olmoqchi bo‘lganlar')} onClick={() => navigate('/received-orders')} />
          <Row icon={Heart} label={t('settingsPage.saved', 'Saqlanganlar')} onClick={() => navigate('/saved')} />
        </Group>
        </>
        )}

        <Group
          title={t('settingsPage.group.notifications', 'Bildirishnomalar')}
          note={t('settingsPage.notifNote', 'O‘chirilgan turlar bo‘yicha telefoningizga push ham kelmaydi. Ilova ichidagi ro‘yxatda esa saqlanib qoladi.')}
        >
          {!isGuest && <Row
            icon={BellRing}
            label={t('settingsPage.push', 'Push-bildirishnomalar')}
            hint={pushRow.hint}
            value={pushRow.value}
            right={push === 'default' ? (
              <button type="button" className="st-pill" onClick={enablePush} disabled={pushBusy}>
                {pushBusy ? <Loader2 size={14} className="st-spin" /> : t('settingsPage.enable', 'Yoqish')}
              </button>
            ) : null}
          />}
          {NOTIF_ROWS.map((row) => (
            <Row
              key={row.key}
              icon={row.icon}
              label={t(`settingsPage.notif.${row.key}`)}
              hint={row.hint ? t(`settingsPage.notifHint.${row.key}`) : undefined}
              right={<Switch label={t(`settingsPage.notif.${row.key}`)} checked={prefs[row.key] !== false} onChange={(v) => togglePref(row.key, v)} />}
            />
          ))}
          <Row
            icon={Volume2}
            label={t('settingsPage.sound', 'Ovozli signal')}
            hint={t('settingsPage.soundHint', 'Xabar va bildirishnoma kelganda')}
            right={<Switch label={t('settingsPage.sound', 'Ovozli signal')} checked={sound} onChange={toggleSound} />}
          />
        </Group>

        <Group title={t('settingsPage.group.app', 'Ilova')}>
          <div className="st-row st-row--stack">
            <span className="st-row__icon"><Palette size={18} /></span>
            <span className="st-row__text"><span className="st-row__label">{t('settingsPage.theme', 'Mavzu')}</span></span>
            <div className="st-seg" role="radiogroup" aria-label={t('settingsPage.theme', 'Mavzu')}>
              {[
                { id: 'dark', label: t('settingsPage.themeDark', 'Qorong‘i') },
                { id: 'light', label: t('settingsPage.themeLight', 'Yorug‘') },
                { id: 'system', label: t('settingsPage.themeSystem', 'Tizim') },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={themeMode === m.id}
                  className={themeMode === m.id ? 'is-on' : ''}
                  onClick={() => setThemeMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="st-row st-row--stack">
            <span className="st-row__icon"><Globe size={18} /></span>
            <span className="st-row__text"><span className="st-row__label">{t('settingsPage.language', 'Til')}</span></span>
            <div className="st-seg" role="radiogroup" aria-label={t('settingsPage.language', 'Til')}>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="radio"
                  aria-checked={lang === l.code}
                  className={lang === l.code ? 'is-on' : ''}
                  onClick={() => i18n.changeLanguage(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group title={t('settingsPage.group.help', 'Yordam')}>
          <Row icon={Sparkles} label={t('settingsPage.guide', 'ZUMO bilan tanishuv')} hint={t('settingsPage.guideHint', 'Ilova imkoniyatlari qisqacha')} onClick={() => openZumoGuide('welcome')} />
          <Row icon={Bot} label={t('settingsPage.ai', 'ZUMO AI yordamchi')} hint={t('settingsPage.aiHint', 'Savolingizni yozing')} onClick={() => navigate('/ai-assistant')} />
        </Group>

        {!isGuest && (<>
        <Group title={t('settingsPage.group.security', 'Xavfsizlik')}>
          <Row icon={MonitorSmartphone} label={t('settingsPage.logoutAll', 'Barcha qurilmalardan chiqish')} hint={t('settingsPage.logoutAllHint', 'Telefon yo‘qolsa yoki begona kirgan bo‘lsa')} onClick={() => setSheet('devices')} />
          <Row icon={Trash2} label={t('settingsPage.deleteAccount', 'Hisobni o‘chirish')} danger onClick={() => setSheet('delete')} />
        </Group>

        <button type="button" className="st-logout" onClick={logout}>
          <LogOut size={18} /> {t('settingsPage.logout', 'Chiqish')}
        </button>
        </>)}
        <p className="st-foot">ZUMO · {new Date().getFullYear()}</p>
      </div>

      {/* ---------- Pastdan chiqadigan oynalar ---------- */}
      {sheet === 'qr' && (
        <Sheet title={t('settingsPage.myQr', 'Mening QR kodim')} onClose={closeSheet}>
          <QRCodeGenerator value={profileUrl} onClose={closeSheet} />
        </Sheet>
      )}

      {sheet === 'devices' && (
        <Sheet title={t('settingsPage.logoutAll', 'Barcha qurilmalardan chiqish')} onClose={closeSheet}>
          <p className="st-sheet__text">
            {t('settingsPage.logoutAllText', 'Telefon, planshet va kompyuterlardagi barcha kirishlar yopiladi. Qayta kirish uchun telefon raqamingiz orqali tasdiqlash kerak bo‘ladi.')}
          </p>
          <button type="button" className="st-btn st-btn--primary" onClick={logoutEverywhere} disabled={busy}>
            {busy && <Loader2 size={16} className="st-spin" />} {t('settingsPage.logoutAllBtn', 'Hammasidan chiqish')}
          </button>
        </Sheet>
      )}

      {sheet === 'delete' && (
        <Sheet title={t('settingsPage.deleteAccount', 'Hisobni o‘chirish')} onClose={closeSheet}>
          <p className="st-sheet__text">
            {t('settingsPage.deleteText', 'E’lonlaringiz, xizmatlaringiz, savat, obunalar va bildirishnomalar butunlay o‘chiriladi. Buni qaytarib bo‘lmaydi.')}
          </p>
          <p className="st-sheet__text">
            {t('settingsPage.deleteActive', 'Faol buyurtma yoki xizmat so‘rovi bo‘lsa, avval ularni yakunlang.')}
          </p>
          <label className="st-field">
            <span>{t('settingsPage.deleteConfirmLabel', 'Tasdiqlash uchun O‘CHIRISH deb yozing')}</span>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="O‘CHIRISH"
            />
          </label>
          <button type="button" className="st-btn st-btn--danger" onClick={deleteAccount} disabled={!deleteReady || busy}>
            {busy && <Loader2 size={16} className="st-spin" />} {t('settingsPage.deleteBtn', 'Hisobni butunlay o‘chirish')}
          </button>
        </Sheet>
      )}
    </div>
  );
}
