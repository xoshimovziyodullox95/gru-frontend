// Bosh sahifa va chat uchun umumiy: e'lon/postlardan reels pleyeri uchun obyekt yasash
import { T } from './T';

export const REEL_SOURCES = [
  {
    key: 'locations',
    itemType: 'location',
    labelKey: 'marketplace.reels.location',
    labelFallback: 'Joy',
    getLink: (id) => `/location/${id}`,
    avatarColor: '00C8F8',
  },
  {
    key: 'equipment',
    itemType: 'equipment',
    labelKey: 'marketplace.reels.equipment',
    labelFallback: 'Jihoz',
    getLink: (id) => `/equipment/${id}`,
    avatarColor: 'F59E0B',
  },
  {
    key: 'services',
    itemType: 'service',
    labelKey: 'marketplace.reels.service',
    labelFallback: 'Xizmat',
    getLink: (id) => `/service-provider/${id}`,
    avatarColor: '008FC7',
  },
  {
    key: 'posts',
    itemType: 'post',
    labelKey: 'marketplace.reels.post',
    labelFallback: 'Post',
    getLink: (id) => `/posts/${id}`,
    avatarColor: '00C8F8',
  },
];

function isTranslationKey(value) {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(value.trim())
  );
}

function getTranslatedLabel(t, key, fallback) {
  const translated = t(key, { defaultValue: fallback });

  if (
    typeof translated !== 'string' ||
    !translated.trim() ||
    isTranslationKey(translated)
  ) {
    return fallback;
  }

  return translated;
}

function isVideoUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;

  const value = url.toLowerCase();

  return (
    /\.(mp4|webm|mov|avi|m3u8|mkv)(\?.*)?$/.test(value) ||
    value.includes('/video/upload/')
  );
}

function getOwnerName(owner) {
  return (
    owner?.fullName ||
    owner?.full_name ||
    owner?.name ||
    owner?.email ||
    T('Foydalanuvchi')
  );
}

function getAvatar(owner, name, color = '00C8F8') {
  return (
    owner?.avatar_url ||
    owner?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=${color}&color=fff&rounded=true&size=60`
  );
}

function formatComments(comments) {
  if (!Array.isArray(comments)) return [];

  const mapOne = (entry, fallbackId) => {
    const name = getOwnerName(entry?.userId);

    return {
      id: entry?._id || entry?.id || fallbackId,
      userName: name,
      avatarUrl:
        entry?.userId?.avatar_url ||
        entry?.userId?.avatarUrl ||
        '/images/placeholder.jpg',
      text: entry?.text || '',
    };
  };

  return comments.map((comment, i) => ({
    ...mapOne(comment, `comment-${i}`),
    replies: Array.isArray(comment?.replies)
      ? comment.replies.map((reply, j) => mapOne(reply, `reply-${i}-${j}`))
      : [],
  }));
}

/* ============================================================
   BUILDERS
   ============================================================ */

export function buildReels(items, source, currentUserId, t) {
  if (!Array.isArray(items)) return [];

  const typeLabel = getTranslatedLabel(
    t,
    source.labelKey,
    source.labelFallback
  );

  return items.flatMap((item) => {
    const itemId = item?._id || item?.id;
    if (!itemId) return [];

    const videos = [
      ...new Set(
        [
          ...(Array.isArray(item.media) ? item.media : []),
          ...(Array.isArray(item.images) ? item.images : []),
          item.videoUrl,
        ].filter(isVideoUrl)
      ),
    ];

    if (!videos.length) return [];

    const owner =
      item.userId && typeof item.userId === 'object' ? item.userId : null;

    const userName = getOwnerName(owner);
    const avatarUrl = getAvatar(owner, userName, source.avatarColor);

    const likes = Array.isArray(item.likes) ? item.likes : [];
    const dislikes = Array.isArray(item.dislikes) ? item.dislikes : [];

    return videos.map((videoUrl, index) => ({
      id: `${source.itemType}-${itemId}-${index}`,
      originalId: itemId,
      videoUrl,
      thumbnailUrl:
        item.thumbnailUrl || item.thumbnail || item.coverImage || null,

      title: item.title || item.name || typeLabel,
      typeLabel,
      link: source.getLink(itemId),

      userId: owner?._id || owner?.id,
      userName,
      avatarUrl,
      itemType: source.itemType,

      liked: Boolean(currentUserId) && likes.map(String).includes(String(currentUserId)),
      disliked: Boolean(currentUserId) && dislikes.map(String).includes(String(currentUserId)),
      likesCount: likes.length || item.likesCount || 0,
      views: item.viewsCount || item.views || 0,

      comments: formatComments(item.comments),
    }));
  });
}

