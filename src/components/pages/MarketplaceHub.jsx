// src/components/pages/MarketplaceHub.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Package, Briefcase, Landmark } from 'lucide-react';
import MarketplaceReels from '../marketplace/MarketplaceReels';
import { useAuth } from '../context/AuthContext';
import { getPosts } from '../services/videos';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';
import '../../styles/marketplaceHub.css';

// ============================================================
// Reels yig'ish funksiyalari (to'g'ri comments formatida)
// ============================================================
function buildReelsFrom(items, { typeLabelKey, link, fallbackAvatarBg, itemType }, currentUser, t) {
  if (!Array.isArray(items)) return [];
  const typeLabel = t(typeLabelKey);
  return items.flatMap(item => {
    const mediaArray = [...(item.media || []), ...(item.images || [])];
    const videos = mediaArray.filter(url =>
      /\.(mp4|webm|mov|avi|m3u8|ts|mkv)$/i.test(url) ||
      url.includes('/video/') ||
      url.includes('video')
    );
    if (!videos.length) return [];

    const ownerObj = typeof item.userId === 'object' && item.userId !== null ? item.userId : null;
    const userName = ownerObj?.fullName || ownerObj?.full_name || ownerObj?.email || 'Foydalanuvchi';
    const avatarUrl = ownerObj?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${fallbackAvatarBg}&color=fff&rounded=true&size=60`;

    return videos.map((videoUrl) => ({
      id: item._id,
      videoUrl,
      title: item.title || item.name,
      typeLabel,
      link: link(item),
      userId: ownerObj?._id,
      userName,
      avatarUrl,
      itemType,
      liked: item.likes?.includes(currentUser?.id) || false,
      likesCount: item.likes?.length || 0,
      comments: (item.comments || []).map(c => ({
        id: c._id,
        userName: c.userId?.fullName || c.userId?.full_name || 'Foydalanuvchi',
        avatarUrl: c.userId?.avatar_url || '/images/placeholder.jpg',
        text: c.text,
        replies: (c.replies || []).map(r => ({
          id: r._id,
          userName: r.userId?.fullName || r.userId?.full_name || 'Foydalanuvchi',
          avatarUrl: r.userId?.avatar_url || '/images/placeholder.jpg',
          text: r.text,
        })),
      })),
    }));
  });
}

function buildPostReels(posts, currentUser, t) {
  return (posts || [])
    .filter(post => post.videoUrl)
    .map(post => {
      const owner = post.userId;
      return {
        id: post._id,
        videoUrl: post.videoUrl,
        title: post.title,
        typeLabel: t('marketplace.reels.post'),
        link: `/posts/${post._id}`,
        userId: owner?._id,
        userName: owner?.full_name || owner?.fullName || 'Foydalanuvchi',
        avatarUrl: owner?.avatar_url || '/images/placeholder.jpg',
        itemType: 'post',
        liked: post.likes?.includes(currentUser?.id) || false,
        likesCount: post.likes?.length || 0,
        comments: (post.comments || []).map(c => ({
          id: c._id,
          userName: c.userId?.fullName || c.userId?.full_name || 'Foydalanuvchi',
          avatarUrl: c.userId?.avatar_url || '/images/placeholder.jpg',
          text: c.text,
          replies: (c.replies || []).map(r => ({
            id: r._id,
            userName: r.userId?.fullName || r.userId?.full_name || 'Foydalanuvchi',
            avatarUrl: r.userId?.avatar_url || '/images/placeholder.jpg',
            text: r.text,
          })),
        })),
      };
    });
}

export default function MarketplaceHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== REELS MA'LUMOTLARINI YUKLASH =====
  useEffect(() => {
    const fetchReels = async () => {
      try {
        const [locRes, eqRes, servRes, postRes] = await Promise.all([
          getLocations({ limit: 50 }),
          getEquipment({ limit: 50 }),
          getServiceProviders({ limit: 50 }),
          getPosts(),
        ]);

        const allReels = [
          ...buildReelsFrom(locRes.data, {
            typeLabelKey: 'marketplace.reels.location',
            link: (item) => `/location/${item._id}`,
            fallbackAvatarBg: '00E5FF',
            itemType: 'location'
          }, user, t),
          ...buildReelsFrom(eqRes.data, {
            typeLabelKey: 'marketplace.reels.equipment',
            link: (item) => `/equipment/${item._id}`,
            fallbackAvatarBg: 'F59E0B',
            itemType: 'equipment'
          }, user, t),
          ...buildReelsFrom(servRes.data, {
            typeLabelKey: 'marketplace.reels.service',
            link: (item) => `/services/${item.service_category}`,
            fallbackAvatarBg: '8B5CF6',
            itemType: 'service'
          }, user, t),
          ...buildPostReels(postRes.data, user, t),
        ];

        setReels(allReels);
      } catch (err) {
        console.error('Reels yuklanmadi:', err);
        setReels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, [user, t]);

  // ===== DEMO REELS (haqiqiy ma'lumot bo'lmasa) =====
  const DEMO_REELS = [
    {
      id: 'demo1',
      videoUrl: '/videos/hero-background.mp4',
      title: t('marketplaceHub.demoTitle', 'Demo video'),
      typeLabel: t('marketplaceHub.demoType', 'Video'),
      link: '/marketplace/products',
      userId: 'admin',
      userName: t('marketplaceHub.demoUser', 'Admin'),
      avatarUrl: '/images/avatar.jpg',
      likesCount: 10,
      liked: false,
      disliked: false,
      comments: [],
      views: 25,
      itemType: 'video',
    },
  ];

  const displayReels = reels.length > 0 ? reels : DEMO_REELS;

  if (loading) {
    return <div className="mph-loading">{t('marketplaceHub.loading')}</div>;
  }

  return (
    <div className="mph-page">
      <h1 className="mph-title">{t('marketplaceHub.title')}</h1>

      {/* 4 ta asosiy karta */}
      <div className="mph-main-grid">
        <button className="mph-main-card" onClick={() => navigate('/marketplace/locations')}>
          <MapPin size={32} />
          <span>{t('marketplaceHub.locations')}</span>
        </button>
        <button className="mph-main-card" onClick={() => navigate('/marketplace/products')}>
          <Package size={32} />
          <span>{t('marketplaceHub.products')}</span>
        </button>
        <button className="mph-main-card" onClick={() => navigate('/marketplace/services')}>
          <Briefcase size={32} />
          <span>{t('marketplaceHub.services')}</span>
        </button>
        <button className="mph-main-card" onClick={() => navigate('/marketplace/bank')}>
          <Landmark size={32} />
          <span>{t('marketplaceHub.bank')}</span>
        </button>
      </div>

      {/* ===== REELS BO'LIMI ===== */}
      <div className="mph-reels-section">
        <MarketplaceReels
          reels={displayReels}
          currentUser={user}
          variant="grid2"
          onReelUpdate={(reelId, updates) => {
            setReels(prev => prev.map(r =>
              r.id === reelId ? { ...r, ...updates } : r
            ));
          }}
        />
      </div>
    </div>
  );
}