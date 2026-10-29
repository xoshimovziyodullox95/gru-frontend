import { safeGoBack } from '../utils/navigation.js';
// src/components/pages/PostDetailPage.jsx
/* ============================================================
   POST DETAIL PAGE — bitta postni ko'rish
   ============================================================ */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, ThumbsDown, MessageCircle, Share2,
  Play, Pause, Volume2, VolumeX, Send, Reply, X,
  Loader2, Eye, ExternalLink, MoreVertical,
} from 'lucide-react';
import { getPosts } from '../services/videos';
import {
  likeItem, dislikeItem, commentItem, replyComment, viewItem,
} from '../services/likeComment';
import { useAuth } from '../context/AuthContext';
import ShareSheet from '../common/ShareSheet';
import toast from 'react-hot-toast';
import '../../styles/post-detail.css';

import { T } from '../utils/T';
const AVATAR_PLACEHOLDER = '/images/zumo-placeholder.svg';
import { BACKEND_ORIGIN } from '../utils/imageUrl';
// Backend manzili .env dan (ilova va serverda ham ishlaydi)
const MEDIA_BASE = BACKEND_ORIGIN;

/* ============================================================
   YORDAMCHI
   ============================================================ */

function toIdStr(v) {
  if (!v) return '';
  if (typeof v === 'object') return String(v._id || v.id || v);
  return String(v);
}

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${MEDIA_BASE}${url}`;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ============================================================
   VIDEO PLAYER
   ============================================================ */

function VideoPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="pd-player">
      <video
        ref={videoRef}
        src={getImageUrl(src)}
        poster={poster ? getImageUrl(poster) : undefined}
        className="pd-player__video"
        autoPlay
        muted
        loop
        playsInline
        onClick={togglePlay}
      />

      <button
        type="button"
        className="pd-player__mute"
        onClick={toggleMute}
        aria-label={isMuted ? T('Ovozni yoqish') : "Ovozni o'chirish"}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {!isPlaying && (
        <button
          type="button"
          className="pd-player__play"
          onClick={togglePlay}
          aria-label={T('Davom ettirish')}
        >
          <Play size={48} fill="currentColor" />
        </button>
      )}
    </div>
  );
}

/* ============================================================
   COMMENT ITEM
   ============================================================ */

function CommentItem({ comment, onReply }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');

  const submitReply = (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text) return;
    onReply(comment._id || comment.id, text);
    setReplyText('');
    setShowReplyForm(false);
  };

  return (
    <div className="pd-comment">
      <img
        src={comment.userId?.avatar_url || AVATAR_PLACEHOLDER}
        alt=""
        className="pd-comment__avatar"
        onError={(e) => {
          e.currentTarget.src = AVATAR_PLACEHOLDER;
        }}
      />

      <div className="pd-comment__body">
        <div className="pd-comment__head">
          <strong>
            {comment.userId?.fullName ||
              comment.userId?.email ||
              T('Foydalanuvchi')}
          </strong>
          <span className="pd-comment__time">{formatDate(comment.createdAt)}</span>
        </div>

        <p className="pd-comment__text">{comment.text}</p>

        <button
          type="button"
          className="pd-comment__reply-btn"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <Reply size={12} /> {T('Javob berish')}
        </button>

        {/* Replies */}
        {(comment.replies || []).map((reply) => (
          <div key={reply._id || reply.id} className="pd-reply">
            <img
              src={reply.userId?.avatar_url || AVATAR_PLACEHOLDER}
              alt=""
              className="pd-reply__avatar"
              onError={(e) => {
                e.currentTarget.src = AVATAR_PLACEHOLDER;
              }}
            />
            <div>
              <strong>
                {reply.userId?.fullName ||
                  reply.userId?.email ||
                  T('Foydalanuvchi')}
              </strong>
              <p>{reply.text}</p>
            </div>
          </div>
        ))}

        {showReplyForm && (
          <form className="pd-reply-form" onSubmit={submitReply}>
            <input
              type="text"
              placeholder={T('Javob yozing...')}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={!replyText.trim()}>
              <Send size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ASOSIY SAHIFA
   ============================================================ */

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getPosts()
      .then((res) => {
        const all = res.data || [];
        const found = all.find(
          (p) => toIdStr(p._id || p.id) === String(id)
        );

        if (!found) {
          setError(T('Post topilmadi'));
          setLoading(false);
          return;
        }

        setPost(found);
        setLikesCount(
          Array.isArray(found.likes) ? found.likes.length : 0
        );
        setComments(found.comments || []);

        // Ko'rishlar sonini +1
        viewItem(found._id, 'post').catch(() => {});
        setLoading(false);
      })
      .catch((err) => {
        console.error('Post xato:', err);
        setError(T('Postni yuklab bo\'lmadi'));
        setLoading(false);
      });
  }, [id]);

  /* ---------------- LIKE ---------------- */

  const toggleLike = async () => {
    if (!post || !user) {
      toast.error(T('Avval tizimga kiring'));
      return;
    }

    const myId = toIdStr(user.id || user._id);
    const likesArr = Array.isArray(post.likes) ? post.likes : [];
    const wasLiked = likesArr.some((x) => toIdStr(x) === myId);

    try {
      const res = await likeItem(post._id, 'post');
      const data = res?.data || res;

      setLiked(typeof data.liked === 'boolean' ? data.liked : !wasLiked);
      setLikesCount(
        typeof data.likesCount === 'number'
          ? data.likesCount
          : wasLiked
          ? Math.max(0, likesCount - 1)
          : likesCount + 1
      );

      if (typeof data.disliked === 'boolean') {
        setDisliked(data.disliked);
      } else if (!wasLiked) {
        setDisliked(false);
      }
    } catch (err) {
      console.error('Like xato:', err);
      toast.error(T('Xatolik'));
    }
  };

  /* ---------------- DISLIKE ---------------- */

  const toggleDislike = async () => {
    if (!post || !user) {
      toast.error(T('Avval tizimga kiring'));
      return;
    }

    try {
      const res = await dislikeItem(post._id, 'post');
      const data = res?.data || res;

      setDisliked(typeof data.disliked === 'boolean' ? data.disliked : !disliked);
      if (typeof data.liked === 'boolean') setLiked(data.liked);
      else if (!disliked) setLiked(false);

      if (typeof data.likesCount === 'number') {
        setLikesCount(data.likesCount);
      } else if (disliked && liked) {
        setLikesCount(Math.max(0, likesCount - 1));
      }
    } catch (err) {
      console.error('Dislike xato:', err);
      toast.error(T('Xatolik'));
    }
  };

  /* ---------------- COMMENT ---------------- */

  const submitComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || commentSending || !post) return;

    setCommentSending(true);
    try {
      const res = await commentItem(post._id, 'post', text);
      const data = res?.data || res;

      const newComment = {
        _id: data._id || `c-${Date.now()}`,
        userId: {
          _id: user?.id || user?._id,
          fullName: user?.fullName || user?.user_metadata?.full_name || 'Siz',
          email: user?.email,
          avatar_url:
            user?.avatar_url || user?.user_metadata?.avatar_url || null,
        },
        text: data.text || text,
        createdAt: data.createdAt || new Date().toISOString(),
        replies: [],
      };

      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      toast.success(T('Izoh qo\'shildi'));
    } catch (err) {
      console.error('Comment xato:', err);
      toast.error(T('Izoh qo\'shilmadi'));
    } finally {
      setCommentSending(false);
    }
  };

  const submitReply = async (commentId, text) => {
    if (!post) return;
    try {
      const res = await replyComment(post._id, 'post', commentId, text);
      const data = res?.data || res;

      const newReply = {
        _id: data._id || `r-${Date.now()}`,
        userId: {
          _id: user?.id || user?._id,
          fullName: user?.fullName || user?.user_metadata?.full_name || 'Siz',
          email: user?.email,
          avatar_url:
            user?.avatar_url || user?.user_metadata?.avatar_url || null,
        },
        text: data.text || text,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      setComments((prev) =>
        prev.map((c) =>
          String(c._id || c.id) === String(commentId)
            ? { ...c, replies: [...(c.replies || []), newReply] }
            : c
        )
      );
    } catch (err) {
      console.error('Reply xato:', err);
      toast.error(T('Javob yuborilmadi'));
    }
  };

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return (
      <div className="pd-loading">
        <Loader2 size={28} className="spin" />
        <span>{T('Yuklanmoqda...')}</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="pd-error">
        <h2>{error || T('Post topilmadi')}</h2>
        <button onClick={() => safeGoBack(navigate)} className="pd-btn">
          <ArrowLeft size={18} /> {T('Orqaga')}
        </button>
      </div>
    );
  }

  const owner = post.userId && typeof post.userId === 'object' ? post.userId : {};
  const ownerName =
    owner.fullName || owner.full_name || owner.email || T('Foydalanuvchi');
  const ownerAvatar = owner.avatar_url || owner.avatarUrl || null;
  const ownerId = owner._id || owner.id || post.userId;

  const videoSrc = post.videoUrl || post.media?.[0] || '';
  const thumbnail = post.thumbnailUrl || post.thumbnail || post.coverImage;

  const shareReel = {
    id: post._id,
    originalId: post._id,
    title: post.title || T('Video'),
    link: `/posts/${post._id}`,
    itemType: 'post',
    thumbnailUrl: thumbnail,
    videoUrl: videoSrc,
    userId: ownerId,
    userName: ownerName,
    avatarUrl: ownerAvatar,
  };

  return (
    <div className="pd-page">
      {/* Header */}
      <header className="pd-header">
        <button
          type="button"
          className="pd-header__back"
          onClick={() => safeGoBack(navigate)}
          aria-label={T('Orqaga')}
        >
          <ArrowLeft size={20} />
        </button>

        <button
          type="button"
          className="pd-header__author"
          onClick={() => {
            if (ownerId) navigate(`/profile/${ownerId}`);
          }}
        >
          <img
            src={ownerAvatar || AVATAR_PLACEHOLDER}
            alt={ownerName}
            onError={(e) => {
              e.currentTarget.src = AVATAR_PLACEHOLDER;
            }}
          />
          <div>
            <strong>{ownerName}</strong>
            <small>{formatDate(post.createdAt)}</small>
          </div>
        </button>

        <button type="button" className="pd-header__more" aria-label={T('Ko\'proq')}>
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Video */}
      <div className="pd-video-wrap">
        {videoSrc ? (
          <VideoPlayer src={videoSrc} poster={thumbnail} />
        ) : (
          <div className="pd-video-placeholder">
            <Play size={48} />
          </div>
        )}
      </div>

      {/* Title & actions */}
      <div className="pd-info">
        <h1 className="pd-info__title">{post.title || T('Video')}</h1>

        {post.description && (
          <p className="pd-info__desc">{post.description}</p>
        )}

        <div className="pd-info__meta">
          <span>
            <Eye size={14} /> {post.views || 0} {T('ko\'rish')}
          </span>
          <span>•</span>
          <span>{comments.length} {T('izoh')}</span>
        </div>
      </div>

      {/* Actions bar */}
      <div className="pd-actions">
        <button
          type="button"
          className={`pd-action ${liked ? 'is-liked' : ''}`}
          onClick={toggleLike}
        >
          <Heart
            size={24}
            fill={liked ? '#ff3040' : 'none'}
            color={liked ? '#ff3040' : 'currentColor'}
          />
          <span>{likesCount}</span>
        </button>

        <button
          type="button"
          className={`pd-action ${disliked ? 'is-disliked' : ''}`}
          onClick={toggleDislike}
        >
          <ThumbsDown size={24} fill={disliked ? 'currentColor' : 'none'} />
          <span>{T('Yoqmadi')}</span>
        </button>

        <button type="button" className="pd-action">
          <MessageCircle size={24} />
          <span>{comments.length}</span>
        </button>

        <button
          type="button"
          className="pd-action"
          onClick={() => setShareOpen(true)}
        >
          <Share2 size={24} />
          <span>{T('Ulashish')}</span>
        </button>
      </div>

      {/* Comments */}
      <section className="pd-comments">
        <h2 className="pd-comments__title">
          Izohlar ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <div className="pd-comments__empty">
            <MessageCircle size={32} />
            <span>{T('Hozircha izohlar yo\'q')}</span>
          </div>
        ) : (
          <div className="pd-comments__list">
            {comments.map((c) => (
              <CommentItem
                key={c._id || c.id}
                comment={c}
                onReply={submitReply}
              />
            ))}
          </div>
        )}
      </section>

      {/* Comment input - fixed bottom */}
      <form className="pd-comment-form" onSubmit={submitComment}>
        <input
          type="text"
          placeholder={T('Izoh yozing...')}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!commentText.trim() || commentSending}
        >
          {commentSending ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      {/* Share modal */}
      {shareOpen && (
        <ShareSheet
          isOpen={true}
          onClose={() => setShareOpen(false)}
          reel={shareReel}
        />
      )}
    </div>
  );
}