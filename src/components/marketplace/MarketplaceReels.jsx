// src/components/marketplace/MarketplaceReels.jsx
/* ============================================================
   MARKETPLACE REELS — ShareSheet integratsiyasi bilan
   ============================================================ */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  Clapperboard,
  Eye,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Reply,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

import { getImageUrl } from '../utils/imageUrl';

import {
  commentItem,
  dislikeItem,
  likeItem,
  replyComment,
  viewItem,
} from '../services/likeComment';

import ShareSheet from '../common/ShareSheet';   // ✅ YANGI

import '../../styles/reels.css';

import { T } from '../utils/T';
/* ============================================================
   CONSTANTS
   ============================================================ */

const AVATAR_PLACEHOLDER = '/images/zumo-placeholder.svg';

const REEL_TYPE_NAMES = {
  post: 'Post',
  location: 'Joy',
  equipment: 'Jihoz',
  service: 'Xizmat',
  product: 'Tovar',
  'youtube-external': 'YouTube',
};

/* ============================================================
   HELPERS
   ============================================================ */

function isTranslationKey(value) {
  if (typeof value !== 'string') return false;
  return /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(value.trim());
}

function getReelTypeLabel(reel, t) {
  const itemType = reel?.itemType || 'video';
  const fallback = REEL_TYPE_NAMES[itemType] || T('Video');
  const currentLabel = reel?.typeLabel;

  if (
    typeof currentLabel === 'string' &&
    currentLabel.trim() &&
    !isTranslationKey(currentLabel)
  ) {
    return currentLabel.trim();
  }

  const translated = t(`marketplaceReels.types.${itemType}`, {
    defaultValue: fallback,
  });

  if (
    typeof translated !== 'string' ||
    !translated.trim() ||
    isTranslationKey(translated)
  ) {
    return fallback;
  }

  return translated.trim();
}

function getResponseData(response) {
  return response?.data || response || {};
}

function getCurrentUserName(user) {
  return (
    user?.fullName ||
    user?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    T('Foydalanuvchi')
  );
}

function getCurrentUserAvatar(user) {
  return (
    user?.avatar_url ||
    user?.avatarUrl ||
    user?.user_metadata?.avatar_url ||
    AVATAR_PLACEHOLDER
  );
}

function handleAvatarError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = AVATAR_PLACEHOLDER;
}

function getCommentId(comment, index) {
  return comment?.id || comment?._id || `comment-${index}`;
}

/* ============================================================
   REEL THUMBNAIL
   ============================================================ */

function ReelThumb({ reel, onOpen, isPriority, t }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const displayType = getReelTypeLabel(reel, t);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '180px', threshold: 0.05 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMediaError(false);
  }, [reel?.id, reel?.videoUrl]);

  const startPreview = () => {
    setIsPreviewing(true);
    if (!reel?.isYoutube && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const stopPreview = () => {
    setIsPreviewing(false);
    if (!reel?.isYoutube && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };

  const showYoutubeThumbnail =
    reel?.isYoutube && reel?.youtubeId && !mediaError;
  const showLocalVideo =
    !reel?.isYoutube && isVisible && reel?.videoUrl && !mediaError;

  return (
    <article
      ref={cardRef}
      className={['reel-card', isPriority ? 'reel-card--priority' : '']
        .filter(Boolean)
        .join(' ')}
      role="button"
      tabIndex={0}
      aria-label={`${displayType}: ${reel?.title || 'Video'}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
    >
      {showYoutubeThumbnail ? (
        <img
          src={`https://i.ytimg.com/vi/${reel.youtubeId}/hqdefault.jpg`}
          className="reel-card__media"
          alt={reel?.title || 'YouTube'}
          loading="lazy"
          onError={() => setMediaError(true)}
        />
      ) : showLocalVideo ? (
        <video
          ref={videoRef}
          // Muqova bo'lmasa — birinchi (ko'pincha qora) kadr emas, 0.5-soniyadagi kadr ko'rinsin
          src={`${getImageUrl(reel.videoUrl)}${reel?.thumbnailUrl ? '' : '#t=0.5'}`}
          poster={
            reel?.thumbnailUrl ? getImageUrl(reel.thumbnailUrl) : undefined
          }
          className="reel-card__media"
          muted
          loop
          playsInline
          preload={isPreviewing ? 'auto' : 'metadata'}
          onError={() => setMediaError(true)}
        />
      ) : (
        <div className="reel-card__media reel-card__placeholder">
          <Clapperboard size={30} strokeWidth={1.7} aria-hidden="true" />
        </div>
      )}

      <div className="reel-card__overlay" aria-hidden="true" />

      <div className="reel-card__badges">
        {isPriority && (
          <span className="reel-priority-badge">
            {t('marketplaceReels.priorityBadge', 'Tavsiya')}
          </span>
        )}
        <span className="reel-type-badge">{displayType}</span>
      </div>

      <span className="reel-card__play" aria-hidden="true">
        <Play size={17} fill="currentColor" />
      </span>

      <div className="reel-card__info">
        {reel?.userName && (
          <div className="reel-card__owner">
            <img
              src={reel.avatarUrl || AVATAR_PLACEHOLDER}
              alt=""
              loading="lazy"
              onError={handleAvatarError}
            />
            <span>{reel.userName}</span>
          </div>
        )}
        <h3>{reel?.title || displayType}</h3>
      </div>
    </article>
  );
}

/* ============================================================
   LOCAL VIDEO PLAYER
   ============================================================ */

function LocalReelPlayer({ reel, slideDirection, isMuted, onToggleMute }) {
  const videoRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setIsPlaying(true);
    setDuration(0);
    setCurrentTime(0);
    setFeedback(null);

    return () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [reel?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  const showFeedback = (type) => {
    setFeedback(type);
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 480);
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          showFeedback('play');
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      showFeedback('pause');
    }
  };

  const handleMetadata = (event) => {
    const video = event.currentTarget;
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
  };

  const handleTimeUpdate = (event) => {
    setCurrentTime(event.currentTarget.currentTime || 0);
  };

  const handleSeek = (event) => {
    event.stopPropagation();
    const video = videoRef.current;
    const value = Number(event.target.value);
    if (!video || !Number.isFinite(value)) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  const handleMuteClick = (event) => {
    event.stopPropagation();
    onToggleMute();
    showFeedback(isMuted ? 'volume' : 'muted');
  };

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      <video
        ref={videoRef}
        key={reel.id}
        src={getImageUrl(reel.videoUrl)}
        poster={reel.thumbnailUrl ? getImageUrl(reel.thumbnailUrl) : TRANSPARENT_POSTER}
        className={`reel-modal-video reel-slide-${slideDirection}`}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="auto"
        controls={false}
        controlsList="nofullscreen nodownload"
        disablePictureInPicture
        onLoadedMetadata={handleMetadata}
        onDurationChange={handleMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlayback}
      />

      <button
        type="button"
        className="reel-player-sound"
        onClick={handleMuteClick}
        aria-label={isMuted ? T('Ovozni yoqish') : "Ovozni o'chirish"}
      >
        {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
      </button>

      <div
        className={['reel-player-feedback', feedback ? 'is-visible' : '']
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        {feedback === 'play' && <Play size={30} fill="currentColor" />}
        {feedback === 'pause' && <Pause size={30} fill="currentColor" />}
        {feedback === 'volume' && <Volume2 size={29} />}
        {feedback === 'muted' && <VolumeX size={29} />}
      </div>

      {!isPlaying && !feedback && (
        <button
          type="button"
          className="reel-player-paused"
          onClick={togglePlayback}
          aria-label={T('Videoni davom ettirish')}
        >
          <Play size={33} fill="currentColor" />
        </button>
      )}

      <div
        className="reel-player-progress"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          aria-label={T('Video davomiyligi')}
          style={{ '--reel-progress': `${progress}%` }}
        />
      </div>
    </>
  );
}

/* ============================================================
   YOUTUBE PLAYER
   ============================================================ */

function YoutubeReelPlayer({ reel, slideDirection }) {
  const source =
    `https://www.youtube.com/embed/${reel.youtubeId}` +
    '?autoplay=1' +
    '&playsinline=1' +
    '&loop=1' +
    `&playlist=${reel.youtubeId}` +
    '&controls=1' +
    '&modestbranding=1' +
    '&rel=0';

  return (
    <iframe
      key={reel.id}
      className={`reel-modal-video reel-slide-${slideDirection}`}
      src={source}
      title={reel.title || 'YouTube'}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
}

/* ============================================================
   REEL VIEWER
   ============================================================ */

// 1x1 shaffof GIF: Android WebView video yuklanguncha kulrang fon va katta "▶" chizmasin
const TRANSPARENT_POSTER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/* Qo'shni va joriy video kadri. Bir xil key (reel.id) bilan qoladi — almashtirilganda
   "keyingi" kadr "joriy" o'ringa o'tadi va video yuklanguncha qora ekran o'rniga ko'rinib turadi */
function ReelPeek({ reel, position }) {
  if (!reel) return null;
  const poster = reel.thumbnailUrl
    ? getImageUrl(reel.thumbnailUrl)
    : reel.isYoutube && reel.youtubeId
      ? `https://i.ytimg.com/vi/${reel.youtubeId}/hqdefault.jpg`
      : null;
  return (
    <div className={`reel-peek reel-peek--${position}`} aria-hidden="true">
      {poster ? (
        <img src={poster} alt="" />
      ) : (
        <video src={`${getImageUrl(reel.videoUrl)}#t=0.5`} muted playsInline preload="metadata" />
      )}
    </div>
  );
}

function ReelViewer({
  reels,
  index,
  onClose,
  onNavigateIndex,
  onToggleLike,
  onToggleDislike,
  onAddComment,
  onAddReply,
  onShare,
  t,
}) {
  const navigate = useNavigate();
  const reel = reels[index];

  const commentsListRef = useRef(null);
  const previousIndexRef = useRef(index);
  const wheelLockedRef = useRef(false);
  const wheelTimerRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchStartTimeRef = useRef(0);
  const dragNavRef = useRef(false);

  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [slideDirection, setSlideDirection] = useState('down');
  // Instagram kabi: video barmoq ortidan suriladi, ostidan keyingisi ko'rinadi
  const [dragY, setDragY] = useState(0);
  const [dragAnimating, setDragAnimating] = useState(false);
  // Ikki marta bosish — like (Instagram kabi, faqat qo'yadi, olmaydi)
  const lastTapRef = useRef(0);
  const [heartBurst, setHeartBurst] = useState(0);
  const [commentSending, setCommentSending] = useState(false);
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem('gru-reels-muted') !== 'false'
  );

  const comments = Array.isArray(reel?.comments) ? reel.comments : [];
  const displayType = getReelTypeLabel(reel, t);

  useEffect(() => {
    if (!reel) return;
    const itemId = reel.originalId || reel.id;
    if (!itemId || !reel.itemType) return;
    viewItem(itemId, reel.itemType).catch(() => {});
  }, [reel?.id, reel?.originalId, reel?.itemType]);

  useEffect(() => {
    if (index !== previousIndexRef.current) {
      // Sudrab almashtirilganda video allaqachon joyida — kirish animatsiyasi kerak emas
      setSlideDirection(dragNavRef.current ? 'none' : index > previousIndexRef.current ? 'down' : 'up');
      dragNavRef.current = false;
      previousIndexRef.current = index;
    }
  }, [index]);

  useEffect(() => {
    setCommentText('');
    setReplyText('');
    setShowComments(false);
    setActiveReplyId(null);
    setCommentSending(false);
  }, [index]);

  useEffect(() => {
    if (showComments && commentsListRef.current) {
      commentsListRef.current.scrollTop =
        commentsListRef.current.scrollHeight;
    }
  }, [comments.length, showComments]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showComments) setShowComments(false);
        else onClose();
      }
      if (!showComments && event.key === 'ArrowDown') onNavigateIndex(1);
      if (!showComments && event.key === 'ArrowUp') onNavigateIndex(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigateIndex, showComments]);

  useEffect(() => {
    return () => {
      if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
    };
  }, []);

  if (!reel) return null;

  const toggleMute = () => {
    setIsMuted((currentValue) => {
      const nextValue = !currentValue;
      localStorage.setItem('gru-reels-muted', String(nextValue));
      return nextValue;
    });
  };

  const shouldIgnoreNavigation = (target) => {
    return Boolean(
      target?.closest?.(
        [
          '.reel-player-progress',
          '.reel-player-sound',
          '.reel-player-paused',
          '.reel-actions',
          '.reel-comments-sheet',
          '.reel-modal-close',
          '.reel-modal-nav',
        ].join(',')
      )
    );
  };

  const handleWheel = (event) => {
    if (
      showComments ||
      wheelLockedRef.current ||
      shouldIgnoreNavigation(event.target) ||
      Math.abs(event.deltaY) < 28
    )
      return;

    wheelLockedRef.current = true;
    onNavigateIndex(event.deltaY > 0 ? 1 : -1);
    wheelTimerRef.current = window.setTimeout(() => {
      wheelLockedRef.current = false;
    }, 500);
  };

  const handleTouchStart = (event) => {
    if (showComments || dragAnimating || shouldIgnoreNavigation(event.target)) {
      touchStartYRef.current = null;
      return;
    }
    touchStartYRef.current = event.touches?.[0]?.clientY ?? null;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchMove = (event) => {
    if (touchStartYRef.current === null) return;
    const y = event.touches?.[0]?.clientY;
    if (typeof y !== 'number') return;
    let delta = y - touchStartYRef.current;
    // Birinchi/oxirgi videoda chetga rezinadek qarshilik
    const atEdge = (delta > 0 && index === 0) || (delta < 0 && index === reels.length - 1);
    if (atEdge) delta *= 0.25;
    setDragY(delta);
  };

  const handleTouchEnd = (event) => {
    if (touchStartYRef.current === null) return;
    const endY = event.changedTouches?.[0]?.clientY;
    const delta = typeof endY === 'number' ? endY - touchStartYRef.current : 0;
    const elapsed = Math.max(1, Date.now() - touchStartTimeRef.current);
    touchStartYRef.current = null;

    const direction = delta < 0 ? 1 : -1;
    const target = index + direction;
    const height = window.innerHeight || 800;
    const flick = Math.abs(delta) > 40 && Math.abs(delta) / elapsed > 0.45;
    const commit = target >= 0 && target < reels.length && (Math.abs(delta) > height * 0.18 || flick);

    setDragAnimating(true);
    if (!commit) {
      setDragY(0);
      window.setTimeout(() => setDragAnimating(false), 260);
      return;
    }
    setDragY(direction > 0 ? -height : height);
    window.setTimeout(() => {
      dragNavRef.current = true;
      onNavigateIndex(direction);
      setDragAnimating(false);
      setDragY(0);
    }, 260);
  };

  const handlePlayerTap = (event) => {
    if (shouldIgnoreNavigation(event.target) || event.target.closest?.('.reel-modal-info')) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      setHeartBurst((n) => n + 1);
      if (!reel.liked) onToggleLike(reel.id);
      return;
    }
    lastTapRef.current = now;
  };

  const goToProfile = (event) => {
    event.stopPropagation();
    if (!reel.userId) return;
    onClose();
    navigate(`/profile/${reel.userId}`);
  };

  const goToItem = (event) => {
    event.stopPropagation();
    if (!reel.link) return;
    onClose();
    if (reel.itemType === 'youtube-external') {
      window.open(reel.link, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(reel.link);
  };

  const toggleComments = (event) => {
    event?.stopPropagation();
    setShowComments((currentValue) => !currentValue);
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const value = commentText.trim();
    if (!value || commentSending) return;
    setCommentSending(true);
    try {
      await onAddComment(reel.id, value);
      setCommentText('');
      setShowComments(true);
    } finally {
      setCommentSending(false);
    }
  };

  const submitReply = async (event, commentId) => {
    event.preventDefault();
    const value = replyText.trim();
    if (!value || commentSending) return;
    setCommentSending(true);
    try {
      await onAddReply(reel.id, commentId, value);
      setReplyText('');
      setActiveReplyId(null);
    } finally {
      setCommentSending(false);
    }
  };

  return (
    <div
      className="reel-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={reel.title || displayType}
      onClick={onClose}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <button
        type="button"
        className="reel-modal-close"
        onClick={onClose}
        aria-label={t('common.close', 'Yopish')}
      >
        <X size={22} />
      </button>

      <div
        className="reel-track"
        style={{
          transform: `translate3d(0, ${dragY}px, 0)`,
          transition: dragAnimating ? 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
      >
      {[[index - 1, 'prev'], [index, 'current'], [index + 1, 'next']].map(([i, position]) =>
        reels[i] ? <ReelPeek key={reels[i].id} reel={reels[i]} position={position} /> : null
      )}
      <div
        className="reel-modal-player"
        onClick={(event) => event.stopPropagation()}
        onPointerUp={handlePlayerTap}
      >
        {heartBurst > 0 && (
          <span key={heartBurst} className="reel-heart-burst" aria-hidden="true">
            <Heart size={110} fill="currentColor" strokeWidth={0} />
          </span>
        )}
        {reel.isYoutube && reel.youtubeId ? (
          <YoutubeReelPlayer reel={reel} slideDirection={slideDirection} />
        ) : (
          <LocalReelPlayer
            reel={reel}
            slideDirection={slideDirection}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        )}

        <div className="reel-modal-fade-top" aria-hidden="true" />
        <div className="reel-modal-fade-bottom" aria-hidden="true" />

        {/* Info */}
        <div className="reel-modal-info">
          <button
            type="button"
            className="reel-modal-user"
            onClick={goToProfile}
            disabled={!reel.userId}
          >
            <img
              src={reel.avatarUrl || AVATAR_PLACEHOLDER}
              alt=""
              onError={handleAvatarError}
            />
            <span>{reel.userName || T('Foydalanuvchi')}</span>
          </button>

          <button
            type="button"
            className="reel-modal-title"
            onClick={goToItem}
            disabled={!reel.link}
          >
            <span className="reel-modal-type">{displayType}</span>
            <span className="reel-modal-title-text">
              {reel.title || displayType}
            </span>
          </button>

          <div className="reel-modal-views">
            <Eye size={14} />
            <span>
              {t('marketplaceReels.views', {
                count: reel.views || 0,
                defaultValue: '{{count}} ko‘rish',
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="reel-actions">
          <button
            type="button"
            className={['reel-action', reel.liked ? 'is-liked' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={(event) => {
              event.stopPropagation();
              onToggleLike(reel.id);
            }}
          >
            <span className="reel-action__icon">
              <ThumbsUp
                size={23}
                fill={reel.liked ? 'currentColor' : 'none'}
              />
            </span>
            <small>{reel.likesCount ?? 0}</small>
          </button>

          <button
            type="button"
            className={['reel-action', reel.disliked ? 'is-disliked' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={(event) => {
              event.stopPropagation();
              onToggleDislike(reel.id);
            }}
          >
            <span className="reel-action__icon">
              <ThumbsDown
                size={23}
                fill={reel.disliked ? 'currentColor' : 'none'}
              />
            </span>
            <small>{t('marketplaceReels.dislike', 'Yoqmadi')}</small>
          </button>

          <button
            type="button"
            className="reel-action"
            onClick={toggleComments}
          >
            <span className="reel-action__icon">
              <MessageCircle size={23} />
            </span>
            <small>{comments.length}</small>
          </button>

          {/* ✅ SHARE — ShareSheet ochadi */}
          <button
            type="button"
            className="reel-action"
            onClick={(event) => {
              event.stopPropagation();
              console.log('🔗 SHARE CLICKED:', reel);
              onShare(reel);
            }}
          >
            <span className="reel-action__icon">
              <Share2 size={22} />
            </span>
            <small>{t('marketplaceReels.share', 'Ulashish')}</small>
          </button>
        </div>

        {/* Comments sheet */}
        <div
          className={['reel-comments-sheet', showComments ? 'is-open' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="reel-comments-handle"
            onClick={toggleComments}
            aria-label={T('Izohlarni yopish')}
          />

          <header className="reel-comments-header">
            <strong>
              {t('marketplaceReels.comments', {
                count: comments.length,
                defaultValue: 'Izohlar ({{count}})',
              })}
            </strong>
            <button
              type="button"
              onClick={toggleComments}
              aria-label={T('Izohlarni yopish')}
            >
              <X size={19} />
            </button>
          </header>

          <div ref={commentsListRef} className="reel-comments-list">
            {comments.length === 0 ? (
              <div className="reel-comments-empty">
                <MessageCircle size={28} />
                <span>
                  {t('marketplaceReels.emptyComments', 'Hozircha izohlar yo‘q')}
                </span>
              </div>
            ) : (
              comments.map((comment, commentIndex) => {
                const commentId = getCommentId(comment, commentIndex);
                return (
                  <div key={commentId} className="reel-comment">
                    <div className="reel-comment__row">
                      <img
                        src={comment.avatarUrl || AVATAR_PLACEHOLDER}
                        alt=""
                        onError={handleAvatarError}
                      />
                      <div className="reel-comment__body">
                        <strong>
                          {comment.userName || T('Foydalanuvchi')}
                        </strong>
                        <p>{comment.text}</p>
                      </div>
                      <button
                        type="button"
                        className="reel-comment__reply"
                        onClick={() => {
                          setActiveReplyId((currentId) =>
                            currentId === commentId ? null : commentId
                          );
                          setReplyText('');
                        }}
                        aria-label={T('Javob berish')}
                      >
                        <Reply size={14} />
                      </button>
                    </div>

                    {(comment.replies || []).map((reply, replyIndex) => (
                      <div
                        key={
                          reply.id ||
                          reply._id ||
                          `reply-${commentId}-${replyIndex}`
                        }
                        className="reel-comment__row reel-comment__row--reply"
                      >
                        <img
                          src={reply.avatarUrl || AVATAR_PLACEHOLDER}
                          alt=""
                          onError={handleAvatarError}
                        />
                        <div className="reel-comment__body">
                          <strong>
                            {reply.userName || T('Foydalanuvchi')}
                          </strong>
                          <p>{reply.text}</p>
                        </div>
                      </div>
                    ))}

                    {activeReplyId === commentId && (
                      <form
                        className="reel-reply-form"
                        onSubmit={(event) => submitReply(event, commentId)}
                      >
                        <input
                          type="text"
                          value={replyText}
                          maxLength={1000}
                          placeholder={t(
                            'marketplaceReels.replyPlaceholder',
                            'Javob yozing...'
                          )}
                          onChange={(event) =>
                            setReplyText(event.target.value)
                          }
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={!replyText.trim() || commentSending}
                          aria-label={T('Javob yuborish')}
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <form className="reel-comment-form" onSubmit={submitComment}>
            <input
              type="text"
              value={commentText}
              maxLength={1000}
              placeholder={t(
                'marketplaceReels.commentPlaceholder',
                'Izoh yozing...'
              )}
              onChange={(event) => setCommentText(event.target.value)}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || commentSending}
              aria-label={T('Izoh yuborish')}
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function MarketplaceReels({
  reels: initialReels = [],
  onReelUpdate,
  currentUser,
  variant = 'row',
  priorityId = null,
}) {
  const { t } = useTranslation();

  const [reels, setReels] = useState(
    Array.isArray(initialReels) ? initialReels : []
  );
  const [activeIndex, setActiveIndex] = useState(null);
  const [shareReelData, setShareReelData] = useState(null);   // ✅ YANGI

  useEffect(() => {
    setReels(Array.isArray(initialReels) ? initialReels : []);
  }, [initialReels]);

  const orderedReels = useMemo(() => {
    if (!priorityId) return reels;

    const priorityReels = reels.filter(
      (reel) =>
        reel.originalId === priorityId || reel.id === priorityId
    );
    const regularReels = reels.filter(
      (reel) =>
        reel.originalId !== priorityId && reel.id !== priorityId
    );

    return [...priorityReels, ...regularReels];
  }, [reels, priorityId]);

  useEffect(() => {
    if (activeIndex === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex !== null && activeIndex >= orderedReels.length) {
      setActiveIndex(null);
    }
  }, [activeIndex, orderedReels.length]);

  const closeViewer = useCallback(() => setActiveIndex(null), []);

  const navigateViewer = useCallback(
    (direction) => {
      setActiveIndex((currentIndex) => {
        if (currentIndex === null) return null;
        const nextIndex = currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= orderedReels.length)
          return currentIndex;
        return nextIndex;
      });
    },
    [orderedReels.length]
  );

  const updateReel = (reelId, updates) => {
    setReels((currentReels) =>
      currentReels.map((reel) =>
        reel.id === reelId ? { ...reel, ...updates } : reel
      )
    );
    onReelUpdate?.(reelId, updates);
  };

  const toggleLike = async (reelId) => {
    const reel = reels.find((item) => item.id === reelId);
    if (!reel) return;
    const itemId = reel.originalId || reel.id;

    try {
      const response = await likeItem(itemId, reel.itemType);
      const data = getResponseData(response);
      const liked =
        typeof data.liked === 'boolean' ? data.liked : !reel.liked;
      const likesCount =
        typeof data.likesCount === 'number'
          ? data.likesCount
          : Math.max(0, (reel.likesCount || 0) + (liked ? 1 : -1));

      updateReel(reelId, {
        liked,
        likesCount,
        disliked:
          typeof data.disliked === 'boolean'
            ? data.disliked
            : liked
            ? false
            : reel.disliked,
      });
    } catch (error) {
      console.error('Like xatosi:', error);
    }
  };

  const toggleDislike = async (reelId) => {
    const reel = reels.find((item) => item.id === reelId);
    if (!reel) return;
    const itemId = reel.originalId || reel.id;

    try {
      const response = await dislikeItem(itemId, reel.itemType);
      const data = getResponseData(response);
      const disliked =
        typeof data.disliked === 'boolean' ? data.disliked : !reel.disliked;
      const likesCount =
        typeof data.likesCount === 'number'
          ? data.likesCount
          : disliked && reel.liked
          ? Math.max(0, (reel.likesCount || 0) - 1)
          : reel.likesCount || 0;

      updateReel(reelId, {
        disliked,
        likesCount,
        liked:
          typeof data.liked === 'boolean'
            ? data.liked
            : disliked
            ? false
            : reel.liked,
      });
    } catch (error) {
      console.error('Dislike xatosi:', error);
    }
  };

  const addComment = async (reelId, text) => {
    const reel = reels.find((item) => item.id === reelId);
    if (!reel) return;
    const itemId = reel.originalId || reel.id;

    try {
      const response = await commentItem(itemId, reel.itemType, text);
      const data = getResponseData(response);

      const newComment = {
        id: data._id || data.id || `comment-${Date.now()}`,
        userId: data.userId,
        userName: getCurrentUserName(currentUser),
        avatarUrl: getCurrentUserAvatar(currentUser),
        text: data.text || text,
        createdAt: data.createdAt || new Date().toISOString(),
        replies: [],
      };

      updateReel(reelId, {
        comments: [...(reel.comments || []), newComment],
      });
    } catch (error) {
      console.error('Comment xatosi:', error);
      throw error;
    }
  };

  const addReply = async (reelId, commentId, text) => {
    const reel = reels.find((item) => item.id === reelId);
    if (!reel) return;
    const itemId = reel.originalId || reel.id;

    try {
      const response = await replyComment(
        itemId,
        reel.itemType,
        commentId,
        text
      );
      const data = getResponseData(response);

      const newReply = {
        id: data._id || data.id || `reply-${Date.now()}`,
        userId: data.userId,
        userName: getCurrentUserName(currentUser),
        avatarUrl: getCurrentUserAvatar(currentUser),
        text: data.text || text,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      const updatedComments = (reel.comments || []).map((comment) => {
        const currentCommentId = comment.id || comment._id;
        if (String(currentCommentId) !== String(commentId)) return comment;
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      });

      updateReel(reelId, { comments: updatedComments });
    } catch (error) {
      console.error('Reply xatosi:', error);
      throw error;
    }
  };

  /* ✅ YANGI: ShareSheet'ni ochish */
  const shareReel = (reel) => {
    console.log('🔗 shareReel chaqirildi:', reel);
    setShareReelData(reel);
  };

  if (!orderedReels.length) return null;

  const isHomeVariant = variant === 'grid2';

  return (
    <section
      className={[
        'reels-section',
        isHomeVariant ? 'reels-section--home' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="reels-header">
        <h2>
          <Clapperboard size={22} aria-hidden="true" />
          <span>{t('marketplaceReels.title', 'Videolar')}</span>
        </h2>
      </header>

      <div className="reels-track">
        {orderedReels.map((reel, index) => (
          <ReelThumb
            key={reel.id || `${reel.itemType}-${index}`}
            reel={reel}
            t={t}
            isPriority={
              priorityId !== null &&
              (reel.originalId === priorityId || reel.id === priorityId)
            }
            onOpen={() => setActiveIndex(index)}
          />
        ))}
      </div>

      {activeIndex !== null && (
        <ReelViewer
          reels={orderedReels}
          index={activeIndex}
          t={t}
          onClose={closeViewer}
          onNavigateIndex={navigateViewer}
          onToggleLike={toggleLike}
          onToggleDislike={toggleDislike}
          onAddComment={addComment}
          onAddReply={addReply}
          onShare={shareReel}
        />
      )}

      {/* ✅ ShareSheet render */}
      {shareReelData && (
        <ShareSheet
          isOpen={true}
          onClose={() => setShareReelData(null)}
          reel={shareReelData}
        />
      )}
    </section>
  );
}