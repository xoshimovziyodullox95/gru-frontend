// src/components/common/RatingAndComments.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Send, MessageSquare } from 'lucide-react';

// itemType: 'equipment' | 'service'
// api: { rate: fn(id, value), comment: fn(id, text), reply: fn(id, commentId, text) }
export default function RatingAndComments({ itemId, initialRatings = [], initialComments = [], currentUser, api }) {
  const { t } = useTranslation();
  const [ratings, setRatings] = useState(initialRatings);
  const [comments, setComments] = useState(initialComments);
  const [hoverStar, setHoverStar] = useState(0);
  const [myRating, setMyRating] = useState(
    initialRatings.find(r => r.userId?.toString() === currentUser?.id?.toString())?.value || 0
  );
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const average = ratings.length > 0
    ? Math.round((ratings.reduce((s, r) => s + r.value, 0) / ratings.length) * 10) / 10
    : 0;

  const handleRate = async (value) => {
    if (!currentUser) { alert("Baholash uchun tizimga kiring"); return; }
    try {
      const res = await api.rate(itemId, value);
      setMyRating(value);
      setRatings(prev => {
        const exists = prev.find(r => r.userId?.toString() === currentUser.id?.toString());
        if (exists) return prev.map(r => r.userId?.toString() === currentUser.id?.toString() ? { ...r, value } : r);
        return [...prev, { userId: currentUser.id, value }];
      });
    } catch (err) {
      console.error('Baholashda xatolik:', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (!currentUser) { alert("Komment qoldirish uchun tizimga kiring"); return; }
    setSubmitting(true);
    try {
      const res = await api.comment(itemId, commentText.trim());
      setComments(prev => [...prev, {
        _id: res.data._id || Date.now().toString(),
        userId: { _id: currentUser.id, fullName: currentUser.fullName || currentUser.full_name, avatar_url: currentUser.avatar_url },
        text: commentText.trim(),
        createdAt: new Date(),
        replies: [],
      }]);
      setCommentText('');
    } catch (err) {
      console.error('Komment yuborishda xatolik:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      await api.reply(itemId, commentId, replyText.trim());
      setComments(prev => prev.map(c =>
        c._id === commentId
          ? { ...c, replies: [...(c.replies || []), {
              _id: Date.now().toString(),
              userId: { _id: currentUser.id, fullName: currentUser.fullName || currentUser.full_name, avatar_url: currentUser.avatar_url },
              text: replyText.trim(),
              createdAt: new Date(),
            }] }
          : c
      ));
      setReplyText('');
      setActiveReplyId(null);
    } catch (err) {
      console.error('Javob yuborishda xatolik:', err);
    }
  };

  return (
    <div className="rac-container">
      {/* ===== BAHOLASH ===== */}
      <div className="rac-rating-section">
        <div className="rac-rating-header">
          <h3 className="ModuleHeading"><Star size={18} /> Baholash</h3>
          {ratings.length > 0 && (
            <span className="rac-average">
              <Star size={14} fill="#FFB800" color="#FFB800" /> {average} ({ratings.length})
            </span>
          )}
        </div>
        <div className="rac-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="rac-star-btn"
              onMouseEnter={() => setHoverStar(star)}
              onMouseLeave={() => setHoverStar(0)}
              onClick={() => handleRate(star)}
            >
              <Star
                size={26}
                fill={(hoverStar || myRating) >= star ? '#FFB800' : 'none'}
                color={(hoverStar || myRating) >= star ? '#FFB800' : '#5a6472'}
              />
            </button>
          ))}
        </div>
        {myRating > 0 && <span className="rac-my-rating">Sizning bahoyingiz: {myRating}/5</span>}
      </div>

      {/* ===== KOMMENTLAR ===== */}
      <div className="rac-comments-section">
        <h3 className="ModuleHeading"><MessageSquare size={18} /> Kommentlar ({comments.length})</h3>

        <div className="rac-comment-input-row">
          <input
            type="text"
            placeholder="Fikringizni yozing..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
          />
          <button onClick={handleSubmitComment} disabled={submitting || !commentText.trim()}>
            <Send size={16} />
          </button>
        </div>

        <div className="rac-comments-list">
          {comments.length === 0 ? (
            <p className="rac-empty">Hali kommentlar yo'q. Birinchi bo'lib yozing!</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="rac-comment-item">
                <img
                  src={c.userId?.avatar_url || '/images/placeholder.jpg'}
                  alt=""
                  className="rac-comment-avatar"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.jpg'; }}
                />
                <div className="rac-comment-body">
                  <strong>{c.userId?.fullName || c.userId?.full_name || 'Foydalanuvchi'}</strong>
                  <span>{c.text}</span>
                  <button className="rac-reply-link" onClick={() => setActiveReplyId(activeReplyId === c._id ? null : c._id)}>
                    Javob berish
                  </button>

                  {(c.replies || []).map((r) => (
                    <div key={r._id} className="rac-reply-item">
                      <img src={r.userId?.avatar_url || '/images/placeholder.jpg'} alt="" className="rac-reply-avatar" />
                      <div>
                        <strong>{r.userId?.fullName || r.userId?.full_name || 'Foydalanuvchi'}</strong>
                        <span>{r.text}</span>
                      </div>
                    </div>
                  ))}

                  {activeReplyId === c._id && (
                    <div className="rac-reply-form">
                      <input
                        type="text"
                        placeholder="Javob yozish..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(c._id)}
                        autoFocus
                      />
                      <button onClick={() => handleSubmitReply(c._id)}><Send size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}