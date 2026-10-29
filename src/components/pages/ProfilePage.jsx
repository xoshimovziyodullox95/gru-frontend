// src/components/pages/ProfilePage.jsx
/* ============================================================
   PROFILE PAGE — /profile (o'zim), /profile/:userId (boshqa odam)
   Rolga qarab: usta paneli, mijoz CTA, biznes/kompaniya paneli.
   Tahrirlash — pastdan chiqadigan oyna (?edit=1 bilan ham ochiladi).
   ============================================================ */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Settings, Camera, BadgeCheck, Wrench, Briefcase, Store, Phone, Mail,
  Pencil, Share2, Crown, UserPlus, UserCheck, MessageCircle, MapPin, Package, Play,
  Eye, Heart, Trash2, Star, Inbox, Clock, ChevronRight, Hammer, BarChart3, Truck,
  Send, Boxes, Users, UserMinus, X, Loader2, Building2, Plus,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import BusinessSummaryWidget from '../business/BusinessSummaryWidget';
import SupplierStatsWidget from '../business/SupplierStatsWidget';
import ReelsStrip from '../common/Reelsstrip';
import QRCodeGenerator from './QRCodeGenerator';
import { safeGoBack } from '../utils/navigation.js';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
import {
  getUserProfile, updateUserProfile, uploadUserAvatar,
  getMyLocations, getMyEquipment, getMyServices,
  deleteLocation, deleteEquipment, deleteService,
  getUserById, getLocationsByUserId, getEquipmentByUserId, getServicesByUserId,
  getSubscribers, getMySubscriptions, unsubscribeFromUser, subscribeToUser, isSubscribed,
  getDashboardStats, cancelSubscription,
} from '../services/user';
import { getServiceProviders } from '../services/serviceProviders';
import { getPosts } from '../services/videos';

import '../../styles/profile.css';
import '../../styles/profilePage.css';

import { T } from '../utils/T';
import { IS_IOS_APP } from '../utils/platform';
/* ============================================================
   YORDAMCHILAR
   ============================================================ */

const BIO_MAX = 300;

function resolveRole(profile) {
  const role = String(profile?.role || '').trim().toLowerCase();
  if (['provider', 'master', 'usta', 'service_provider'].includes(role)) return 'provider';
  if (role === 'business' || role === 'biznes') return 'business';
  if (role === 'company' || role === 'supplier') return 'company';
  if (role === 'seller' || role === 'sotuvchi') return 'seller';
  return 'client';
}


function extractOwnerId(provider) {
  for (const c of [provider?.userId, provider?.user, provider?.owner]) {
    if (!c) continue;
    if (typeof c === 'object') {
      if (c._id) return String(c._id);
      if (c.id) return String(c.id);
    } else {
      return String(c);
    }
  }
  return null;
}

function Avatar({ src, name, size = 96 }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <img
        className="pf-avatar"
        style={{ width: size, height: size }}
        src={src.startsWith('data:') ? src : getImageUrl(src)}
        alt=""
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="pf-avatar pf-avatar--letter" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {(name || 'Z').trim()[0]?.toUpperCase()}
    </span>
  );
}

function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="pf-sheet" onClick={onClose}>
      <div className="pf-sheet__panel" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="pf-sheet__head">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="×"><X size={20} /></button>
        </div>
        <div className="pf-sheet__body">{children}</div>
        {footer && <div className="pf-sheet__foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ============================================================
   USTA PANELI
   ============================================================ */

function ProviderPanel({ provider }) {
  const { t } = useTranslation();
  const rating = Number(provider.averageRating) || 0;
  return (
    <section className="pf-card pf-panel">
      <header className="pf-panel__head">
        <span className="pf-panel__icon"><Wrench size={18} /></span>
        <div>
          <h3>{t('profile.provider.title', 'Usta paneli')}</h3>
          <p>{provider.company || provider.service_category || '—'}</p>
        </div>
        <span className="pf-rating"><Star size={15} /> {rating ? rating.toFixed(1) : t('profile.provider.new', 'Yangi')}</span>
      </header>
      <div className="pf-mini-stats">
        <div><strong>{provider.ratingsCount || 0}</strong><span>{t('profile.provider.reviews', 'Sharhlar')}</span></div>
        <div><strong>{provider.location?.address ? '✓' : '—'}</strong><span>{t('profile.provider.address', 'Manzil')}</span></div>
        <div><strong>{rating ? rating.toFixed(1) : '—'}</strong><span>{t('profile.provider.rating', 'Reyting')}</span></div>
      </div>
      <nav className="pf-links">
        <Link to="/provider-requests"><Inbox size={17} /> {t('profile.provider.requests', 'Kelgan so‘rovlar')} <ChevronRight size={16} /></Link>
        <Link to="/history"><Clock size={17} /> {t('profile.provider.history', 'Ish tarixi')} <ChevronRight size={16} /></Link>
        <Link to={`/service-provider/${provider._id}`}><Eye size={17} /> {t('profile.provider.myService', 'Mening xizmatim')} <ChevronRight size={16} /></Link>
      </nav>
    </section>
  );
}

/* ============================================================
   ASOSIY KOMPONENT
   ============================================================ */

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId } = useParams();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myLocations, setMyLocations] = useState([]);
  const [myEquipment, setMyEquipment] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myProvider, setMyProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [activeTab, setActiveTab] = useState('equipment');
  const [stats, setStats] = useState({ views: 0, locations: 0, equipment: 0, services: 0 });

  const [subscribers, setSubscribers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [listSheet, setListSheet] = useState(null); // 'subscribers' | 'following'
  const [unsubscribingId, setUnsubscribingId] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [isSubscribedState, setIsSubscribedState] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  /* ---------------- ROL ---------------- */

  const isOwnProfile = !userId || (user && userId === user.id);
  const roleKey = resolveRole(profile);
  const isProvider = roleKey === 'provider' || Boolean(myProvider);
  const isBusiness = roleKey === 'business';
  const isCompany = roleKey === 'company';
  const isSeller = roleKey === 'seller';
  const isPremium = Boolean(profile?.isPremium);
  const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : i18n.language?.startsWith('en') ? 'en-US' : 'uz-UZ';

  /* ============================================================
     YUKLASH
     ============================================================ */

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, locRes, eqRes, servRes] = await Promise.all(
        isOwnProfile
          ? [getUserProfile(), getMyLocations(), getMyEquipment(), getMyServices()]
          : [getUserById(userId), getLocationsByUserId(userId), getEquipmentByUserId(userId), getServicesByUserId(userId)]
      );

      const profileData = profRes.data || {};
      // URL'dagi id (Mongo) bilan user.id (Supabase) hech qachon teng emas —
      // o'z profilini /profile/:id orqali ochsa, o'zining sahifasiga o'tkazamiz
      if (!isOwnProfile && user?.id && profileData.uuid === user.id) {
        navigate('/profile', { replace: true });
        return;
      }
      setProfile(profileData);
      setFormData({ fullName: profileData.fullName || '', phone: profileData.phone || '', bio: profileData.bio || '' });
      setMyLocations(locRes.data || []);
      setMyEquipment(eqRes.data || []);
      setMyServices(servRes.data || []);

      // Bo'sh bo'lmagan birinchi tabni ochamiz
      const counts = { equipment: (eqRes.data || []).length, services: (servRes.data || []).length, locations: (locRes.data || []).length };
      setActiveTab((prev) => (counts[prev] ? prev : Object.keys(counts).find((k) => counts[k]) || 'equipment'));

      const targetUserId = profileData._id || userId;
      // Foydalanuvchining o'zi qo'shgan video postlari (lentadagi reels)
      if (targetUserId) {
        getPosts({ userId: targetUserId, limit: 50 })
          .then((res) => setMyPosts((Array.isArray(res.data) ? res.data : []).filter((p) => !p.isYoutube)))
          .catch(() => setMyPosts([]));
      }
      // Usta paneli rolga bog'liq emas: biznes yoki kompaniya ham xizmat ko'rsatishi mumkin
      // (bazadan import qilingan ustalar tasdiqlangach "business" rolini oladi)
      if (!targetUserId) {
        setMyProvider(null);
      } else {
        try {
          const providersRes = await getServiceProviders({ userId: targetUserId, limit: 20 });
          const arr = providersRes.data?.items || providersRes.data?.data || providersRes.data || [];
          const first = Array.isArray(arr) ? arr.find((p) => extractOwnerId(p) === String(targetUserId)) : null;
          if (first) {
            const ratings = Array.isArray(first.ratings) ? first.ratings : [];
            setMyProvider({
              _id: first._id,
              company: first.company,
              service_category: first.service_category,
              location: first.location,
              averageRating: ratings.length
                ? ratings.reduce((s, r) => s + Number(r.value || 0), 0) / ratings.length
                : Number(first.averageRating) || 0,
              ratingsCount: ratings.length || first.ratingsCount || 0,
            });
          } else {
            setMyProvider(null);
          }
        } catch {
          setMyProvider(null);
        }
      }
    } catch (err) {
      console.error('Profil xato:', err);
      toast.error(t('profile.error', 'Xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     AMALLAR
     ============================================================ */

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatarOnlyImage', 'Faqat rasm yuklash mumkin'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append('avatar', file);
    setAvatarUploading(true);
    try {
      const res = await uploadUserAvatar(fd);
      setProfile((p) => ({ ...p, avatar_url: res.data.avatar_url }));
      // Navbar va marketplace'dagi avatar ham darhol yangilansin
      window.dispatchEvent(new CustomEvent('zumo:avatar', { detail: res.data.avatar_url }));
      toast.success(t('profile.avatarUpdated', 'Rasm yangilandi'));
    } catch (err) {
      setAvatarPreview(null);
      toast.error(err.response?.data?.error || t('profile.avatarError', 'Rasmni yuklab bo‘lmadi'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const openEdit = () => {
    if (profile) setFormData({ fullName: profile.fullName || '', phone: profile.phone || '', bio: profile.bio || '' });
    setEditOpen(true);
  };

  const handleSave = async () => {
    const fullName = formData.fullName.trim();
    if (fullName.length < 2) {
      toast.error(t('profile.nameRequired', 'Ismingizni kiriting'));
      return;
    }
    setSaving(true);
    try {
      const res = await updateUserProfile({ ...formData, fullName, bio: formData.bio.trim().slice(0, BIO_MAX) });
      setProfile(res.data);
      setEditOpen(false);
      toast.success(t('profile.saved', 'Profil saqlandi'));
    } catch {
      toast.error(t('profile.error', 'Xatolik yuz berdi'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm(t('profile.deleteConfirm', 'Haqiqatan ham o‘chirmoqchimisiz?'))) return;
    try {
      if (type === 'location') await deleteLocation(id);
      else if (type === 'equipment') await deleteEquipment(id);
      else await deleteService(id);
      loadData();
      toast.success(t('profile.deleted', 'O‘chirildi'));
    } catch {
      toast.error(t('profile.deleteError', 'O‘chirib bo‘lmadi'));
    }
  };

  const handleCancelPremium = async () => {
    if (!window.confirm(t('profile.cancelPremiumConfirm', 'Premium a’zolikni bekor qilmoqchimisiz?'))) return;
    setCancelling(true);
    try {
      await cancelSubscription();
      const updated = await getUserProfile();
      setProfile(updated.data);
      toast.success(t('profile.premiumCancelled', 'Premium bekor qilindi'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('profile.error', 'Xatolik yuz berdi'));
    } finally {
      setCancelling(false);
    }
  };

  const handleUnsubscribe = async (targetId) => {
    setUnsubscribingId(targetId);
    try {
      await unsubscribeFromUser(targetId);
      setFollowing((prev) => prev.filter((i) => i._id !== targetId));
      toast.success(t('profile.unsubscribed', 'Obuna bekor qilindi'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('profile.error', 'Xatolik yuz berdi'));
    } finally {
      setUnsubscribingId(null);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!user) return navigate('/login');
    setSubscribing(true);
    try {
      if (isSubscribedState) {
        await unsubscribeFromUser(userId);
        setIsSubscribedState(false);
        toast.success(t('profile.unsubscribed', 'Obuna bekor qilindi'));
      } else {
        await subscribeToUser(userId);
        setIsSubscribedState(true);
        toast.success(t('profile.subscribed', 'Obuna bo‘ldingiz'));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t('profile.error', 'Xatolik yuz berdi'));
    } finally {
      setSubscribing(false);
    }
  };

  /* ============================================================
     EFFEKTLAR
     ============================================================ */

  useEffect(() => {
    if (!isOwnProfile || !(isBusiness || isCompany)) return;
    getDashboardStats().then((res) => setStats(res.data || {})).catch(() => {});
    getSubscribers().then((res) => setSubscribers(res.data || [])).catch(() => {});
  }, [isOwnProfile, isBusiness, isCompany]);

  useEffect(() => {
    if (!isOwnProfile) return;
    getMySubscriptions().then((res) => setFollowing(res.data || [])).catch(() => {});
  }, [isOwnProfile]);

  useEffect(() => {
    if (isOwnProfile || !userId || !user) return;
    isSubscribed(userId).then((res) => setIsSubscribedState(Boolean(res.data?.isSubscribed))).catch(() => {});
  }, [isOwnProfile, userId, user]);

  useEffect(() => {
    if (!user && !userId) {
      navigate('/login');
      return undefined;
    }
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]);

  // Sozlamalar endi alohida sahifa (/settings); eski ?settings=1 havolalari ham ishlasin
  useEffect(() => {
    if (searchParams.get('settings') === '1') navigate('/settings', { replace: true });
  }, [searchParams, navigate]);

  // /settings → "Profilni tahrirlash" (?edit=1): profil yuklangach tahrirlash oynasi ochiladi
  useEffect(() => {
    if (searchParams.get('edit') !== '1' || !isOwnProfile || !profile) return undefined;
    const timer = setTimeout(() => {
      openEdit();
      setSearchParams({}, { replace: true });
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isOwnProfile, profile]);

  /* ============================================================
     RENDER
     ============================================================ */

  if (loading) {
    return (
      <div className="pf-page pf-center"><Loader2 size={28} className="pf-spin" /></div>
    );
  }

  if (!profile) {
    return (
      <div className="pf-page pf-center">
        <p className="pf-muted">{t('profile.error', 'Xatolik yuz berdi')}</p>
        <button type="button" className="pf-btn pf-btn--ghost" onClick={loadData}>{t('profile.retry', 'Qayta urinish')}</button>
      </div>
    );
  }

  const name = profile.fullName || t('profile.noName', 'Ism kiritilmagan');
  const listingsCount = myLocations.length + myEquipment.length + myServices.length;
  const profileUrl = `${window.location.origin}/profile/${profile._id}`;

  // Rollar bir-birini o'chirmaydi: har kim mijoz; usta, sotuvchi, biznes — qo'shimcha imkoniyat
  const roleChips = [
    isProvider && { icon: Wrench, label: t('profile.role.provider', 'Usta') },
    (isSeller || myEquipment.length > 0) && { icon: Store, label: t('profile.role.seller', 'Sotuvchi') },
    isBusiness && { icon: Briefcase, label: t('profile.role.business', 'Biznes') },
    isCompany && { icon: Building2, label: t('profile.role.company', 'Kompaniya') },
  ].filter(Boolean);

  const myReels = [
    ...myPosts.map((post) => ({ id: `post-${post._id}`, videoUrl: post.videoUrl, title: post.title, typeLabel: t('profile.post', 'Post'), link: `/posts/${post._id}` })),
    ...myLocations.flatMap((item) => (item.media || []).map((m, idx) => ({ id: `loc-${item._id}-${idx}`, videoUrl: m.url || m, title: item.title, typeLabel: t('profile.tabs.locations', 'Joylar'), link: `/location/${item._id}` }))),
    ...myEquipment.flatMap((item) => (item.media || []).map((m, idx) => ({ id: `eq-${item._id}-${idx}`, videoUrl: m.url || m, title: item.title, typeLabel: t('profile.tabs.equipment', 'Tovarlar'), link: `/equipment/${item._id}` }))),
    ...myServices.flatMap((item) => (item.media || []).map((m, idx) => ({ id: `svc-${item._id}-${idx}`, videoUrl: m.url || m, title: item.name, typeLabel: t('profile.tabs.services', 'Xizmatlar'), link: `/service-provider/${item._id}` }))),
  ];

  const tabs = [
    { id: 'equipment', icon: Package, label: t('profile.tabs.equipment', 'Tovarlar'), count: myEquipment.length },
    { id: 'services', icon: Briefcase, label: t('profile.tabs.services', 'Xizmatlar'), count: myServices.length },
    { id: 'locations', icon: MapPin, label: t('profile.tabs.locations', 'Joylar'), count: myLocations.length },
    { id: 'videos', icon: Play, label: t('profile.tabs.videos', 'Videolar'), count: myReels.length },
  ];

  // Biznes / kompaniya / sotuvchi uchun tezkor amallar
  const sellerActions = [
    isBusiness && { to: '/my-branches', icon: MapPin, label: t('profile.actions.branches', 'Filiallarim') },
    // Tovar sotayotgan oddiy foydalanuvchiga ham buyurtma keladi (OLX kabi)
    (isBusiness || isCompany || isSeller || myEquipment.length > 0) && { to: '/received-orders', icon: Truck, label: t('profile.actions.receivedOrders', 'Kelgan buyurtmalar') },
    (isBusiness || isCompany || isSeller) && { to: '/broadcast-ad', icon: Send, label: t('profile.actions.broadcast', 'Reklama tarqatish') },
    (isBusiness || isCompany || isSeller) && { to: '/business', icon: Boxes, label: T('ZUMO Biznes'), hint: T('Do‘kon daftari: tovar, sotuv, foyda') },
    (isBusiness || isCompany) && { to: '/dashboard', icon: BarChart3, label: t('profile.actions.stats', 'Statistika') },
  ].filter(Boolean);

  const renderItems = () => {
    const items = activeTab === 'locations' ? myLocations : activeTab === 'equipment' ? myEquipment : myServices;
    const itemType = activeTab === 'locations' ? 'location' : activeTab === 'equipment' ? 'equipment' : 'service';
    const detailPath = itemType === 'service' ? 'service-provider' : itemType;

    if (!items.length) {
      return (
        <div className="pf-empty">
          <span className="pf-empty__icon"><Package size={26} /></span>
          <p>{t('profile.emptyListings', 'Hozircha e’lonlar yo‘q')}</p>
          {isOwnProfile && (
            <button type="button" className="pf-btn pf-btn--primary pf-btn--sm" onClick={() => navigate('/add-listing')}>
              <Plus size={16} /> {t('profile.addListing', 'E’lon joylash')}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="pf-items">
        {items.map((item) => {
          const title = item.title || item.name;
          const price = item.price || item.price_range;
          return (
            <article key={item._id} className="pf-item">
              <button type="button" className="pf-item__media" onClick={() => navigate(`/${detailPath}/${item._id}`)}>
                <img src={item.images?.[0] ? getImageUrl(item.images[0]) : '/images/zumo-placeholder.svg'} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = '/images/zumo-placeholder.svg'; }} />
              </button>
              <div className="pf-item__body">
                <button type="button" className="pf-item__title" onClick={() => navigate(`/${detailPath}/${item._id}`)}>{title}</button>
                {price && <strong className="pf-item__price">{formatPrice(price, item.currency)}</strong>}
                <div className="pf-item__meta">
                  <span><Eye size={13} /> {item.views || 0}</span>
                  <span><Heart size={13} /> {item.likes?.length || 0}</span>
                  <span><MessageCircle size={13} /> {item.comments?.length || 0}</span>
                  {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>}
                </div>
                {isOwnProfile && (
                  <div className="pf-item__actions">
                    <button type="button" onClick={() => navigate(`/edit/${itemType}/${item._id}`)}>
                      <Pencil size={14} /> {t('profile.actions.edit', 'Tahrirlash')}
                    </button>
                    <button type="button" className="is-danger" onClick={() => handleDeleteItem(itemType, item._id)} aria-label={t('profile.actions.delete', 'O‘chirish')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const people = listSheet === 'subscribers' ? subscribers : following;

  return (
    <div className="pf-page">
      {/* ---------- Yuqori panel ---------- */}
      <header className="pf-top">
        <button type="button" className="pf-icon-btn" onClick={() => safeGoBack(navigate)} aria-label={t('profile.back', 'Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <h1>{isOwnProfile ? t('profile.myProfile', 'Mening profilim') : t('profile.title', 'Profil')}</h1>
        <div className="pf-top__actions">
          <button type="button" className="pf-icon-btn" onClick={() => setShareOpen(true)} aria-label={t('profile.share', 'Ulashish')}>
            <Share2 size={19} />
          </button>
          {isOwnProfile && (
            <button type="button" className="pf-icon-btn" onClick={() => navigate('/settings')} aria-label={t('settings.title', 'Sozlamalar')}>
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>

      <div className="pf-wrap">
        {/* ---------- Asosiy karta ---------- */}
        <section className="pf-card pf-hero">
          <div className="pf-hero__cover" aria-hidden="true" />
          <div className="pf-hero__avatar">
            <Avatar src={avatarPreview || profile.avatar_url} name={name} />
            {isOwnProfile && (
              <label className="pf-hero__camera" aria-label={t('profile.changePhoto', 'Rasmni o‘zgartirish')}>
                {avatarUploading ? <Loader2 size={16} className="pf-spin" /> : <Camera size={16} />}
                <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              </label>
            )}
          </div>

          <div className="pf-hero__name">
            <h2>{name}</h2>
            {isPremium && <BadgeCheck size={20} className="pf-verified" aria-label={T('Premium')} />}
          </div>
          {(roleChips.length > 0 || profile.companyName) && (
            <div className="pf-chips">
              {roleChips.map((c) => <span key={c.label} className="pf-chip"><c.icon size={13} /> {c.label}</span>)}
              {profile.companyName && <span className="pf-chip pf-chip--soft">{profile.companyName}</span>}
              {isPremium && <span className="pf-chip pf-chip--accent"><Crown size={13} /> {T('Premium')}</span>}
            </div>
          )}

          {profile.bio ? (
            <p className="pf-bio">{profile.bio}</p>
          ) : isOwnProfile ? (
            <button type="button" className="pf-bio pf-bio--empty" onClick={openEdit}>
              <Plus size={14} /> {t('profile.addBio', 'O‘zingiz haqingizda qisqacha yozing')}
            </button>
          ) : null}

          {(profile.phone || profile.email) && (
            <div className="pf-contacts">
              {profile.phone && <a href={`tel:${profile.phone.replace(/\s+/g, '')}`}><Phone size={14} /> {profile.phone}</a>}
              {profile.email && <a href={`mailto:${profile.email}`}><Mail size={14} /> {profile.email}</a>}
            </div>
          )}

          <div className="pf-stats">
            <div>
              <strong>{listingsCount}</strong>
              <span>{t('profile.listings', 'E’lonlar')}</span>
            </div>
            {isOwnProfile && (isBusiness || isCompany) && (
              <button type="button" onClick={() => setListSheet('subscribers')}>
                <strong>{subscribers.length}</strong>
                <span>{t('profile.subscribers', 'Obunachilar')}</span>
              </button>
            )}
            {isOwnProfile && (
              <button type="button" onClick={() => setListSheet('following')}>
                <strong>{following.length}</strong>
                <span>{t('profile.subscriptions', 'Obunalar')}</span>
              </button>
            )}
            <button type="button" onClick={() => setActiveTab('videos')}>
              <strong>{myReels.length}</strong>
              <span>{t('profile.videos', 'Videolar')}</span>
            </button>
          </div>

          <div className="pf-hero__actions">
            {isOwnProfile ? (
              <>
                <button type="button" className="pf-btn pf-btn--primary" onClick={openEdit}>
                  <Pencil size={16} /> {t('profile.editProfile', 'Profilni tahrirlash')}
                </button>
                <button type="button" className="pf-btn pf-btn--ghost pf-btn--icon" onClick={() => setShareOpen(true)} aria-label={t('profile.share', 'Ulashish')}>
                  <Share2 size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`pf-btn ${isSubscribedState ? 'pf-btn--ghost' : 'pf-btn--primary'}`}
                  onClick={handleToggleSubscribe}
                  disabled={subscribing}
                >
                  {isSubscribedState ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  {isSubscribedState ? t('profile.following', 'Obuna bo‘lingan') : t('profile.subscribe', 'Obuna bo‘lish')}
                </button>
                <button type="button" className="pf-btn pf-btn--ghost" onClick={() => (user ? navigate(`/chat?userId=${profile._id}`) : navigate('/login'))}>
                  <MessageCircle size={16} /> {t('profile.message', 'Xabar yozish')}
                </button>
              </>
            )}
          </div>
        </section>

        {/* ---------- Premium ---------- */}
        {isOwnProfile && (isPremium || !IS_IOS_APP) && (
          isPremium ? (
            <section className="pf-card pf-premium is-active">
              <span className="pf-premium__icon"><Crown size={18} /></span>
              <div>
                <strong>{t('profile.premiumActive', 'Premium faol')}</strong>
                {profile.premiumUntil && (
                  <span>{t('profile.premiumUntil', '{{date}} gacha', { date: new Date(profile.premiumUntil).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}</span>
                )}
              </div>
              <button type="button" className="pf-link-btn" onClick={handleCancelPremium} disabled={cancelling}>
                {cancelling ? t('profile.cancelling', 'Bekor qilinmoqda...') : t('profile.cancelPremium', 'Bekor qilish')}
              </button>
            </section>
          ) : (
            <button type="button" className="pf-card pf-premium" onClick={() => navigate('/premium')}>
              <span className="pf-premium__icon"><Crown size={18} /></span>
              <div>
                <strong>{t('profile.getPremium', 'Premium oling')}</strong>
                <span>{t('profile.premiumPitch', 'Tasdiq belgisi, e’lonlar yuqorida, ko‘proq mijoz')}</span>
              </div>
              <ChevronRight size={18} />
            </button>
          )
        )}

        {/* ---------- Rolga qarab panellar ---------- */}
        {isOwnProfile && isProvider && myProvider && <ProviderPanel provider={myProvider} />}

        {/* Usta yoki sotuvchi bo'lsa ham o'zi usta chaqira oladi — mijoz paneli hammaga */}
        {isOwnProfile && (
          <section className="pf-card pf-cta">
            <span className="pf-panel__icon"><Wrench size={18} /></span>
            <div className="pf-cta__text">
              <h3>{t('profile.client.title', 'Usta kerakmi?')}</h3>
              <p>{t('profile.client.text', 'So‘rov yuboring — ustalar o‘zi taklif beradi')}</p>
            </div>
            <div className="pf-cta__actions">
              <button type="button" className="pf-btn pf-btn--primary" onClick={() => navigate('/request')}>
                {t('profile.client.call', 'Usta chaqirish')}
              </button>
              <button type="button" className="pf-btn pf-btn--ghost" onClick={() => navigate('/my-requests')}>
                {t('profile.client.myRequests', 'So‘rovlarim')}
              </button>
            </div>
            {!isProvider && (
              <button type="button" className="pf-become" onClick={() => navigate('/become-provider')}>
                <Hammer size={15} /> {t('profile.becomeProvider', 'Usta bo‘lib ishlash')} <ChevronRight size={15} />
              </button>
            )}
          </section>
        )}

        {isOwnProfile && (isBusiness || isCompany) && (
          <section className="pf-card pf-panel">
            <header className="pf-panel__head">
              <span className="pf-panel__icon"><BarChart3 size={18} /></span>
              <div>
                <h3>{t('profile.businessDashboard.title', 'Biznes paneli')}</h3>
                <p>{t('profile.businessDashboard.subtitle', 'E’lonlaringiz natijalari')}</p>
              </div>
            </header>
            <div className="pf-mini-stats pf-mini-stats--4">
              <div><strong>{stats.equipment || 0}</strong><span>{t('profile.businessDashboard.equipment', 'Tovarlar')}</span></div>
              <div><strong>{stats.services || 0}</strong><span>{t('profile.businessDashboard.services', 'Xizmatlar')}</span></div>
              <div><strong>{stats.locations || 0}</strong><span>{t('profile.businessDashboard.locations', 'Joylar')}</span></div>
              <div><strong>{stats.views || 0}</strong><span>{t('profile.businessDashboard.views', 'Ko‘rishlar')}</span></div>
            </div>
          </section>
        )}

        {isOwnProfile && isBusiness && <BusinessSummaryWidget />}
        {isOwnProfile && isCompany && <SupplierStatsWidget />}

        {isOwnProfile && sellerActions.length > 0 && (
          <section className="pf-actions-grid">
            {sellerActions.map((a) => (
              <Link key={a.to} to={a.to} className="pf-action">
                <span className="pf-action__icon"><a.icon size={18} /></span>
                <span className="pf-action__label">{a.label}</span>
                {a.hint && <span className="pf-action__hint">{a.hint}</span>}
              </Link>
            ))}
          </section>
        )}

        {/* ---------- E'lonlar ---------- */}
        <section className="pf-listings">
          <div className="pf-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={15} />
                <span>{tab.label}</span>
                {tab.count > 0 && <em>{tab.count}</em>}
              </button>
            ))}
          </div>

          {activeTab === 'videos' ? (
            <ReelsStrip reels={myReels} showHeader={false} showProfileLink={false} emptyText={t('profile.emptyVideos', 'Hozircha videolar yo‘q')} />
          ) : (
            renderItems()
          )}
        </section>
      </div>

      {/* ---------- Tahrirlash oynasi ---------- */}
      {editOpen && (
        <Sheet
          title={t('profile.editProfile', 'Profilni tahrirlash')}
          onClose={() => !saving && setEditOpen(false)}
          footer={(
            <>
              <button type="button" className="pf-btn pf-btn--ghost" onClick={() => setEditOpen(false)} disabled={saving}>
                {t('profile.cancel', 'Bekor qilish')}
              </button>
              <button type="button" className="pf-btn pf-btn--primary" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={16} className="pf-spin" />} {t('profile.save', 'Saqlash')}
              </button>
            </>
          )}
        >
          <div className="pf-edit-avatar">
            <Avatar src={avatarPreview || profile.avatar_url} name={formData.fullName || name} size={84} />
            <label className="pf-btn pf-btn--ghost pf-btn--sm">
              {avatarUploading ? <Loader2 size={15} className="pf-spin" /> : <Camera size={15} />}
              {t('profile.changePhoto', 'Rasmni o‘zgartirish')}
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </label>
          </div>

          <label className="pf-field">
            <span>{t('profile.fields.name', 'Ism va familiya')}</span>
            <input
              value={formData.fullName}
              onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
              maxLength={60}
              autoComplete="name"
              placeholder={t('profile.fields.namePlaceholder', 'Masalan: Akmal Karimov')}
            />
          </label>
          <label className="pf-field">
            <span>{t('profile.fields.phone', 'Telefon')}</span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              maxLength={20}
              autoComplete="tel"
              placeholder="+998 90 000 00 00"
            />
          </label>
          <label className="pf-field">
            <span>
              {t('profile.fields.bio', 'O‘zingiz haqingizda')}
              <small>{formData.bio.length}/{BIO_MAX}</small>
            </span>
            <textarea
              rows={4}
              value={formData.bio}
              maxLength={BIO_MAX}
              onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
              placeholder={t('profile.fields.bioPlaceholder', 'Nima bilan shug‘ullanasiz, tajribangiz, ish vaqtingiz...')}
            />
          </label>
        </Sheet>
      )}

      {/* ---------- Ulashish ---------- */}
      {shareOpen && (
        <Sheet title={t('profile.share', 'Ulashish')} onClose={() => setShareOpen(false)}>
          <QRCodeGenerator value={profileUrl} onClose={() => setShareOpen(false)} />
        </Sheet>
      )}

      {/* ---------- Obunachilar / obunalar ---------- */}
      {listSheet && (
        <Sheet
          title={`${listSheet === 'subscribers' ? t('profile.subscribers', 'Obunachilar') : t('profile.subscriptions', 'Obunalar')} · ${people.length}`}
          onClose={() => setListSheet(null)}
        >
          {people.length === 0 ? (
            <div className="pf-empty pf-empty--flat">
              <span className="pf-empty__icon"><Users size={24} /></span>
              <p>
                {listSheet === 'subscribers'
                  ? t('profile.noSubscribers', 'Hozircha obunachilar yo‘q')
                  : t('profile.noSubscriptions', 'Hozircha hech kimga obuna bo‘lmagansiz')}
              </p>
            </div>
          ) : (
            <ul className="pf-people">
              {people.map((p) => (
                <li key={p._id}>
                  <Link to={`/profile/${p._id}`} onClick={() => setListSheet(null)}>
                    <Avatar src={p.avatar_url} name={p.fullName} size={44} />
                    <span>
                      <strong>{p.fullName || t('profile.noName', 'Ism kiritilmagan')}</strong>
                      {p.subscribedAt && <small>{new Date(p.subscribedAt).toLocaleDateString(locale)}</small>}
                    </span>
                  </Link>
                  {listSheet === 'following' && (
                    <button type="button" className="pf-btn pf-btn--ghost pf-btn--sm" disabled={unsubscribingId === p._id} onClick={() => handleUnsubscribe(p._id)}>
                      {unsubscribingId === p._id ? <Loader2 size={14} className="pf-spin" /> : <UserMinus size={14} />}
                      {t('profile.unfollow', 'Bekor qilish')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      )}
    </div>
  );
}
