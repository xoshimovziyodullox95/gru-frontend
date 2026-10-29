// Bitta sharh: muallif, baho, afzallik/kamchilik/izoh, rasmlar, "Foydali", egasining javobi
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BadgeCheck, ThumbsUp, Trash2, X, ChevronLeft, ChevronRight, CornerDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Stars from './Stars';
import Avatar from '../detail/Avatar';
import { toggleReviewHelpful, deleteReview, replyToReview } from '../services/reviews';
import { getImageUrl } from '../utils/imageUrl';
import { sameId } from '../hooks/useMyMongoId';
import { T } from '../utils/T';

const LOCALES = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

export function PhotoViewer({ photos, index, onClose }) {
  const [current, setCurrent] = useState(index);
  const go = (step) => setCurrent((i) => (i + step + photos.length) % photos.length);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="rv-viewer" onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" className="rv-viewer__close" onClick={onClose} aria-label={T('Yopish')}><X size={22} /></button>
      <img src={getImageUrl(photos[current])} alt="" onClick={(e) => e.stopPropagation()} />
      {photos.length > 1 && (
        <>
          <button type="button" className="rv-viewer__nav rv-viewer__nav--prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label={T('Oldingi')}><ChevronLeft size={26} /></button>
          <button type="button" className="rv-viewer__nav rv-viewer__nav--next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label={T('Keyingi')}><ChevronRight size={26} /></button>
          <span className="rv-viewer__count">{current + 1} / {photos.length}</span>
        </>
      )}
    </div>
  );
}

export default function ReviewCard({ review, myId, isOwner, onDeleted, compact = false }) {
  const { i18n } = useTranslation();
  const [helpful, setHelpful] = useState({ count: review.helpfulCount || 0, mine: review.helpfulByMe });
  const [reply, setReply] = useState(review.reply?.text ? review.reply : null);
  const [replyText, setReplyText] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [expanded, setExpanded] = useState(!compact);

  const author = review.userId || {};
  const name = author.fullName || author.companyName || T('Foydalanuvchi');
  const mine = sameId(myId, author._id);
  const lang = (i18n.language || 'uz').split('-')[0];
  const date = new Date(review.createdAt).toLocaleDateString(LOCALES[lang] || 'uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
  const hasLongText = (review.pros?.length || 0) + (review.cons?.length || 0) + (review.text?.length || 0) > 220;

  const markHelpful = async () => {
    if (!myId) return toast(T('Belgilash uchun hisobingizga kiring'));
    try {
      const { data } = await toggleReviewHelpful(review._id);
      setHelpful({ count: data.helpfulCount, mine: data.helpfulByMe });
    } catch (err) {
      toast.error(err.response?.data?.error || T('Xatolik yuz berdi'));
    }
  };

  const remove = async () => {
    if (!window.confirm(T('Sharhingiz o‘chirilsinmi?'))) return;
    try {
      await deleteReview(review._id);
      onDeleted?.(review._id);
    } catch (err) {
      toast.error(err.response?.data?.error || T('O‘chirib bo‘lmadi'));
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      const { data } = await replyToReview(review._id, replyText.trim());
      setReply(data.reply);
      setReplyOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || T('Javobni saqlab bo‘lmadi'));
    }
  };

  const sections = [
    { key: 'pros', label: T('Afzalliklari'), text: review.pros },
    { key: 'cons', label: T('Kamchiliklari'), text: review.cons },
    { key: 'text', label: T('Izoh'), text: review.text },
  ].filter((s) => s.text);

  return (
    <article className={`rv-card ${compact ? 'rv-card--compact' : ''}`}>
      <header className="rv-card__head">
        <Avatar className="rv-card__avatar" src={author.avatar_url} name={name} />
        <div className="rv-card__who">
          <strong>{name}</strong>
          <span>{date}</span>
        </div>
        {mine && (
          <button type="button" className="rv-icon-btn" onClick={remove} aria-label={T('O‘chirish')}><Trash2 size={16} /></button>
        )}
      </header>

      <div className="rv-card__rating">
        <Stars value={review.rating} size={15} />
        {review.verified && (
          <span className="rv-verified"><BadgeCheck size={14} /> {review.targetType === 'service_provider' ? T('Tasdiqlangan mijoz') : T('Tasdiqlangan xaridor')}</span>
        )}
      </div>

      <div className={`rv-card__body ${!expanded && hasLongText ? 'is-clamped' : ''}`}>
        {sections.map((s) => (
          <p key={s.key} className={`rv-section rv-section--${s.key}`}>
            <b>{s.label}</b>
            <span>{s.text}</span>
          </p>
        ))}
      </div>
      {!expanded && hasLongText && (
        <button type="button" className="rv-more" onClick={() => setExpanded(true)}>{T('Batafsil')}</button>
      )}

      {review.photos?.length > 0 && (
        <div className="rv-card__photos">
          {review.photos.map((src, i) => (
            <button key={src} type="button" onClick={() => setViewer(i)} aria-label={T('Rasmni ochish')}>
              <img src={getImageUrl(src)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {reply && (
        <div className="rv-reply">
          <CornerDownRight size={15} />
          <div>
            <b>{T('Sotuvchi javobi')}</b>
            <p>{reply.text}</p>
          </div>
        </div>
      )}

      <footer className="rv-card__foot">
        {!mine && (
          <button type="button" className={`rv-helpful ${helpful.mine ? 'is-on' : ''}`} onClick={markHelpful}>
            <ThumbsUp size={14} /> {T('Foydali')}{helpful.count > 0 ? ` · ${helpful.count}` : ''}
          </button>
        )}
        {isOwner && !reply && !replyOpen && (
          <button type="button" className="rv-link" onClick={() => setReplyOpen(true)}>{T('Javob yozish')}</button>
        )}
      </footer>

      {replyOpen && (
        <div className="rv-reply-form">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={1000} rows={3} placeholder={T('Xaridorga javobingiz…')} />
          <div>
            <button type="button" className="rv-btn rv-btn--ghost" onClick={() => setReplyOpen(false)}>{T('Bekor qilish')}</button>
            <button type="button" className="rv-btn rv-btn--primary" onClick={sendReply} disabled={!replyText.trim()}>{T('Yuborish')}</button>
          </div>
        </div>
      )}

      {viewer !== null && <PhotoViewer photos={review.photos} index={viewer} onClose={() => setViewer(null)} />}
    </article>
  );
}
