// Sharh yozish oynasi (pastdan chiqadi): baho, afzalliklar, kamchiliklar, izoh, 5 tagacha rasm
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, ImagePlus, Loader2 } from 'lucide-react';

import Stars from './Stars';
import { createReview, compressImage } from '../services/reviews';
import { T } from '../utils/T';

const MAX_PHOTOS = 5;
const RATING_LABELS = ['', 'Juda yomon', 'Yomon', 'O‘rtacha', 'Yaxshi', 'A’lo'];

export default function ReviewForm({ type, id, title, onClose, onCreated }) {
  const [rating, setRating] = useState(0);
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]); // { file, url }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [busy, onClose]);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photos.length);
    e.target.value = '';
    const ready = await Promise.all(files.map(compressImage));
    setPhotos((prev) => [...prev, ...ready.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const removePhoto = (url) => setPhotos((prev) => prev.filter((p) => p.url !== url));

  const submit = async () => {
    if (!rating) return toast.error(T('Bahoni tanlang'));
    setBusy(true);
    try {
      const form = new FormData();
      form.append('rating', String(rating));
      form.append('pros', pros);
      form.append('cons', cons);
      form.append('text', text);
      photos.forEach((p) => form.append('photos', p.file));
      const { data } = await createReview(type, id, form);
      toast.success(T('Rahmat! Sharhingiz qo‘shildi'));
      onCreated?.(data.review);
    } catch (err) {
      toast.error(err.response?.data?.error || T('Sharhni saqlab bo‘lmadi'));
      setBusy(false);
    }
  };

  return (
    <div className="rv-sheet" onClick={() => !busy && onClose()}>
      <div className="rv-sheet__panel" role="dialog" aria-modal="true" aria-label={T('Sharh yozish')} onClick={(e) => e.stopPropagation()}>
        <div className="rv-sheet__head">
          <div>
            <h3>{T('Sharh yozish')}</h3>
            {title && <p>{title}</p>}
          </div>
          <button type="button" className="rv-icon-btn" onClick={onClose} disabled={busy} aria-label={T('Yopish')}><X size={20} /></button>
        </div>

        <div className="rv-sheet__body">
          <div className="rv-form-rating">
            <Stars value={rating} size={34} onChange={setRating} />
            <span>{rating ? T(RATING_LABELS[rating]) : T('Umumiy bahoingiz')}</span>
          </div>

          <label className="rv-field">
            <span>{T('Afzalliklari')}</span>
            <textarea value={pros} onChange={(e) => setPros(e.target.value)} maxLength={1000} rows={2} placeholder={T('Nimasi yoqdi?')} />
          </label>
          <label className="rv-field">
            <span>{T('Kamchiliklari')}</span>
            <textarea value={cons} onChange={(e) => setCons(e.target.value)} maxLength={1000} rows={2} placeholder={T('Nimasi yoqmadi?')} />
          </label>
          <label className="rv-field">
            <span>{T('Izoh')}</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={3} placeholder={T('Boshqalarga foydali bo‘ladigan tafsilotlar')} />
          </label>

          <div className="rv-field">
            <span>{T('Rasmlar')} <small>{photos.length}/{MAX_PHOTOS}</small></span>
            <div className="rv-photo-pick">
              {photos.map((p) => (
                <div key={p.url} className="rv-photo-pick__item">
                  <img src={p.url} alt="" />
                  <button type="button" onClick={() => removePhoto(p.url)} aria-label={T('Rasmni olib tashlash')}><X size={14} /></button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="rv-photo-pick__add">
                  <ImagePlus size={22} />
                  <input type="file" accept="image/*" multiple onChange={addPhotos} hidden />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="rv-sheet__foot">
          <button type="button" className="rv-btn rv-btn--primary rv-btn--block" onClick={submit} disabled={busy || !rating}>
            {busy && <Loader2 size={16} className="rv-spin" />} {T('Sharhni yuborish')}
          </button>
        </div>
      </div>
    </div>
  );
}
