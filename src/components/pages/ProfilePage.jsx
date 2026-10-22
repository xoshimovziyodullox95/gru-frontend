import { safeGoBack } from '../utils/navigation.js';
// src/components/pages/ProfilePage.jsx
/* ============================================================
   PROFILE PAGE — rolga qarab ajratilgan (FINAL)
   ============================================================ */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import SettingsModal from './SettingsModal';
import BusinessSummaryWidget from '../business/BusinessSummaryWidget';
import SupplierStatsWidget from '../business/SupplierStatsWidget';
import ReelsStrip from '../common/Reelsstrip';

import { formatPrice } from '../utils/formatPrice';
import {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  getMyLocations,
  getMyEquipment,
  getMyServices,
  deleteLocation,
  deleteEquipment,
  deleteService,
  getUserById,
  getLocationsByUserId,
  getEquipmentByUserId,
  getServicesByUserId,
  getSubscribers,
  getMySubscriptions,
  unsubscribeFromUser,
  subscribeToUser,
  isSubscribed,
  getDashboardStats,
  cancelSubscription,
} from '../services/user';
import { getServiceProviders } from '../services/serviceProviders';
import { getPosts } from '../services/videos';

import {
  Edit, Save, Camera, Trash2, MapPin, Wrench, Briefcase, Store,
  Play, ArrowLeft, ArrowRight, BadgeCheck, Crown, Star, Users,
  X, Shield, CheckCircle, Phone, Package,
  Eye, BarChart3, UserCheck, UserMinus, Settings,
  UserPlus, UserX, QrCode, Heart, MessageCircle,
  ChevronRight, Copy, Check,
  Truck, Send, Hammer, Clock, Inbox,
} from 'lucide-react';

import '../../styles/profile.css';

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Rolni faqat profile.role asosida aniqlaydi.
 */
function resolveRole(profile) {
  const role = normalizeRole(profile?.role);

  if (
    role === 'provider' ||
    role === 'master' ||
    role === 'usta' ||
    role === 'service_provider'
  ) {
    return 'provider';
  }

  if (role === 'business' || role === 'biznes') return 'business';
  if (role === 'company' || role === 'supplier') return 'company';
  if (role === 'seller' || role === 'sotuvchi') return 'seller';

  return 'client';
}

/**
 * Provayder yozuvidan owner ID ni olishga harakat qiladi.
 */
function extractOwnerId(provider) {
  if (!provider) return null;

  const candidates = [provider.userId, provider.user, provider.owner];

  for (const c of candidates) {
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

/* ============================================================
   QR CODE GENERATOR
   ============================================================ */

export const QRCodeGenerator = ({ value, onClose }) => {
  const [copied, setCopied] = useState(false);

  const generateQR = (text) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      text
    )}`;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Link nusxalandi!');
      })
      .catch(() => toast.error('Nusxalashda xatolik'));
  };

  return (
    <div className="settings-modal-content qr-modal">
      <div className="settings-modal-header">
        <h3>
          <QrCode size={20} /> Profil QR kodi
        </h3>
        <button className="settings-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="qr-body">
        <div className="qr-image-wrap">
          <img src={generateQR(value)} alt="QR Code" className="qr-image" />
        </div>
        <div className="qr-link-wrap">
          <input
            type="text"
            value={value}
            readOnly
            className="qr-link-input"
          />
          <button className="qr-copy-btn" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Nusxalandi' : 'Nusxalash'}
          </button>
        </div>
        <p className="qr-hint">QR kodni skaner qilib profilga o'tish</p>
      </div>
    </div>
  );
};

/* ============================================================
   ACTIVITY LIST
   ============================================================ */

export const ActivityList = ({ userId }) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await getPosts();
        const posts = res.data || [];
        const list = [];

        posts.forEach((post) => {
          if (post.likes?.some((id) => id.toString() === userId?.toString())) {
            list.push({
              id: `like-${post._id}`,
              type: 'like',
              postId: post._id,
              postTitle: post.title || 'Video',
              createdAt: post.createdAt,
            });
          }
          post.comments?.forEach((c) => {
            if (c.userId?.toString() === userId?.toString()) {
              list.push({
                id: `comment-${post._id}-${c._id}`,
                type: 'comment',
                postId: post._id,
                postTitle: post.title || 'Video',
                commentText: c.text,
                createdAt: c.createdAt,
              });
            }
          });
        });

        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivities(list.slice(0, 50));
      } catch (err) {
        console.error('Faoliyat xato:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchActivities();
  }, [userId]);

  if (loading)
    return (
      <div className="activity-loading">
        {t('profile.activity.loading', 'Yuklanmoqda...')}
      </div>
    );

  if (!activities.length)
    return (
      <div className="activity-empty">
        {t('profile.activity.empty', "Hozircha faoliyat yo'q")}
      </div>
    );

  return (
    <div className="activity-list">
      {activities.map((act) => (
        <div
          key={act.id}
          className="activity-item"
          onClick={() => navigate(`/posts/${act.postId}`)}
        >
          <div className="activity-icon">
            {act.type === 'like' ? (
              <Heart size={16} color="#ff3040" fill="#ff3040" />
            ) : (
              <MessageCircle size={16} color="#0095f6" />
            )}
          </div>
          <div className="activity-content">
            <span className="activity-type">
              {act.type === 'like'
                ? t('profile.activity.like', 'Yoqtirdi')
                : t('profile.activity.comment', 'Izoh')}
            </span>
            <span className="activity-title">{act.postTitle}</span>
            {act.type === 'comment' && (
              <span className="activity-text">"{act.commentText}"</span>
            )}
            <span className="activity-date">
              {new Date(act.createdAt).toLocaleDateString('uz-UZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </div>
          <ChevronRight size={16} className="activity-arrow" />
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   USTA PANELI
   ============================================================ */

function ProviderDashboard({ provider, isOwnProfile }) {
  if (!provider || !isOwnProfile) return null;

  const avgRating = Number(provider.averageRating) || 0;
  const ratingsCount = Number(provider.ratingsCount) || 0;
  const category = provider.service_category || '—';
  const company = provider.company || '';
  const hasLocation = Boolean(provider.location?.address);

  return (
    <div className="provider-dashboard">
      <header className="provider-dashboard__head">
        <div className="provider-dashboard__title">
          <span className="provider-dashboard__title-icon">
            <Wrench size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h3>Usta paneli</h3>
            <p>{company || category}</p>
          </div>
        </div>

        <div className="provider-dashboard__rating">
          <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
          <strong>{avgRating || '—'}</strong>
          <small>({ratingsCount} sharh)</small>
        </div>
      </header>

      <div className="provider-dashboard__grid">
        <div className="provider-stat">
          <span className="provider-stat__icon provider-stat__icon--orange">
            <Briefcase size={16} />
          </span>
          <div>
            <strong>{category}</strong>
            <small>Xizmat turi</small>
          </div>
        </div>

        <div className="provider-stat">
          <span className="provider-stat__icon provider-stat__icon--green">
            <CheckCircle size={16} />
          </span>
          <div>
            <strong>{ratingsCount}</strong>
            <small>Sharhlar</small>
          </div>
        </div>

        <div className="provider-stat">
          <span className="provider-stat__icon provider-stat__icon--blue">
            <MapPin size={16} />
          </span>
          <div>
            <strong>{hasLocation ? 'Belgilangan' : "Yo'q"}</strong>
            <small>Manzil</small>
          </div>
        </div>

        <div className="provider-stat">
          <span className="provider-stat__icon provider-stat__icon--purple">
            <Star size={16} />
          </span>
          <div>
            <strong>{avgRating ? avgRating.toFixed(1) : 'Yangi'}</strong>
            <small>Reyting</small>
          </div>
        </div>
      </div>

      <div className="provider-dashboard__links">
        <Link to="/provider-requests" className="provider-link">
          <Inbox size={15} />
          Kelgan so'rovlar
          <ChevronRight size={14} />
        </Link>

        <Link to="/history" className="provider-link">
          <Clock size={15} />
          Ish tarixi
          <ChevronRight size={14} />
        </Link>

        <Link
          to={`/service-provider/${provider._id}`}
          className="provider-link"
        >
          <Eye size={15} />
          Mening xizmatim
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   MIJOZ CTA
   ============================================================ */

function ClientRequestCta({ navigate }) {
  return (
    <div className="client-cta-card">
      <div className="client-cta-card__head">
        <span className="client-cta-card__icon">
          <Wrench size={20} strokeWidth={2.2} />
        </span>
        <div>
          <h3>Usta kerakmi?</h3>
          <p>
            3 qadamda so'rov yuboring — ustalar sizga o'zi murojaat qiladi
          </p>
        </div>
      </div>

      <button
        type="button"
        className="client-cta-card__btn"
        onClick={() => navigate('/request')}
      >
        <Wrench size={16} />
        Usta chaqirish
        <ChevronRight size={16} />
      </button>

      <button
        type="button"
        className="client-cta-card__ghost"
        onClick={() => navigate('/my-requests')}
      >
        <Clock size={15} />
        Mening so'rovlarim
      </button>
    </div>
  );
}

/* ============================================================
   ASOSIY COMPONENT
   ============================================================ */

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const { userId } = useParams();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myLocations, setMyLocations] = useState([]);
  const [myEquipment, setMyEquipment] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [myProvider, setMyProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    bio: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [activeTab, setActiveTab] = useState('locations');
  const [stats, setStats] = useState({
    listings: 0,
    views: 0,
    locations: 0,
    equipment: 0,
    services: 0,
  });

  const [showSettings, setShowSettings] = useState(() => searchParams.get('settings') === '1');

  const [subscribers, setSubscribers] = useState([]);
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  const [following, setFollowing] = useState([]);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [unsubscribingId, setUnsubscribingId] = useState(null);

  const [cancelling, setCancelling] = useState(false);
  const [isSubscribedState, setIsSubscribedState] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  /* ---------------- DERIVED ---------------- */

  const isOwnProfile = !userId || (user && userId === user.id);

  const roleKey = resolveRole(profile);

  /* ============================================================
     USTA ANIQLASH — QAT'IY QOIDA
     - role 'provider'  в†’ usta
     - role 'client' + provayder yozuvi в†’ usta (sirojiddin kabi holat)
     - role 'company' / 'business' / 'seller' в†’ HECH QACHON usta emas
     ============================================================ */
  const isProvider =
    roleKey === 'provider' ||
    (roleKey === 'client' && Boolean(myProvider));

  const isBusiness = roleKey === 'business';
  const isCompany = roleKey === 'company';
  const isSeller = roleKey === 'seller';
  const isClient = roleKey === 'client' && !isProvider;

  const isPremium = Boolean(profile?.isPremium);

  /* ============================================================
     LOAD DATA
     ============================================================ */

  const loadData = async () => {
    try {
      setLoading(true);

      let profRes, locRes, eqRes, servRes;

      if (isOwnProfile) {
        [profRes, locRes, eqRes, servRes] = await Promise.all([
          getUserProfile(),
          getMyLocations(),
          getMyEquipment(),
          getMyServices(),
        ]);
      } else {
        [profRes, locRes, eqRes, servRes] = await Promise.all([
          getUserById(userId),
          getLocationsByUserId(userId),
          getEquipmentByUserId(userId),
          getServicesByUserId(userId),
        ]);
      }

      const profileData = profRes.data || {};
      setProfile(profileData);
      setFormData({
        fullName: profileData.fullName || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
      });

      setMyLocations(locRes.data || []);
      setMyEquipment(eqRes.data || []);
      setMyServices(servRes.data || []);

      /* ============================================================
         Provayderni faqat quyidagi hollarda tekshiramiz:
         - role 'provider'
         - role 'client' (user)
         Boshqa rollar (company, business, seller) uchun — so'rov yubormaymiz
         ============================================================ */

      const targetUserId = profileData._id || userId;
      const roleFromProfile = normalizeRole(profileData.role);

      const shouldCheckProvider =
        roleFromProfile === 'provider' ||
        roleFromProfile === 'master' ||
        roleFromProfile === 'usta' ||
        roleFromProfile === 'service_provider' ||
        roleFromProfile === 'client' ||
        roleFromProfile === 'user' ||
        roleFromProfile === '' ||
        roleFromProfile === 'customer' ||
        roleFromProfile === 'mijoz';

      let ownedCount = 0;
      let firstOwnedName = null;

      if (!targetUserId || !shouldCheckProvider) {
        setMyProvider(null);
      } else {
        try {
          const providersRes = await getServiceProviders({
            userId: targetUserId,
            limit: 20,
          });

          const arr =
            providersRes.data?.items ||
            providersRes.data?.data ||
            providersRes.data ||
            [];

          const owned = Array.isArray(arr)
            ? arr.filter((p) => {
                const ownerId = extractOwnerId(p);
                if (!ownerId || !targetUserId) return false;
                return ownerId === String(targetUserId);
              })
            : [];

          ownedCount = owned.length;
          const first = owned[0];

          if (first) {
            firstOwnedName = first.name || first.company;

            const ratings = Array.isArray(first.ratings) ? first.ratings : [];
            const avgRating = ratings.length
              ? ratings.reduce((s, r) => s + Number(r.value || 0), 0) /
                ratings.length
              : Number(first.averageRating) || 0;

            setMyProvider({
              _id: first._id,
              name: first.name,
              company: first.company,
              service_category: first.service_category,
              location: first.location,
              averageRating: avgRating,
              ratingsCount: ratings.length || first.ratingsCount || 0,
            });
          } else {
            setMyProvider(null);
          }
        } catch (err) {
          console.warn('Provayder aniqlanmadi:', err);
          setMyProvider(null);
        }
      }

      console.log('рџ”Ќ PROFIL DEBUG:', {
        email: profileData.email,
        role: roleFromProfile,
        roleKey: resolveRole(profileData),
        targetUserId,
        shouldCheckProvider,
        ownedCount,
        firstOwnedName,
      });
    } catch (err) {
      console.error("Ma'lumot xato:", err);
      toast.error(t('profile.error') || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     HANDLERS
     ============================================================ */

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append('avatar', file);

    try {
      const res = await uploadUserAvatar(fd);
      setProfile((p) => ({ ...p, avatar_url: res.data.avatar_url }));
      toast.success('Avatar yangilandi!');
    } catch {
      toast.error('Avatar yuklashda xatolik');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode && profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      const res = await updateUserProfile(formData);
      setProfile(res.data);
      setEditMode(false);
      toast.success('Profil yangilandi!');
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    try {
      if (type === 'location') await deleteLocation(id);
      else if (type === 'equipment') await deleteEquipment(id);
      else if (type === 'service') await deleteService(id);
      loadData();
      toast.success("O'chirildi");
    } catch {
      toast.error("O'chirishda xatolik");
    }
  };

  const handleCancelPremium = async () => {
    if (!window.confirm("Premium a'zolikni bekor qilmoqchimisiz?")) return;
    setCancelling(true);
    try {
      await cancelSubscription();
      const updated = await getUserProfile();
      setProfile(updated.data);
      toast.success('Premium bekor qilindi');
    } catch (err) {
      toast.error(err.message || 'Xatolik');
    } finally {
      setCancelling(false);
    }
  };

  const handleUnsubscribe = async (businessId) => {
    if (!window.confirm('Obunani bekor qilmoqchimisiz?')) return;
    setUnsubscribingId(businessId);
    try {
      await unsubscribeFromUser(businessId);
      setFollowing((prev) => prev.filter((i) => i._id !== businessId));
      toast.success('Obuna bekor qilindi');
    } catch (err) {
      toast.error(err.message || 'Xatolik');
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
        toast.success('Obuna bekor qilindi');
      } else {
        await subscribeToUser(userId);
        setIsSubscribedState(true);
        toast.success("Obuna bo'ldingiz!");
      }
    } catch (err) {
      toast.error(err.message || 'Xatolik');
    } finally {
      setSubscribing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Chiqib ketildi');
  };

  /* ============================================================
     EFFECTS
     ============================================================ */

  useEffect(() => {
    if (isOwnProfile && (isBusiness || isCompany)) {
      getDashboardStats()
        .then((res) => setStats(res.data))
        .catch(() => {});
    }
     
  }, [isOwnProfile, isBusiness, isCompany]);

  useEffect(() => {
    if (isOwnProfile && (isBusiness || isCompany)) {
      const run = async () => {
        setLoadingSubscribers(true);
        try {
          const res = await getSubscribers();
          setSubscribers(res.data || []);
        } catch {
          // Keep the profile usable when subscription data is temporarily unavailable.
        } finally {
          setLoadingSubscribers(false);
        }
      };
      run();
    }
     
  }, [isOwnProfile, isBusiness, isCompany]);

  useEffect(() => {
    if (isOwnProfile) {
      const run = async () => {
        setLoadingFollowing(true);
        try {
          const res = await getMySubscriptions();
          setFollowing(res.data || []);
        } catch {
          // Keep the profile usable when following data is temporarily unavailable.
        } finally {
          setLoadingFollowing(false);
        }
      };
      run();
    }
  }, [isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile && userId) {
      const run = async () => {
        try {
          const res = await isSubscribed(userId);
          setIsSubscribedState(res.data.isSubscribed);
        } catch {
          // A failed status lookup should not block viewing the profile.
        }
      };
      run();
    }
  }, [isOwnProfile, userId]);

  useEffect(() => {
    if (!user && !userId) {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]);

  /* ============================================================
     RENDER
     ============================================================ */

  if (loading)
    return (
      <div className="profile-loading">
        {t('profile.loading', 'Yuklanmoqda...')}
      </div>
    );

  if (!profile)
    return (
      <div className="profile-error">
        {t('profile.error', 'Xatolik yuz berdi')}
      </div>
    );

  const avatarUrl =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile.fullName || profile.email || 'User'
    )}&background=00E5FF&color=fff&rounded=true&size=120`;

  const myReels = [
    ...myLocations.flatMap((item) =>
      (item.media || []).map((m, idx) => ({
        id: `loc-${item._id}-${idx}`,
        videoUrl: m.url || m,
        title: item.title,
        typeLabel: t('profile.tabs.locations', 'Joylar'),
        link: `/location/${item._id}`,
      }))
    ),
    ...myEquipment.flatMap((item) =>
      (item.media || []).map((m, idx) => ({
        id: `eq-${item._id}-${idx}`,
        videoUrl: m.url || m,
        title: item.title,
        typeLabel: t('profile.tabs.equipment', 'Tovarlar'),
        link: `/equipment/${item._id}`,
      }))
    ),
    ...myServices.flatMap((item) =>
      (item.media || []).map((m, idx) => ({
        id: `svc-${item._id}-${idx}`,
        videoUrl: m.url || m,
        title: item.name,
        typeLabel: t('profile.tabs.services', 'Xizmatlar'),
        link: `/services/${item._id}`,
      }))
    ),
  ];

  const renderItems = () => {
    let items = [];
    if (activeTab === 'locations') items = myLocations;
    else if (activeTab === 'equipment') items = myEquipment;
    else if (activeTab === 'services') items = myServices;

    if (!items.length) {
      return (
        <div className="empty-state">
          {t('profile.emptyListings', "Hozircha e'lonlar yo'q")}
        </div>
      );
    }

    const itemType =
      activeTab === 'locations'
        ? 'location'
        : activeTab === 'equipment'
        ? 'equipment'
        : 'service';
    // Xizmat e'loni sahifasi va tahrirlash yo'li boshqa nomda
    const detailPath = itemType === 'service' ? 'service-provider' : itemType;

    return items.map((item) => {
      const viewsCount = item.views || 0;
      const likesCount = item.likes?.length || 0;
      const commentsCount = item.comments?.length || 0;

      return (
        <div key={item._id} className="olx-item-card">
          <img
            src={item.images?.[0] || '/images/zumo-placeholder.svg'}
            alt={item.title}
            className="olx-item-thumb"
            onClick={() => navigate(`/${detailPath}/${item._id}`)}
          />
          <div className="olx-item-body">
            <span className="olx-item-date">
              {new Date(item.createdAt).toLocaleDateString('uz-UZ', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
            <h4
              className="olx-item-title"
              onClick={() => navigate(`/${detailPath}/${item._id}`)}
            >
              {item.title}
            </h4>
            {(item.price || item.price_range) && (
              <span className="olx-item-price">
                {formatPrice(item.price || item.price_range, item.currency)}
              </span>
            )}
            <div className="olx-item-stats">
              <span>
                <MessageCircle size={14} /> {commentsCount}
              </span>
              <span>
                <Eye size={14} /> {viewsCount}
              </span>
              <span>
                <Heart size={14} /> {likesCount}
              </span>
            </div>
            {isOwnProfile && (
              <div className="olx-item-actions">
                <button
                  onClick={() =>
                    navigate(`/edit/${itemType}/${item._id}`)
                  }
                  className="olx-btn-outline"
                >
                  <Edit size={15} /> {t('profile.actions.edit', 'Tahrirlash')}
                </button>
                <button
                  onClick={() => handleDeleteItem(itemType, item._id)}
                  className="olx-btn-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="profile-container">
      <button className="back-btn" onClick={() => safeGoBack(navigate)}>
        <ArrowLeft size={18} /> {t('profile.back', 'Orqaga')}
      </button>

      <div className="profile-header">
        {isOwnProfile && (
          <button
            className="settings-btn-top"
            onClick={() => setShowSettings(true)}
            title={t('profile.settings.title', 'Sozlamalar')}
          >
            <Settings size={22} />
          </button>
        )}

        <div className="avatar-section">
          <img
            src={avatarPreview || avatarUrl}
            alt="Avatar"
            className="profile-avatar"
          />
          {isOwnProfile && (
            <label className="avatar-upload-label">
              <Camera size={20} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        <div className="profile-info">
          {editMode && isOwnProfile ? (
            <div className="edit-fields">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ism sharif"
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Telefon"
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder={t('profile.bioPlaceholder', "O'zingiz haqingizda")}
                rows="2"
              />
            </div>
          ) : (
            <>
              <div className="profile-name-row">
                <h2>{profile.fullName || 'Ism sharif'}</h2>

                {isPremium && (
                  <span
                    className="premium-badge"
                    title={t('profile.premiumBadge', 'Premium')}
                  >
                    <BadgeCheck
                      size={18}
                      fill="#4B9EFF"
                      color="#fff"
                      strokeWidth={1.5}
                    />
                  </span>
                )}

                {isProvider && (
                  <span className="provider-badge">
                    <Wrench size={13} /> Usta
                  </span>
                )}

                {(isBusiness || isCompany) && (
                  <span className="business-badge">
                    <Briefcase size={14} />{' '}
                    {t('profile.businessBadge', 'Biznes')}
                  </span>
                )}

                {isSeller && (
                  <span className="business-badge">
                    <Store size={14} /> Sotuvchi
                  </span>
                )}
              </div>

              {isOwnProfile && (
                <div className="profile-stats-ig">
                  <button
                    className="ig-stat"
                    onClick={() => setShowSubscribersModal(true)}
                  >
                    <span className="ig-stat-number">
                      {subscribers.length}
                    </span>
                    <span className="ig-stat-label">
                      {t('profile.subscribers', 'Obunachilar')}
                    </span>
                  </button>
                  <button
                    className="ig-stat"
                    onClick={() => setShowFollowingModal(true)}
                  >
                    <span className="ig-stat-number">{following.length}</span>
                    <span className="ig-stat-label">
                      {t('profile.subscriptions', 'Obunalar')}
                    </span>
                  </button>
                  <button
                    className="ig-stat"
                    onClick={() => setActiveTab('videos')}
                  >
                    <span className="ig-stat-number">{myReels.length}</span>
                    <span className="ig-stat-label">
                      {t('profile.videos', 'Videolar')}
                    </span>
                  </button>
                </div>
              )}

              <p className="profile-bio">
                {profile.bio ||
                  (isOwnProfile
                    ? t('profile.bioPlaceholder', "O'zingiz haqingizda")
                    : '')}
              </p>

              <div className="profile-meta">
                <span className="meta-item">{profile.email}</span>
                {profile.phone && (
                  <span className="meta-item">
                    <Phone size={14} /> {profile.phone}
                  </span>
                )}
              </div>

              <div className="profile-role-info">
                <span className="role-text">
                  {isProvider
                    ? "Usta (xizmat ko'rsatuvchi)"
                    : isBusiness
                    ? t('profile.roleBusiness', 'Biznes')
                    : isCompany
                    ? t('profile.roleCompany', 'Kompaniya')
                    : isSeller
                    ? t('profile.roleSeller', 'Sotuvchi')
                    : t('profile.roleUser', 'Oddiy foydalanuvchi')}
                </span>
              </div>
            </>
          )}

          <div className="profile-actions">
            {isOwnProfile ? (
              editMode ? (
                <button onClick={handleSave} className="save-btn">
                  <Save size={18} /> {t('profile.save', 'Saqlash')}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="edit-profile-btn"
                  >
                    <Edit size={18} /> {t('profile.edit', 'Tahrirlash')}
                  </button>

                  {isPremium ? (
                    <button
                      onClick={handleCancelPremium}
                      className="cancel-premium-btn"
                      disabled={cancelling}
                    >
                      <X size={16} />{' '}
                      {cancelling
                        ? t('profile.cancelling', 'Bekor qilinmoqda...')
                        : t(
                            'profile.cancelPremium',
                            'Premiumni bekor qilish'
                          )}
                    </button>
                  ) : (
                    <button
                      className="premium-btn"
                      onClick={() => navigate('/premium')}
                    >
                      <Crown size={16} />{' '}
                      {t('profile.becomePremium', 'Premium olish')}
                    </button>
                  )}

                  {isClient && (
                    <button
                      type="button"
                      className="become-provider-btn"
                      onClick={() => navigate('/become-provider')}
                    >
                      <Hammer size={16} />
                      {t(
                        'profile.becomeProvider',
                        "Xizmat ko'rsatuvchi bo'lish"
                      )}
                    </button>
                  )}
                </>
              )
            ) : (
              <button
                className={`subscribe-btn ${
                  isSubscribedState ? 'subscribed' : ''
                }`}
                onClick={handleToggleSubscribe}
                disabled={subscribing}
              >
                {isSubscribedState ? (
                  <>
                    <UserX size={16} />{' '}
                    {t('profile.unsubscribe', 'Bekor qilish')}
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />{' '}
                    {t('profile.subscribe', 'Obuna')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          USTA PANELI — faqat isProvider uchun
         ============================================================ */}

      {isOwnProfile && isProvider && myProvider && (
        <ProviderDashboard provider={myProvider} isOwnProfile={isOwnProfile} />
      )}

      {/* ============================================================
          MIJOZ CTA — faqat isClient uchun
         ============================================================ */}

      {isOwnProfile && isClient && <ClientRequestCta navigate={navigate} />}

      {/* ============================================================
          BIZNES DASHBOARD — faqat business/company uchun
         ============================================================ */}

      {(isBusiness || isCompany) && isOwnProfile && (
        <div className="business-dashboard">
          <h3>
            <Shield size={18} />{' '}
            {t('profile.businessDashboard.title', 'Biznes paneli')}
          </h3>
          <div className="stats-grid-mini">
            <div className="stat-mini">
              <span>
                <MapPin size={14} />{' '}
                {t('profile.businessDashboard.locations', 'Joylar')}
              </span>
              <strong>{stats.locations || 0}</strong>
            </div>
            <div className="stat-mini">
              <span>
                <Wrench size={14} />{' '}
                {t('profile.businessDashboard.equipment', 'Tovarlar')}
              </span>
              <strong>{stats.equipment || 0}</strong>
            </div>
            <div className="stat-mini">
              <span>
                <Briefcase size={14} />{' '}
                {t('profile.businessDashboard.services', 'Xizmatlar')}
              </span>
              <strong>{stats.services || 0}</strong>
            </div>
            <div className="stat-mini">
              <span>
                <Eye size={14} />{' '}
                {t('profile.businessDashboard.views', "Ko'rishlar")}
              </span>
              <strong>{stats.views || 0}</strong>
            </div>
          </div>
          <Link to="/dashboard" className="dashboard-link">
            <BarChart3 size={16} />{' '}
            {t('profile.businessDashboard.details', 'Batafsil')}{' '}
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {isBusiness && isOwnProfile && (
        <>
          <BusinessSummaryWidget />
          <Link to="/my-branches" className="bsw-branches-link">
            <MapPin size={15} /> Mening filiallarim
          </Link>
          <Link to="/my-orders" className="bsw-branches-link">
            <Package size={15} /> Buyurtmalarim
          </Link>
          <Link to="/received-orders" className="bsw-branches-link">
            <Truck size={15} /> Kelgan buyurtmalar
          </Link>
          <Link to="/broadcast-ad" className="bsw-branches-link">
            <Send size={15} /> Reklama tarqatish
          </Link>
          <Link to="/business" className="bsw-branches-link">
            <Package size={15} /> ZUMO Business (Ombor, Kirim, Kassa)
          </Link>
        </>
      )}

      {isCompany && isOwnProfile && (
        <>
          <SupplierStatsWidget />
          <Link to="/received-orders" className="bsw-branches-link">
            <Truck size={15} /> Kelgan buyurtmalar
          </Link>
          <Link to="/broadcast-ad" className="bsw-branches-link">
            <Send size={15} /> Reklama tarqatish
          </Link>
          <Link to="/business" className="bsw-branches-link">
            <Package size={15} /> ZUMO Business (Ombor, Kirim, Kassa)
          </Link>
        </>
      )}

      {isSeller && isOwnProfile && (
        <>
          <Link to="/received-orders" className="bsw-branches-link">
            <Truck size={15} /> Kelgan buyurtmalar
          </Link>
          <Link to="/broadcast-ad" className="bsw-branches-link">
            <Send size={15} /> Reklama tarqatish
          </Link>
          <Link to="/business" className="bsw-branches-link">
            <Package size={15} /> ZUMO Business (Ombor, Kirim, Kassa)
          </Link>
        </>
      )}

      {/* ============================================================
          TABLAR
         ============================================================ */}

      <div className="profile-tabs">
        <button
          className={activeTab === 'locations' ? 'active' : ''}
          onClick={() => setActiveTab('locations')}
        >
          <MapPin size={16} /> {t('profile.tabs.locations', 'Joylar')}
        </button>
        <button
          className={activeTab === 'equipment' ? 'active' : ''}
          onClick={() => setActiveTab('equipment')}
        >
          <Package size={16} /> {t('profile.tabs.equipment', 'Tovarlar')}
        </button>
        <button
          className={activeTab === 'services' ? 'active' : ''}
          onClick={() => setActiveTab('services')}
        >
          <Briefcase size={16} /> {t('profile.tabs.services', 'Xizmatlar')}
        </button>
        <button
          className={activeTab === 'videos' ? 'active' : ''}
          onClick={() => setActiveTab('videos')}
        >
          <Play size={16} /> {t('profile.tabs.videos', 'Videolar')}
        </button>
      </div>

      {activeTab === 'videos' ? (
        <ReelsStrip
          reels={myReels}
          showHeader={false}
          showProfileLink={false}
          emptyText={t('profile.emptyListings', "Hozircha e'lonlar yo'q")}
        />
      ) : (
        <div className="olx-items-list">{renderItems()}</div>
      )}

      {/* ============================================================
          MODALLAR
         ============================================================ */}

      {showSubscribersModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowSubscribersModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <Users size={20} />{' '}
                {t('profile.subscriberModal.title', 'Obunachilar')} (
                {subscribers.length})
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowSubscribersModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loadingSubscribers ? (
                <div className="modal-loading">
                  {t('profile.subscriberModal.loading', 'Yuklanmoqda...')}
                </div>
              ) : subscribers.length === 0 ? (
                <div className="modal-empty">
                  {t(
                    'profile.subscriberModal.empty',
                    "Hozircha obunachilar yo'q"
                  )}
                </div>
              ) : (
                <ul className="subscriber-list">
                  {subscribers.map((sub) => (
                    <li key={sub._id} className="subscriber-item">
                      <img
                        src={sub.avatar_url || '/images/zumo-placeholder.svg'}
                        alt={sub.fullName}
                      />
                      <div className="sub-info">
                        <span className="sub-name">{sub.fullName}</span>
                        <span className="sub-email">{sub.email}</span>
                      </div>
                      <span className="sub-date">
                        {new Date(sub.subscribedAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showFollowingModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowFollowingModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <UserCheck size={20} />{' '}
                {t('profile.followingModal.title', 'Obunalar')} (
                {following.length})
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowFollowingModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loadingFollowing ? (
                <div className="modal-loading">
                  {t('profile.followingModal.loading', 'Yuklanmoqda...')}
                </div>
              ) : following.length === 0 ? (
                <div className="modal-empty">
                  {t(
                    'profile.followingModal.empty',
                    "Hozircha obunalar yo'q"
                  )}
                </div>
              ) : (
                <ul className="subscriber-list">
                  {following.map((item) => (
                    <li key={item._id} className="subscriber-item">
                      <Link to={`/profile/${item._id}`} className="sub-link">
                        <img
                          src={item.avatar_url || '/images/zumo-placeholder.svg'}
                          alt={item.fullName}
                        />
                        <div className="sub-info">
                          <span className="sub-name">{item.fullName}</span>
                          <span className="sub-email">{item.email}</span>
                        </div>
                      </Link>
                      <button
                        className="unfollow-btn"
                        disabled={unsubscribingId === item._id}
                        onClick={() => handleUnsubscribe(item._id)}
                        title={t(
                          'profile.followingModal.unfollow',
                          'Obunani bekor qilish'
                        )}
                      >
                        <UserMinus size={16} />
                        {unsubscribingId === item._id
                          ? t('profile.cancelling', '...')
                          : t(
                              'profile.followingModal.unfollow',
                              'Bekor qilish'
                            )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        profile={profile}
        user={user}
        stats={stats}
        isPremium={isPremium}
        onLogout={handleLogout}
        onOpenEditProfile={() => {
          setShowSettings(false);
          handleEditToggle();
        }}
      />
    </div>
  );
}



  
