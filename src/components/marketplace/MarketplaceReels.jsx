import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/imageUrl';
import {
  X, ChevronUp, ChevronDown, Play,
  ThumbsUp, ThumbsDown, MessageCircle,
  Send, Share2, Reply, Smile,
  Eye, Clapperboard
} from 'lucide-react';
import { likeItem, dislikeItem, commentItem, viewItem, replyComment } from '../services/likeComment';
import '../../styles/reels.css';

// ============================================================
// 1. REEL THUMB
// ============================================================
function ReelThumb({ reel, onOpen, isPriority, t }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Faqat ekranda ko'ringanda video yuklanadi
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleEnter = () => {
    setIsHovering(true);
    if (!reel.isYoutube) videoRef.current?.play().catch(() => {});
  };
  const handleLeave = () => {
    setIsHovering(false);
    if (!reel.isYoutube && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const showVideo = isVisible && !reel.isYoutube;

  return (
    <div
      ref={containerRef}
      className={`reel-card ${isPriority ? 'reel-card-priority' : ''}`}
      onClick={onOpen}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {reel.isYoutube ? (
        <img
          src={`https://i.ytimg.com/vi/${reel.youtubeId}/hqdefault.jpg`}
          className="reel-video"
          alt={reel.title}
          loading="lazy"
        />
      ) : showVideo ? (
       <video
  ref={videoRef}
  src={getImageUrl(reel.videoUrl)}
  className="reel-video"
          muted
          loop
          playsInline
          preload={isHovering ? 'auto' : 'none'}
        />
      ) : (
        // Ekranda ko'rinmayotganda faqat statik rasm/placeholder
        <div className="reel-video reel-video-placeholder" />
      )}
      <div className="reel-fade-bottom" />
      <div className="reel-play-icon"><Play size={20} fill="#fff" color="#fff" /></div>
      <span className="reel-type-badge">{reel.typeLabel}</span>
      {isPriority && <span className="reel-priority-badge">{t('marketplaceReels.priorityBadge')}</span>}
      <div className="reel-title">{reel.title}</div>
    </div>
  );
}

// ============================================================
// 2. REEL VIEWER
// ============================================================
function ReelViewer({
  reels, index, onClose, onNavigateIndex,
  onToggleLike, onToggleDislike, onAddComment, onShare, onAddReply, currentUser,
  t
}) {
  const navigate = useNavigate();
  const reel = reels[index];
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const commentsListRef = useRef(null);
  const prevIndexRef = useRef(index);
  const [slideDir, setSlideDir] = useState('down');
  

  useEffect(() => {
    if (reel) {
      viewItem(reel.id, reel.itemType).catch(() => {});
    }
  }, [reel?.id]);

  useEffect(() => {
    if (index !== prevIndexRef.current) {
      setSlideDir(index > prevIndexRef.current ? 'down' : 'up');
      prevIndexRef.current = index;
    }
  }, [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') onNavigateIndex(1);
      if (e.key === 'ArrowUp') onNavigateIndex(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigateIndex]);

  useEffect(() => {
    setCommentText('');
    setReplyText('');
    setShowComments(false);
    setActiveReplyId(null);
  }, [index]);

  useEffect(() => {
    if (commentsListRef.current) {
      commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
    }
  }, [reel?.comments?.length, showComments]);

  if (!reel) return null;

  const comments = reel.comments || [];

  const goProfile = (e) => {
    e.stopPropagation();
    onClose();
    if (reel.userId) navigate(`/profile/${reel.userId}`);
  };

  const goItem = (e) => {
    e.stopPropagation();
    onClose();
    if (reel.itemType === 'youtube-external') {
      window.open(reel.link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(reel.link);
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    onToggleLike(reel.id);
  };

  const handleDislikeClick = (e) => {
    e.stopPropagation();
    onToggleDislike(reel.id);
  };

  const handleCommentIconClick = (e) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    onShare?.(reel);
  };

  const handleReplyClick = (commentId) => {
    setActiveReplyId(activeReplyId === commentId ? null : commentId);
    setReplyText('');
  };

  const wheelLockRef = useRef(false);
  const handleWheel = (e) => {
    if (showComments) return;
    if (wheelLockRef.current) return;
    if (Math.abs(e.deltaY) < 24) return;
    wheelLockRef.current = true;
    onNavigateIndex(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => { wheelLockRef.current = false; }, 450);
  };

  const touchStartYRef = useRef(null);
  const handleTouchStart = (e) => {
    if (showComments) return;
    touchStartYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (showComments) return;
    if (touchStartYRef.current === null) return;
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    touchStartYRef.current = null;
    if (Math.abs(deltaY) < 50) return;
    onNavigateIndex(deltaY > 0 ? 1 : -1);
  };

  const submitComment = (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    onAddComment(reel.id, text);
    setCommentText('');
    setShowComments(true);
  };

  const submitReply = (commentId) => {
    const text = replyText.trim();
    if (!text) return;
    onAddReply(reel.id, commentId, text);
    setReplyText('');
    setActiveReplyId(null);
  };

  return (
    <div
      className="reel-modal-overlay"
      onClick={onClose}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button className="reel-modal-close" onClick={onClose} type="button">
        <X size={24} />
      </button>

      {index > 0 && (
        <button className="reel-modal-nav up" onClick={(e) => { e.stopPropagation(); onNavigateIndex(-1); }} type="button">
          <ChevronUp size={28} />
        </button>
      )}
      {index < reels.length - 1 && (
        <button className="reel-modal-nav down" onClick={(e) => { e.stopPropagation(); onNavigateIndex(1); }} type="button">
          <ChevronDown size={28} />
        </button>
      )}

      <div className="reel-modal-player" onClick={(e) => e.stopPropagation()}>
        {reel.isYoutube ? (
          <iframe
            key={reel.id}
            className={`reel-modal-video reel-slide-${slideDir}`}
src={`https://www.youtube.com/embed/${reel.youtubeId}?autoplay=1&playsinline=1&loop=1&playlist=${reel.youtubeId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0&color=white&autohide=1`}            title={reel.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ border: 0, width: '100%', height: '100%' }}
          />
        ) : (
<video
  key={reel.id}
  src={getImageUrl(reel.videoUrl)}
  className={`reel-modal-video reel-slide-${slideDir}`}
            autoPlay
            controls
            controlsList="nofullscreen nodownload"
            disablePictureInPicture
            playsInline
          />
        )}

        <div className="reel-modal-fade-top" />
        <div className="reel-modal-fade-bottom" />

        <div className="reel-bottom-info">
          <div className="reel-user-info" onClick={goProfile}>
            <img src={reel.avatarUrl} alt={reel.userName} className="reel-avatar" />
            <span className="reel-username">{reel.userName}</span>
          </div>
          <div className="reel-title" onClick={goItem}>
            <span className="reel-type-label">{reel.typeLabel}</span>
            <span className="reel-title-text">{reel.title}</span>
          </div>
          <div className="reel-views">
            <Eye size={16} color="#fff" style={{ marginRight: '6px' }} />
            <span>{t('marketplaceReels.views', { count: reel.views || 0 })}</span>
          </div>
        </div>

        <div className="reel-actions-right">
          <button className="reel-action-btn" onClick={handleLikeClick}>
            <ThumbsUp size={28} fill={reel.liked ? '#0095f6' : 'none'} color={reel.liked ? '#0095f6' : '#fff'} />
            <span>{reel.likesCount ?? 0}</span>
          </button>

          <button className="reel-action-btn" onClick={handleDislikeClick}>
            <ThumbsDown size={28} fill={reel.disliked ? '#ff3040' : 'none'} color={reel.disliked ? '#ff3040' : '#fff'} />
            <span>{t('marketplaceReels.dislike')}</span>
          </button>

          <button className="reel-action-btn" onClick={handleCommentIconClick}>
            <MessageCircle size={28} color="#fff" />
            <span>{comments.length}</span>
          </button>

          <button className="reel-action-btn" onClick={handleShareClick}>
            <Share2 size={24} color="#fff" />
            <span>{t('marketplaceReels.share')}</span>
          </button>
        </div>

        <div className={`reel-comments-sheet ${showComments ? 'open' : ''}`}>
          <div className="reel-comments-sheet-handle" onClick={handleCommentIconClick} />

          <div className="reel-comments-sheet-header">
            <span>{t('marketplaceReels.comments', { count: comments.length })}</span>
            <button type="button" className="reel-comments-sheet-close" onClick={handleCommentIconClick}>
              <X size={20} />
            </button>
          </div>

          <div className="reel-comments-sheet-list" ref={commentsListRef}>
            {comments.length === 0 ? (
              <div className="reel-comments-empty">{t('marketplaceReels.emptyComments')}</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="reel-comment-wrapper">
                  <div className="reel-comment-row">
                    <img src={c.avatarUrl || '/images/placeholder.jpg'} alt="" className="reel-comment-avatar" />
                    <div className="reel-comment-body">
                      <span className="reel-comment-author">{c.userName}</span>
                      <span className="reel-comment-text">{c.text}</span>
                    </div>
                    <button className="reel-comment-reply-btn" onClick={() => handleReplyClick(c.id)}>
                      <Reply size={14} />
                    </button>
                  </div>

                  {(c.replies || []).map((r) => (
                    <div key={r.id} className="reel-comment-row reply">
                      <img src={r.avatarUrl || '/images/placeholder.jpg'} alt="" className="reel-comment-avatar small" />
                      <div className="reel-comment-body">
                        <span className="reel-comment-author">{r.userName}</span>
                        <span className="reel-comment-text">{r.text}</span>
                      </div>
                    </div>
                  ))}

                  {activeReplyId === c.id && (
                    <form className="reel-reply-form" onSubmit={(e) => { e.preventDefault(); submitReply(c.id); }}>
                      <input
                        type="text"
                        placeholder={t('marketplaceReels.replyPlaceholder')}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" disabled={!replyText.trim()}>
                        <Send size={14} color="#fff" />
                      </button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>

          <form className="reel-comments-sheet-form" onSubmit={submitComment}>
            <button type="button" className="reel-emoji-btn">
              <Smile size={20} color="#fff" />
            </button>
            <input
              type="text"
              placeholder={t('marketplaceReels.commentPlaceholder')}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              autoFocus={showComments}
            />
            <button type="submit" disabled={!commentText.trim()}>
              <Send size={17} color="#fff" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 3. ASOSIY KOMPONENT
// ============================================================
export default function MarketplaceReels({
  reels: initialReels,
  onReelUpdate,
  currentUser,
  variant = 'row',
  priorityId = null,
}) {
  const { t } = useTranslation();
  const [reels, setReels] = useState(initialReels || []);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    setReels(initialReels || []);
  }, [initialReels]);

  const orderedReels = priorityId
    ? [
        ...reels.filter(r => r.originalId === priorityId || r.id === priorityId),
        ...reels.filter(r => r.originalId !== priorityId && r.id !== priorityId),
      ]
    : reels;

  if (!orderedReels || orderedReels.length === 0) return null;

  const close = () => setActiveIndex(null);
  const navigateIndex = (delta) => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      const next = prev + delta;
      if (next < 0 || next >= orderedReels.length) return prev;
      return next;
    });
  };

  const toggleLike = async (reelId) => {
    const reel = reels.find((r) => r.id === reelId);
    if (!reel) return;
    const itemId = reel.originalId || reel.id;
    try {
      const res = await likeItem(itemId, reel.itemType);
      const { liked, likesCount } = res.data;
      setReels((prev) =>
        prev.map((r) => {
          if (r.id !== reelId) return r;
          return { ...r, liked, likesCount };
        })
      );
      if (onReelUpdate) {
        onReelUpdate(reelId, { liked, likesCount });
      }
    } catch (err) {
      console.error('Like xatosi:', err);
    }
  };

  const toggleDislike = async (reelId) => {
    const reel = reels.find((r) => r.id === reelId);
    if (!reel) return;
    const itemId = reel.originalId || reel.id;
    try {
      const res = await dislikeItem(itemId, reel.itemType);
      const { disliked } = res.data;
      setReels((prev) =>
        prev.map((r) => {
          if (r.id !== reelId) return r;
          const wasLiked = r.liked;
          return {
            ...r,
            disliked,
            liked: disliked ? false : r.liked,
            likesCount: disliked && wasLiked ? Math.max(0, (r.likesCount || 0) - 1) : r.likesCount,
          };
        })
      );
      if (onReelUpdate) {
        onReelUpdate(reelId, {
          disliked,
          liked: disliked ? false : reel.liked,
          likesCount: disliked && reel.liked ? Math.max(0, (reel.likesCount || 0) - 1) : reel.likesCount,
        });
      }
    } catch (err) {
      console.error('Dislike xatosi:', err);
    }
  };

  const addComment = async (reelId, text) => {
    const reel = reels.find((r) => r.id === reelId);
    if (!reel) return;
    const itemId = reel.originalId || reel.id;
    try {
      const res = await commentItem(itemId, reel.itemType, text);
      const newComment = {
        id: res.data._id || `c-${Date.now()}`,
        userId: res.data.userId,
        userName: currentUser?.fullName || currentUser?.full_name || 'Foydalanuvchi',
        text: res.data.text,
        createdAt: res.data.createdAt || new Date(),
        replies: [],
        avatarUrl: currentUser?.avatar_url || '/images/placeholder.jpg'
      };
      let updatedComments;
      setReels((prev) =>
        prev.map((r) => {
          if (r.id !== reelId) return r;
          updatedComments = [...(r.comments || []), newComment];
          return { ...r, comments: updatedComments };
        })
      );
      if (onReelUpdate) {
        onReelUpdate(reelId, { comments: updatedComments });
      }
    } catch (err) {
      console.error('Comment xatosi:', err);
    }
  };

  const addReply = async (reelId, commentId, text) => {
    const reel = reels.find((r) => r.id === reelId);
    if (!reel) return;
    const itemId = reel.originalId || reel.id;
    try {
      const res = await replyComment(itemId, reel.itemType, commentId, text);
      const newReply = {
        id: res.data._id || `r-${Date.now()}`,
        userId: res.data.userId,
        userName: currentUser?.fullName || currentUser?.full_name || 'Foydalanuvchi',
        text: res.data.text,
        createdAt: res.data.createdAt || new Date(),
        avatarUrl: currentUser?.avatar_url || '/images/placeholder.jpg'
      };
      let updatedComments;
      setReels((prev) =>
        prev.map((r) => {
          if (r.id !== reelId) return r;
          updatedComments = (r.comments || []).map((c) => {
            if (c.id === commentId) {
              return { ...c, replies: [...(c.replies || []), newReply] };
            }
            return c;
          });
          return { ...r, comments: updatedComments };
        })
      );
      if (onReelUpdate) {
        onReelUpdate(reelId, { comments: updatedComments });
      }
    } catch (err) {
      console.error('Reply xatosi:', err);
    }
  };

  const handleShare = (reel) => {
    const url = reel.itemType === 'youtube-external'
      ? reel.link
      : window.location.origin + (reel.link || '');
    if (navigator.share) {
      navigator.share({ title: reel.title, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  const trackClassName = `reels-track ${variant === 'grid2' ? 'reels-track-grid2' : ''}`;

  return (
    <section className={`reels-section ${variant === 'grid2' ? 'reels-section-grid2' : ''}`}>
      <div className="reels-header">
        <h2 className="reels-title-heading">
          <Clapperboard size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {t('marketplaceReels.title')}
        </h2>
        <span className="reels-count">{t('marketplaceReels.count', { count: orderedReels.length })}</span>
      </div>
      <div className={trackClassName}>
        {orderedReels.map((reel, idx) => (
          <ReelThumb
            key={reel.id}
            reel={reel}
            isPriority={priorityId != null && (reel.originalId === priorityId || reel.id === priorityId)}
            onOpen={() => setActiveIndex(idx)}
            t={t}
          />
        ))}
      </div>

      {activeIndex !== null && (
        <ReelViewer
          reels={orderedReels}
          index={activeIndex}
          onClose={close}
          onNavigateIndex={navigateIndex}
          onToggleLike={toggleLike}
          onToggleDislike={toggleDislike}
          onAddComment={addComment}
          onShare={handleShare}
          onAddReply={addReply}
          currentUser={currentUser}
          t={t}
        />
      )}
    </section>
  );
}