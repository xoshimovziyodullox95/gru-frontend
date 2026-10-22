/* ============================================================
   RATING MODAL — Usta rasmi + ismi + yulduzcha
   Dublikat toast va modal oldini oladi
   ============================================================ */

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, Star, Send, Loader2, Shield } from 'lucide-react';

import api from '../services/api';
import '../../styles/ratingModal.css';

const LABELS = {
  1: 'Yomon',
  2: 'Qoniqarli emas',
  3: 'O‘rtacha',
  4: 'Yaxshi',
  5: 'Ajoyib!',
};

export default function RatingModal({
  isOpen,
  request,
  onClose,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ✅ Dublikat oldini olish uchun */
  const submittedRef = useRef(false);

  /* ✅ Modal ochilganda holatni tozalash */
  useEffect(() => {
    if (isOpen) {
      submittedRef.current = false;
      setRating(0);
      setHover(0);
      setComment('');
      setSubmitting(false);
    }
  }, [isOpen, request?._id]);

  if (!isOpen || !request) return null;

  const active = hover || rating;

  /* Usta ma'lumotlari */
  const acceptedOffer = (request.offers || []).find(
    (o) => String(o._id) === String(request.acceptedOfferId)
  );

  const provider = acceptedOffer?.provider || {};
  const providerName = provider.name || 'Usta';
  const providerImage = provider.image;
  const providerCompany = provider.company;
  const providerRating = provider.averageRating;
  const providerRatingsCount = provider.ratingsCount;

  const avatarInitial = providerName[0]?.toUpperCase() || 'U';

  /* ============================================================
     SUBMIT
     ============================================================ */

  const handleSubmit = async () => {
    /* ✅ Dublikat guard */
    if (submittedRef.current) return;

    if (!rating) {
      toast.info('Iltimos, yulduzchani tanlang', {
        toastId: `rating-info-${request._id}`,
      });
      return;
    }

    submittedRef.current = true;
    setSubmitting(true);

    try {
      await api.post(`/service-requests/${request._id}/review`, {
        rating,
        comment: comment.trim(),
      });

      /* ✅ toastId — dublikat oldini oladi */
      toast.success('⭐ Rahmat! Bahoyingiz saqlandi', {
        toastId: `review-success-${request._id}`,
      });

      onSubmitted?.();
      setRating(0);
      setComment('');
    } catch (err) {
      /* Xato bo'lsa qayta urinishga ruxsat */
      submittedRef.current = false;

      toast.error(
        err.response?.data?.error || 'Baholashda xatolik',
        { toastId: `review-error-${request._id}` }
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="rm-header">
          <h3>Ish tugatildi!</h3>
          <button
            type="button"
            className="rm-close"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <div className="rm-body">
          {/* Usta kartasi */}
          <div className="rm-provider-card">
            <div className="rm-provider-avatar">
              {providerImage ? (
                <img src={providerImage} alt={providerName} />
              ) : (
                <span>{avatarInitial}</span>
              )}
            </div>

            <div className="rm-provider-info">
              <strong>{providerName}</strong>

              {providerCompany && (
                <span className="rm-provider-company">
                  {providerCompany}
                </span>
              )}

              {providerRatingsCount > 0 ? (
                <span className="rm-provider-rating">
                  <Star size={11} fill="#fbbf24" stroke="#fbbf24" />
                  {providerRating}
                  <em>({providerRatingsCount} ta sharh)</em>
                </span>
              ) : (
                <span className="rm-provider-new">
                  <Shield size={11} />
                  Yangi usta
                </span>
              )}
            </div>
          </div>

          {/* Prompt */}
          <p className="rm-prompt">
            <strong>{providerName}</strong> xizmatini baholang
          </p>

          {/* Stars */}
          <div
            className="rm-stars"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="rm-star"
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                aria-label={`${n} yulduz`}
              >
                <Star
                  size={40}
                  fill={n <= active ? '#fbbf24' : 'transparent'}
                  stroke={n <= active ? '#fbbf24' : '#475569'}
                  strokeWidth={1.8}
                />
              </button>
            ))}
          </div>

          {/* Label */}
          {active > 0 && (
            <p className="rm-label" style={{ color: '#fbbf24' }}>
              {LABELS[active]}
            </p>
          )}

          {/* Comment */}
          <label className="rm-field">
            <span className="rm-field__label">
              Izoh <small>(ixtiyoriy)</small>
            </span>
            <textarea
              className="rm-field__textarea"
              rows={3}
              maxLength={500}
              placeholder="Xizmat haqida fikringizni yozing..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <span className="rm-field__hint">
              {comment.length}/500
            </span>
          </label>
        </div>

        {/* Footer */}
        <footer className="rm-footer">
          <button
            type="button"
            className="rm-btn rm-btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Keyinroq
          </button>
          <button
            type="button"
            className="rm-btn rm-btn--primary"
            onClick={handleSubmit}
            disabled={submitting || !rating}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="rm-spin" />
                Yuborilmoqda...
              </>
            ) : (
              <>
                <Send size={16} />
                Yuborish
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}