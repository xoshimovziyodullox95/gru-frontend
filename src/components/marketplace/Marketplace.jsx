import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import { getServiceProviders } from '../services/serviceProviders';
import api from '../services/api';
import {
  MapPin, Ruler, Tag, Store,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import UniversalCard from '../pages/UniversalCard';
import MarketplaceReels from './MarketplaceReels';
import '../../styles/marketplace.css';
import ServiceProviderCard from '../marketplace/ServiceProviderCard';
import { formatPrice } from '../utils/formatPrice';

// ============================================================
// Location / Equipment / Service dan reels yig'ish
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
      comments: item.comments || []
    }));
  });
}

// ============================================================
// Foydalanuvchi o'zi yuklagan videolar (Post modeli)
// ============================================================
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
        comments: post.comments || []
      };
    });
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Marketplace({ initialLimit = 15 }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [allItems, setAllItems] = useState([]);
  const [reels, setReels] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleReelUpdate = (reelId, updates) => {
    setReels(prevReels =>
      prevReels.map(reel => (reel.id === reelId ? { ...reel, ...updates } : reel))
    );
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [locRes, eqRes, servRes, postRes] = await Promise.all([
          getLocations({ limit: 100 }),
          getEquipment({ limit: 100 }),
          getServiceProviders({ limit: 100 }),
          api.get('/posts'),
        ]);

        const locations = locRes.data.map(item => ({
          id: item._id,
          type: 'location',
          title: item.title,
          description: item.description || 'Joy haqida maʼlumot',
          price: item.price_range || item.price_per_month || 'Narxi mavjud emas',
          image: item.images?.[0] || '/images/placeholder.jpg',
          link: `/location/${item._id}`,
          createdAt: item.createdAt,
          meta: [
            { icon: MapPin, text: item.address || 'Manzil mavjud emas' },
            ...(item.sqm ? [{ icon: Ruler, text: `${item.sqm} m²` }] : []),
          ],
        }));

        const equipment = eqRes.data.map(item => ({
          id: item._id,
          type: 'equipment',
          title: item.title,
          description: item.description || 'Texnika haqida maʼlumot',
          price: formatPrice(item.price, item.currency) || 'Narxi mavjud emas',
          image: item.images?.[0] || '/images/placeholder-equipment.jpg',
          link: `/equipment/${item._id}`,
          createdAt: item.createdAt,
          meta: [],
          maxQuantity: typeof item.stockQuantity === 'number' ? item.stockQuantity : undefined,
        }));

        const services = servRes.data.map(item => ({
          id: item._id,
          type: 'service',
          title: item.name,
          company: item.company,
          description: item.description || 'Xizmat haqida maʼlumot',
          price: item.price_range || 'Narxi mavjud emas',
          image: item.image || '/images/service-providers/default.jpg',
          link: `/service-provider/${item._id}`,
          createdAt: item.createdAt,
          isTop: item.is_top,
          isVerified: item.is_verified,
          rating: item.rating,
          meta: item.speciality ? [{ icon: Tag, text: item.speciality }] : [],
        }));

        const all = [...locations, ...equipment, ...services];
        const shuffled = all.sort(() => Math.random() - 0.5);
        setAllItems(shuffled);

        const userReels = [
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

        setReels(userReels);
      } catch (err) {
        console.error('Marketplace yuklash xatosi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user, t]);

  const displayedItems = showAll ? allItems : allItems.slice(0, initialLimit);

  if (loading) return <div className="marketplace-loading">{t('marketplace.loading')}</div>;
  if (allItems.length === 0) return <div className="marketplace-empty">{t('marketplace.empty')}</div>;

  return (
    <section className="marketplace-section">
      <div className="marketplace-header">
        <div className="marketplace-header-left">
          <Store size={22} className="marketplace-header-icon" />
          <h2 className="marketplace-title">{t('marketplace.title')}</h2>
        </div>
      </div>
      <div className="uc-grid">
        {displayedItems.map(item => {
          if (item.type === 'service') {
            return (
              <ServiceProviderCard
                key={`service-${item.id}`}
                id={item.id}
                name={item.title}
                company={item.company}
                image={item.image}
                price_range={item.price}
                description={item.description}
              />
            );
          }
          return (
            <UniversalCard
              key={`${item.type}-${item.id}`}
              id={item.id}
              type={item.type}
              title={item.title}
              image={item.image}
              price={item.price}
              link={item.link}
              isTop={item.isTop}
              isVerified={item.isVerified}
              maxQuantity={item.maxQuantity}
            />
          );
        })}
      </div>
      {allItems.length > initialLimit && (
        <div className="marketplace-all-btn-wrap">
          <button className="marketplace-all-btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? (
              <><ChevronUp size={18} /> {t('marketplace.showLess')}</>
            ) : (
              <><ChevronDown size={18} /> {t('marketplace.showAll')}</>
            )}
          </button>
        </div>
      )}
      <MarketplaceReels
        reels={reels}
        onReelUpdate={handleReelUpdate}
        currentUser={user}
      />
    </section>
  );
}