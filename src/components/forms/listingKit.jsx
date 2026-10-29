// E'lon formalari uchun umumiy bloklar (tovar, joy): rasm tanlagich, maydon, segment, viloyatlar.
import { useEffect, useRef } from 'react';
import { Camera, X, Star } from 'lucide-react';
import { T } from '../utils/T';
import '../../styles/listingForm.css';

import { MAX_PHOTOS } from './listingConstants';

export function Field({ label, hint, counter, children, error }) {
  return (
    <label className={`lf-field ${error ? 'has-error' : ''}`}>
      <span className="lf-field__label">
        {label}
        {counter && <small>{counter}</small>}
      </span>
      {children}
      {(error || hint) && <span className={error ? 'lf-field__error' : 'lf-field__hint'}>{error || hint}</span>}
    </label>
  );
}

export function Segmented({ value, onChange, options, ariaLabel }) {
  return (
    <div className="lf-seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'is-on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <o.icon size={16} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// photos: [{ file, preview }]. Birinchi rasm — muqova.
export function PhotoPicker({ photos, setPhotos, max = MAX_PHOTOS, error }) {
  const inputRef = useRef(null);

  // Komponent yopilganda vaqtinchalik URL'larni tozalaymiz
  const photosRef = useRef(photos);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const add = (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    const room = max - photos.length;
    const next = files.slice(0, room).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
    }));
    setPhotos([...photos, ...next]);
  };

  const remove = (i) => {
    URL.revokeObjectURL(photos[i].preview);
    setPhotos(photos.filter((_, idx) => idx !== i));
  };

  const makeCover = (i) => {
    if (i === 0) return;
    const next = [...photos];
    const [p] = next.splice(i, 1);
    setPhotos([p, ...next]);
  };

  return (
    <div className={`lf-photos ${error ? 'has-error' : ''}`}>
      <div className="lf-photos__grid">
        {photos.map((p, i) => (
          <div key={p.preview} className={`lf-photo ${i === 0 ? 'is-cover' : ''}`}>
            {p.isVideo ? <video src={p.preview} muted /> : <img src={p.preview} alt="" />}
            {i === 0 ? (
              <span className="lf-photo__badge">{T('Muqova')}</span>
            ) : (
              <button type="button" className="lf-photo__cover" onClick={() => makeCover(i)} aria-label={T('Muqova qilish')}>
                <Star size={13} />
              </button>
            )}
            <button type="button" className="lf-photo__remove" onClick={() => remove(i)} aria-label={T('O‘chirish')}>
              <X size={14} />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button type="button" className="lf-photo lf-photo--add" onClick={() => inputRef.current?.click()}>
            <Camera size={24} />
            <span>{photos.length ? T('Yana qo‘shish') : T('Rasm qo‘shish')}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => { add(e.target.files); e.target.value = ''; }}
      />
      <p className={error ? 'lf-field__error' : 'lf-field__hint'}>
        {error || T('{{count}} tagacha rasm. Birinchisi e’lon muqovasi bo‘ladi.', { count: max })}
      </p>
    </div>
  );
}

export function FormSection({ title, children }) {
  return (
    <section className="lf-section">
      {title && <h2 className="lf-section__title">{title}</h2>}
      {children}
    </section>
  );
}
