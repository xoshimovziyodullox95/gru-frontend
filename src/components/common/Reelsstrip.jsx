// src/components/common/ReelsStrip.jsx
/* ============================================================
   REELS STRIP — ShareSheet ulangan
   ============================================================ */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Heart,
  MessageCircle,
  Send,
  Share2,
  ThumbsDown,
} from 'lucide-react';
import '../../styles/reels.css';
import { getImageUrl } from '../utils/imageUrl';
import ShareSheet from './ShareSheet';

import { T } from '../utils/T';
/* ============================================================
   REEL THUMB
   ============================================================ */

function ReelThumb({ reel, onOpen }) {
  const videoRef = useRef(null);

  const handleEnter = () => {
    videoRef.current?.play().catch(() => {});
  };
  const handleLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="reel-card"
      onClick={onOpen}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <video
        ref={videoRef}
        src={getImageUrl(reel.videoUrl)}
        className="reel-video"
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="reel-fade-bottom" />
      <div className="reel-play-icon">
        <Play size={20} fill="#fff" color="#fff" />
      </div>
      <span className="reel-type-badge">{reel.typeLabel}</span>
      <div className="reel-title">{reel.title}</div>

      <div className="reel-owner">
        <img
          src={reel.avatarUrl || '/images/zumo-placeholder.svg'}
          alt={reel.userName}
          className="reel-owner-avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/zumo-placeholder.svg';
          }}
        />
        <span className="reel-owner-name">{reel.userName}</span>
      </div>
    </div>
  );
}

/* ============================================================
   REEL VIEWER
   ============================================================ */

function ReelViewer({
  reels,
  index,
  onClose,
  onNavigateIndex,
  showProfileLink,
  onToggleLike,
  onToggleDislike,
  onAddComment,
  onAddReply,
  onShare,
}) {
  const navigate = useNavigate();
  const reel = reels[index];
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const commentsListRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigateIndex(1);
      if (e.key === 'ArrowLeft') onNavigateIndex(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigateIndex]);

  useEffect(() => {
    setCommentText('');
    setShowComments(false);
    setActiveReplyId(null);
    setReplyText('');
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
    navigate(reel.link);
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
    setShowComments((prev) => !prev);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    onShare?.(reel);
  };

  const submitComment = (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    onAddComment(reel.id, text);
    setCommentText('');
    setShowComments(true);
  };

  const handleReplyClick = (commentId) => {
    setActiveReplyId(activeReplyId === commentId ? null : commentId);
    setReplyText('');
  };

  const submitReply = (commentId) => {
    const text = replyText.trim();
    if (!text) return;
    onAddReply(reel.id, commentId, text);
    setReplyText('');
    setActiveReplyId(null);
  };

  return (
    <div className="reel-modal-overlay" onClick={onClose}>
      <button
        className="reel-modal-close"
        onClick={onClose}
        type="button"
      >
        <X size={22} />
      </button>

      {index > 0 && (
        <button
          className="reel-modal-nav left"
          onClick={(e) => {
            e.stopPropagation();
            onNavigateIndex(-1);
          }}
          type="button"
        >
          <ChevronLeft size={26} />
        </button>
      )}
      {index < reels.length - 1 && (
        <button
          className="reel-modal-nav right"
          onClick={(e) => {
            e.stopPropagation();
            onNavigateIndex(1);
          }}
          type="button"
        >
          <ChevronRight size={26} />
        </button>
      )}

      <div
        className="reel-modal-player"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          key={reel.id}
          src={getImageUrl(reel.videoUrl)}
          className="reel-modal-video"
          autoPlay
          controls
          playsInline
        />
        <div className="reel-modal-fade-top" />
        <div className="reel-modal-fade-bottom" />

        {showProfileLink && (
          <button
            className="reel-modal-user-chip"
            onClick={goProfile}
            type="button"
          >
            <img
              src={reel.avatarUrl}
              alt={reel.userName}
              className="reel-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/zumo-placeholder.svg';
              }}
            />
            <span className="reel-username">{reel.userName}</span>
          </button>
        )}

        {showComments && comments.length > 0 && (
          <div
            className="reel-comments-list"
            ref={commentsListRef}
            onClick={(e) => e.stopPropagation()}
          >
            {comments.map((c) => (
              <div className="reel-comment-item" key={c.id}>
                <img
                  src={c.avatarUrl || '/images/zumo-placeholder.svg'}
                  alt={c.userName}
                  className="reel-comment-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/zumo-placeholder.svg';
                  }}
                />
                <div className="reel-comment-body">
                  <strong>{c.userName}</strong>
                  <span>{c.text}</span>
                  <button
                    type="button"
                    className="reel-comment-reply-link"
                    onClick={() => handleReplyClick(c.id)}
                  >
                    {T('Javob berish')}
                  </button>

                  {(c.replies || []).map((r) => (
                    <div key={r.id} className="reel-reply-item">
                      <img
                        src={r.avatarUrl || '/images/zumo-placeholder.svg'}
                        alt={r.userName}
                        className="reel-reply-avatar"
                      />
                      <div>
                        <strong>{r.userName}</strong>
                        <span>{r.text}</span>
                      </div>
                    </div>
                  ))}

                  {activeReplyId === c.id && (
                    <form
                      className="reel-reply-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitReply(c.id);
                      }}
                    >
                      <input
                        type="text"
                        placeholder={T('Javob yozish...')}
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
              </div>
            ))}
          </div>
        )}

        <form
          className="reel-comment-form"
          onClick={(e) => e.stopPropagation()}
          onSubmit={submitComment}
        >
          <input
            type="text"
            placeholder={T('Komment yozish...')}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onFocus={() => setShowComments(true)}
          />
          <button type="submit" disabled={!commentText.trim()}>
            <Send size={17} color="#fff" />
          </button>
        </form>

        <button
          className="reel-modal-item-link"
          onClick={goItem}
          type="button"
        >
          <span className="reel-type-badge inline">{reel.typeLabel}</span>
          <span className="reel-modal-item-title">{reel.title}</span>
        </button>
      </div>

      <div
        className="reel-actions-right"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="reel-action-btn"
          onClick={handleLikeClick}
          type="button"
        >
          <Heart
            size={26}
            fill={reel.liked ? '#ff3040' : 'none'}
            color={reel.liked ? '#ff3040' : '#fff'}
            strokeWidth={2}
          />
          <span>{reel.likesCount ?? 0}</span>
        </button>

        <button
          className="reel-action-btn"
          onClick={handleDislikeClick}
          type="button"
        >
          <ThumbsDown
            size={24}
            fill={reel.disliked ? '#fff' : 'none'}
            color="#fff"
            strokeWidth={2}
          />
          <span>{T('Dislike')}</span>
        </button>

        <button
          className="reel-action-btn"
          onClick={handleCommentIconClick}
          type="button"
        >
          <MessageCircle size={25} color="#fff" strokeWidth={2} />
          <span>{comments.length}</span>
        </button>

        <button
          className="reel-action-btn"
          onClick={handleShareClick}
          type="button"
        >
          <Share2 size={24} color="#fff" strokeWidth={2} />
          <span>{T('Share')}</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function ReelsStrip({
  reels: initialReels,
  showHeader = true,
  showProfileLink = true,
  emptyText,
  currentUser,
}) {
  const [reels, setReels] = useState(initialReels || []);
  const [activeIndex, setActiveIndex] = useState(null);
  const [shareReelData, setShareReelData] = useState(null);

  useEffect(() => {
    setReels(initialReels || []);
  }, [initialReels]);

  if (!reels || reels.length === 0) {
    return emptyText ? <div className="reels-empty">{emptyText}</div> : null;
  }

  const close = () => setActiveIndex(null);

  const navigateIndex = (delta) => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      const next = prev + delta;
      if (next < 0 || next >= reels.length) return prev;
      return next;
    });
  };

  const toggleLike = (reelId) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id !== reelId) return r;
        const liked = !r.liked;
        const baseCount = r.likesCount ?? 0;
        return {
          ...r,
          liked,
          likesCount: liked ? baseCount + 1 : Math.max(0, baseCount - 1),
          disliked: liked ? false : r.disliked,
        };
      })
    );
  };

  const toggleDislike = (reelId) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id !== reelId) return r;
        const disliked = !r.disliked;
        return {
          ...r,
          disliked,
          liked: disliked ? false : r.liked,
        };
      })
    );
  };

  /* ✅ ShareSheet'ni ochish */
  const openShare = (reel) => {
    setShareReelData(reel);
  };

  const addComment = (reelId, text) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id !== reelId) return r;
        const newComment = {
          id: `c-${Date.now()}`,
          userName:
            currentUser?.fullName || currentUser?.full_name || 'Siz',
          avatarUrl: currentUser?.avatar_url || '/images/zumo-placeholder.svg',
          text,
          replies: [],
        };
        return { ...r, comments: [...(r.comments || []), newComment] };
      })
    );
  };

  const addReply = (reelId, commentId, text) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id !== reelId) return r;
        const newReply = {
          id: `r-${Date.now()}`,
          userName:
            currentUser?.fullName || currentUser?.full_name || 'Siz',
          avatarUrl: currentUser?.avatar_url || '/images/zumo-placeholder.svg',
          text,
        };
        const updatedComments = (r.comments || []).map((c) =>
          c.id === commentId
            ? { ...c, replies: [...(c.replies || []), newReply] }
            : c
        );
        return { ...r, comments: updatedComments };
      })
    );
  };

  return (
    <section className="reels-section">
      {showHeader && (
        <div className="reels-header">
          <h2 className="reels-title-heading">🎬 Videolar</h2>
          <span className="reels-count">{reels.length} ta</span>
        </div>
      )}
      <div className="reels-track">
        {reels.map((reel, idx) => (
          <ReelThumb
            key={reel.id}
            reel={reel}
            onOpen={() => setActiveIndex(idx)}
          />
        ))}
      </div>

      {activeIndex !== null && (
        <ReelViewer
          reels={reels}
          index={activeIndex}
          onClose={close}
          onNavigateIndex={navigateIndex}
          showProfileLink={showProfileLink}
          onToggleLike={toggleLike}
          onToggleDislike={toggleDislike}
          onAddComment={addComment}
          onAddReply={addReply}
          onShare={openShare}
        />
      )}

      {/* ✅ ShareSheet */}
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