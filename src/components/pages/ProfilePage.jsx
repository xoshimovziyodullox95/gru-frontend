// src/components/pages/ProfilePage.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import SettingsModal from './SettingsModal';
import BusinessSummaryWidget from '../business/BusinessSummaryWidget';
import SupplierStatsWidget from '../business/SupplierStatsWidget';
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
import {
  Edit, Save, Camera, Trash2, MapPin, Wrench, Briefcase,
  Play, ArrowLeft, ArrowRight, BadgeCheck, Crown, Users,
  X, Shield, Calendar, CheckCircle, Phone, Package,
  Eye, BarChart3, UserCheck, UserMinus, Coins, Settings,
  UserPlus, UserX, LogOut, QrCode, Heart, MessageCircle,
  User as UserIcon, ChevronRight, Copy, Check,
  Truck  // <--- YANGI QO'SHILDI
} from 'lucide-react';
import ReelsStrip from '../common/Reelsstrip';
import { getPosts, likePost, commentPost } from '../services/videos';
import toast from 'react-hot-toast';
import '../../styles/profile.css';

// ============================================================
// QR CODE GENERATOR
// ============================================================
const QRCodeGenerator = ({ value, onClose }) => {
  const [copied, setCopied] = useState(false);
  const generateQR = (text) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link nusxalandi!');
    }).catch(() => {
      toast.error('Nusxalashda xatolik');
    });
  };

  return (
    <div className="settings-modal-content qr-modal">
      <div className="settings-modal-header">
        <h3><QrCode size={20} /> Profil QR kodi</h3>
        <button className="settings-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="qr-body">
        <div className="qr-image-wrap">
          <img src={generateQR(value)} alt="QR Code" className="qr-image" />
        </div>
        <div className="qr-link-wrap">
          <input type="text" value={value} readOnly className="qr-link-input" />
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

// ============================================================
// DEYSTVIYALAR (like/comment tarixi)
// ============================================================
const ActivityList = ({ userId }) => {
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
        const activities = [];
        posts.forEach(post => {
          if (post.likes?.some(id => id.toString() === userId?.toString())) {
            activities.push({
              id: `like-${post._id}`,
              type: 'like',
              postId: post._id,
              postTitle: post.title || 'Video',
              createdAt: post.createdAt,
            });
          }
          post.comments?.forEach(c => {
            if (c.userId?.toString() === userId?.toString()) {
              activities.push({
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
        activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivities(activities.slice(0, 50));
      } catch (err) {
        console.error('Faoliyatlarni yuklashda xatolik:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchActivities();
  }, [userId]);

  if (loading) return <div className="activity-loading">{t('profile.activity.loading')}</div>;
  if (activities.length === 0) return <div className="activity-empty">{t('profile.activity.empty')}</div>;

  return (
    <div className="activity-list">
      {activities.map(act => (
        <div key={act.id} className="activity-item" onClick={() => navigate(`/posts/${act.postId}`)}>
          <div className="activity-icon">
            {act.type === 'like' ? (
              <Heart size={16} color="#ff3040" fill="#ff3040" />
            ) : (
              <MessageCircle size={16} color="#0095f6" />
            )}
          </div>
          <div className="activity-content">
            <span className="activity-type">
              {act.type === 'like' ? t('profile.activity.like') : t('profile.activity.comment')}
            </span>
            <span className="activity-title">{act.postTitle}</span>
            {act.type === 'comment' && <span className="activity-text">"{act.commentText}"</span>}
            <span className="activity-date">
              {new Date(act.createdAt).toLocaleDateString('uz-UZ', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              })}
            </span>
          </div>
          <ChevronRight size={16} className="activity-arrow" />
        </div>
      ))}
    </div>
  );
};

// ============================================================
// ASOSIY COMPONENT – ProfilePage
// ============================================================
export default function ProfilePage() {
  const { userId } = useParams();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myLocations, setMyLocations] = useState([]);
  const [myEquipment, setMyEquipment] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', bio: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('locations');
  const [stats, setStats] = useState({ listings: 0, views: 0, locations: 0, equipment: 0, services: 0 });
  const [showSettings, setShowSettings] = useState(false);

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

  const isOwnProfile = !userId || (user && userId === user.id);
  const role = profile?.role || 'user';
  const isPremium = profile?.isPremium || false;
  const maxListings = isPremium ? Infinity : (role === 'business' ? Infinity : 5);
  const currentListingsCount = myLocations.length + myEquipment.length + myServices.length;

  // ========== FUNKSIYALAR ==========
  const loadData = async () => {
    try {
      setLoading(true);
      let profRes, locRes, eqRes, servRes;

      if (isOwnProfile) {
        [profRes, locRes, eqRes, servRes] = await Promise.all([
          getUserProfile(),
          getMyLocations(),
          getMyEquipment(),
          getMyServices()
        ]);
      } else {
        [profRes, locRes, eqRes, servRes] = await Promise.all([
          getUserById(userId),
          getLocationsByUserId(userId),
          getEquipmentByUserId(userId),
          getServicesByUserId(userId)
        ]);
      }

      setProfile(profRes.data);
      setFormData({
        fullName: profRes.data.fullName || '',
        phone: profRes.data.phone || '',
        bio: profRes.data.bio || ''
      });
      setMyLocations(locRes.data || []);
      setMyEquipment(eqRes.data || []);
      setMyServices(servRes.data || []);
    } catch (err) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', err);
      toast.error(t('profile.error') || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    const uploadData = new FormData();
    uploadData.append('avatar', file);
    try {
      const res = await uploadUserAvatar(uploadData);
      setProfile(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
      toast.success('Avatar yangilandi!');
    } catch (err) {
      toast.error('Avatar yuklashda xatolik');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        bio: profile.bio || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      const res = await updateUserProfile(formData);
      setProfile(res.data);
      setEditMode(false);
      toast.success('Profil yangilandi!');
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm('Haqiqatan ham o\'chirmoqchimisiz?')) return;
    try {
      if (type === 'location') await deleteLocation(id);
      else if (type === 'equipment') await deleteEquipment(id);
      else if (type === 'service') await deleteService(id);
      loadData();
      toast.success('O\'chirildi');
    } catch (err) {
      toast.error('O\'chirishda xatolik');
    }
  };

  const handleCancelPremium = async () => {
    if (!window.confirm('Premium a\'zolikni bekor qilmoqchimisiz?')) return;
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
      setFollowing(prev => prev.filter(item => item._id !== businessId));
      toast.success('Obuna bekor qilindi');
    } catch (err) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setUnsubscribingId(null);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSubscribing(true);
    try {
      if (isSubscribedState) {
        await unsubscribeFromUser(userId);
        setIsSubscribedState(false);
        toast.success('Obuna bekor qilindi');
      } else {
        await subscribeToUser(userId);
        setIsSubscribedState(true);
        toast.success('Obuna bo\'ldingiz!');
      }
    } catch (err) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubscribing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Chiqib ketildi');
  };

  // ========== EFFECTS ==========
  // Stats yuklash
  useEffect(() => {
    if (isOwnProfile && (role === 'business' || role === 'company')) {
      getDashboardStats()
        .then(res => setStats(res.data))
        .catch(() => {});
    }
  }, [isOwnProfile, role]);

  // Obunachilar
  useEffect(() => {
    if (isOwnProfile && (role === 'business' || role === 'company')) {
      const fetchSubscribers = async () => {
        setLoadingSubscribers(true);
        try {
          const res = await getSubscribers();
          setSubscribers(res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingSubscribers(false);
        }
      };
      fetchSubscribers();
    }
  }, [isOwnProfile, role]);

  // Obunalar
  useEffect(() => {
    if (isOwnProfile) {
      const fetchFollowing = async () => {
        setLoadingFollowing(true);
        try {
          const res = await getMySubscriptions();
          setFollowing(res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingFollowing(false);
        }
      };
      fetchFollowing();
    }
  }, [isOwnProfile]);

  // Boshqa foydalanuvchi obuna holati
  useEffect(() => {
    if (!isOwnProfile && userId) {
      const checkSubscription = async () => {
        try {
          const res = await isSubscribed(userId);
          setIsSubscribedState(res.data.isSubscribed);
        } catch (err) {
          console.error(err);
        }
      };
      checkSubscription();
    }
  }, [isOwnProfile, userId]);

  // Asosiy ma'lumotlarni yuklash
  useEffect(() => {
    if (!user && !userId) {
      navigate('/login');
      return;
    }
    loadData();
  }, [userId, user]);

  // ========== RENDER ==========
  if (loading) return <div className="profile-loading">{t('profile.loading')}</div>;
  if (!profile) return <div className="profile-error">{t('profile.error')}</div>;

  const avatarUrl = profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || profile.email)}&background=00E5FF&color=fff&rounded=true&size=120`;

  const myReels = [
    ...myLocations.flatMap(item =>
      (item.media || []).map((mediaItem, idx) => ({
        id: `loc-${item._id}-${idx}`,
        videoUrl: mediaItem.url || mediaItem,
        title: item.title,
        typeLabel: t('profile.tabs.locations'),
        link: `/location/${item._id}`
      }))
    ),
    ...myEquipment.flatMap(item =>
      (item.media || []).map((mediaItem, idx) => ({
        id: `eq-${item._id}-${idx}`,
        videoUrl: mediaItem.url || mediaItem,
        title: item.title,
        typeLabel: t('profile.tabs.equipment'),
        link: `/equipment/${item._id}`
      }))
    ),
    ...myServices.flatMap(item =>
      (item.media || []).map((mediaItem, idx) => ({
        id: `svc-${item._id}-${idx}`,
        videoUrl: mediaItem.url || mediaItem,
        title: item.name,
        typeLabel: t('profile.tabs.services'),
        link: `/services/${item._id}`
      }))
    )
  ];

  const renderItems = () => {
    let items = [];
    if (activeTab === 'locations') items = myLocations;
    else if (activeTab === 'equipment') items = myEquipment;
    else if (activeTab === 'services') items = myServices;

    if (items.length === 0) {
      return <div className="empty-state">{t('profile.emptyListings')}</div>;
    }

    // Tog'ri route uchun: location, equipment, serviceprovider
    const detailPath = activeTab === 'locations' ? 'location' 
                    : activeTab === 'equipment' ? 'equipment' 
                    : 'serviceprovider';

    return items.map(item => {
      const viewsCount = item.views || 0;
      const likesCount = item.likes?.length || 0;
      const commentsCount = item.comments?.length || 0;

      return (
        <div key={item._id} className="olx-item-card">
          <img
            src={item.images?.[0] || '/images/placeholder.jpg'}
            alt={item.title}
            className="olx-item-thumb"
            onClick={() => navigate(`/${detailPath}/${item._id}`)}
          />

          <div className="olx-item-body">
            <span className="olx-item-date">
              {new Date(item.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
            </span>

            <h4 className="olx-item-title" onClick={() => navigate(`/${detailPath}/${item._id}`)}>
              {item.title}
            </h4>

            {(item.price || item.price_range) && (
              <span className="olx-item-price">{item.price || item.price_range} so'm</span>
            )}

            <div className="olx-item-stats">
              <span><MessageCircle size={14} /> {commentsCount}</span>
              <span><Eye size={14} /> {viewsCount}</span>
              <span><Heart size={14} /> {likesCount}</span>
            </div>

            {isOwnProfile && (
              <div className="olx-item-actions">
                <button onClick={() => navigate(`/edit/${detailPath}/${item._id}`)} className="olx-btn-outline">
                  <Edit size={15} /> {t('profile.actions.edit')}
                </button>
                <button onClick={() => handleDeleteItem(detailPath, item._id)} className="olx-btn-danger">
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
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> {t('profile.back')}
      </button>

      <div className="profile-header">
        {isOwnProfile && (
          <button
            className="settings-btn-top"
            onClick={() => setShowSettings(true)}
            title={t('profile.settings.title')}
          >
            <Settings size={22} />
          </button>
        )}

        <div className="avatar-section">
          <img src={avatarPreview || avatarUrl} alt="Avatar" className="profile-avatar" />
          {isOwnProfile && (
            <label className="avatar-upload-label">
              <Camera size={20} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        <div className="profile-info">
          {editMode && isOwnProfile ? (
            <div className="edit-fields">
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Ism sharif" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Telefon" />
              <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder={t('profile.bioPlaceholder')} rows="2" />
            </div>
          ) : (
            <>
              <div className="profile-name-row">
                <h2>{profile.fullName || 'Ism sharif'}</h2>
                {isPremium && (
                  <span className="premium-badge" title={t('profile.premiumBadge')}>
                    <BadgeCheck size={18} fill="#4B9EFF" color="#fff" strokeWidth={1.5} />
                  </span>
                )}
                {(role === 'business' || role === 'company') && (
                  <span className="business-badge"><Briefcase size={14} /> {t('profile.businessBadge')}</span>
                )}
              </div>

              {isOwnProfile && (
                <div className="profile-stats-ig">
                  <button className="ig-stat" onClick={() => setShowSubscribersModal(true)}>
                    <span className="ig-stat-number">{subscribers.length}</span>
                    <span className="ig-stat-label">{t('profile.subscribers')}</span>
                  </button>
                  <button className="ig-stat" onClick={() => setShowFollowingModal(true)}>
                    <span className="ig-stat-number">{following.length}</span>
                    <span className="ig-stat-label">{t('profile.subscriptions')}</span>
                  </button>
                  <button className="ig-stat" onClick={() => setActiveTab('videos')}>
                    <span className="ig-stat-number">{myReels.length}</span>
                    <span className="ig-stat-label">{t('profile.videos')}</span>
                  </button>
                </div>
              )}

              <p className="profile-bio">{profile.bio || (isOwnProfile ? t('profile.bioPlaceholder') : '')}</p>
              <div className="profile-meta">
                <span className="meta-item">{profile.email}</span>
                {profile.phone && (
                  <span className="meta-item"><Phone size={14} /> {profile.phone}</span>
                )}
              </div>
              <div className="profile-role-info">
                <span className="role-text">
                  {role === 'business' || role === 'company' ? t('profile.roleBusiness') : t('profile.roleUser')}
                </span>
               
              </div>
            </>
          )}
        <div className="profile-actions">
  {isOwnProfile ? (
    editMode ? (
      <button onClick={handleSave} className="save-btn">
        <Save size={18} /> {t('profile.save')}
      </button>
    ) : (
      <>
        <button onClick={handleEditToggle} className="edit-profile-btn">
          <Edit size={18} /> {t('profile.edit')}
        </button>

        {isPremium ? (
          <button onClick={handleCancelPremium} className="cancel-premium-btn" disabled={cancelling}>
            <X size={16} /> {cancelling ? t('profile.cancelling') : t('profile.cancelPremium')}
          </button>
        ) : (
          <button className="premium-btn" onClick={() => navigate('/premium')}>
            <Crown size={16} /> {t('profile.becomePremium')}
          </button>
        )}

        {/* 🔥 YANGI TUGMA — Gru gaem */}
        <button
          className="gru-gaem-btn"
          onClick={() => toast.info('🚀 Tez kunda!', { duration: 3000 })}
        >
          Gru game
        </button>
      </>
    )
  ) : (
    <button
      className={`subscribe-btn ${isSubscribedState ? 'subscribed' : ''}`}
      onClick={handleToggleSubscribe}
      disabled={subscribing}
    >
      {isSubscribedState ? (
        <><UserX size={16} /> {t('profile.unsubscribe')}</>
      ) : (
        <><UserPlus size={16} /> {t('profile.subscribe')}</>
      )}
    </button>
  )}
</div>
        </div>
      </div>

      {/* OBUNACHILAR MODAL */}
      {showSubscribersModal && (
        <div className="modal-overlay" onClick={() => setShowSubscribersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Users size={20} /> {t('profile.subscriberModal.title')} ({subscribers.length})</h3>
              <button className="modal-close" onClick={() => setShowSubscribersModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loadingSubscribers ? (
                <div className="modal-loading">{t('profile.subscriberModal.loading')}</div>
              ) : subscribers.length === 0 ? (
                <div className="modal-empty">{t('profile.subscriberModal.empty')}</div>
              ) : (
                <ul className="subscriber-list">
                  {subscribers.map(sub => (
                    <li key={sub._id} className="subscriber-item">
                      <img src={sub.avatar_url || '/images/placeholder.jpg'} alt={sub.fullName} />
                      <div className="sub-info">
                        <span className="sub-name">{sub.fullName}</span>
                        <span className="sub-email">{sub.email}</span>
                      </div>
                      <span className="sub-date">{new Date(sub.subscribedAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OBUNALAR MODAL */}
      {showFollowingModal && (
        <div className="modal-overlay" onClick={() => setShowFollowingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><UserCheck size={20} /> {t('profile.followingModal.title')} ({following.length})</h3>
              <button className="modal-close" onClick={() => setShowFollowingModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loadingFollowing ? (
                <div className="modal-loading">{t('profile.followingModal.loading')}</div>
              ) : following.length === 0 ? (
                <div className="modal-empty">{t('profile.followingModal.empty')}</div>
              ) : (
                <ul className="subscriber-list">
                  {following.map(item => (
                    <li key={item._id} className="subscriber-item">
                      <Link to={`/profile/${item._id}`} className="sub-link">
                        <img src={item.avatar_url || '/images/placeholder.jpg'} alt={item.fullName} />
                        <div className="sub-info">
                          <span className="sub-name">{item.fullName}</span>
                          <span className="sub-email">{item.email}</span>
                        </div>
                      </Link>
                      <button
                        className="unfollow-btn"
                        disabled={unsubscribingId === item._id}
                        onClick={() => handleUnsubscribe(item._id)}
                        title={t('profile.followingModal.unfollow')}
                      >
                        <UserMinus size={16} />
                        {unsubscribingId === item._id ? t('profile.cancelling') : t('profile.followingModal.unfollow')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS DASHBOARD */}
      {(role === 'business' || role === 'company') && isOwnProfile && (
        <div className="business-dashboard">
          <h3><Shield size={18} /> {t('profile.businessDashboard.title')}</h3>
          <div className="stats-grid-mini">
            <div className="stat-mini">
              <span><MapPin size={14} /> {t('profile.businessDashboard.locations')}</span>
              <strong>{stats.locations || 0}</strong>
            </div>
            <div className="stat-mini">
              <span><Wrench size={14} /> {t('profile.businessDashboard.equipment')}</span>
              <strong>{stats.equipment || 0}</strong>
            </div>
            <div className="stat-mini">
              <span><Briefcase size={14} /> {t('profile.businessDashboard.services')}</span>
              <strong>{stats.services || 0}</strong>
            </div>
            <div className="stat-mini">
              <span><Eye size={14} /> {t('profile.businessDashboard.views')}</span>
              <strong>{stats.views || 0}</strong>
            </div>
          </div>
          <Link to="/dashboard" className="dashboard-link">
            <BarChart3 size={16} /> {t('profile.businessDashboard.details')} <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* BusinessSummaryWidget faqat business uchun, SupplierStatsWidget faqat company uchun */}
      {role === 'business' && isOwnProfile && (
        <>
          <BusinessSummaryWidget />
          <Link to="/my-branches" className="bsw-branches-link">
            <MapPin size={15} /> Mening filiallarim
          </Link>
          <Link to="/my-orders" className="bsw-branches-link">
            <Package size={15} /> Buyurtmalarim
          </Link>
        </>
      )}
      {role === 'company' && isOwnProfile && (
        <>
          <SupplierStatsWidget />
          <Link to="/received-orders" className="bsw-branches-link">
            <Truck size={15} /> Kelgan buyurtmalar
          </Link>
        </>
      )}

      {/* TABLAR */}
      <div className="profile-tabs">
        <button className={activeTab === 'locations' ? 'active' : ''} onClick={() => setActiveTab('locations')}>
          <MapPin size={16} /> {t('profile.tabs.locations')}
        </button>
       <button className={activeTab === 'equipment' ? 'active' : ''} onClick={() => setActiveTab('equipment')}>
  <Package size={16} /> {t('profile.tabs.equipment')}
</button>
        <button className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}>
          <Briefcase size={16} /> {t('profile.tabs.services')}
        </button>
        <button className={activeTab === 'videos' ? 'active' : ''} onClick={() => setActiveTab('videos')}>
          <Play size={16} /> {t('profile.tabs.videos')}
        </button>
      </div>

      {activeTab === 'videos' ? (
        <ReelsStrip
          reels={myReels}
          showHeader={false}
          showProfileLink={false}
          emptyText={t('profile.emptyListings')}
        />
      ) : (
        <div className="olx-items-list">
          {renderItems()}
        </div>
      )}

      {/* SETTINGS MODAL */}
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