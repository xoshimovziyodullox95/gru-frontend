// Detail sahifalar uchun rasm galereyasi: telefonda to'liq kenglikda barmoq bilan suriladi,
// ustida "orqaga" / "ulashish" tugmalari, pastida hisoblagich. Bosilsa to'liq ekranda ochiladi.
import { useRef, useState } from 'react';
import { ArrowLeft, Share2, Expand } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { T } from '../utils/T';

const PLACEHOLDER = '/images/zumo-placeholder.svg';

export default function DetailGallery({ images = [], title = '', onBack, onShare, onOpen, contain = false }) {
  const list = images.length ? images : [PLACEHOLDER];
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i) => {
    const el = trackRef.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className={`dp-gallery ${contain ? 'dp-gallery--contain' : ''} ${images.length ? '' : 'dp-gallery--empty'}`}>
      <div className="dp-gallery__track" ref={trackRef} onScroll={onScroll}>
        {list.map((src, i) => (
          <button key={`${src}-${i}`} type="button" className="dp-gallery__slide" onClick={() => onOpen?.(i)} aria-label={T('Rasmni kattalashtirish')}>
            <img
              src={getImageUrl(src) || PLACEHOLDER}
              alt={i === 0 ? title : ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
            />
          </button>
        ))}
      </div>

      <div className="dp-gallery__top">
        {onBack && (
          <button type="button" className="dp-round-btn" onClick={onBack} aria-label={T('Orqaga')}><ArrowLeft size={20} /></button>
        )}
        <span />
        {onShare && (
          <button type="button" className="dp-round-btn" onClick={onShare} aria-label={T('Ulashish')}><Share2 size={18} /></button>
        )}
      </div>

      {list.length > 1 && (
        <>
          <span className="dp-gallery__count">{index + 1} / {list.length}</span>
          <div className="dp-gallery__dots">
            {list.map((src, i) => (
              <button key={`${src}-dot-${i}`} type="button" className={i === index ? 'is-on' : ''} onClick={() => goTo(i)} aria-label={T('{{n}}-rasm', { n: i + 1 })} />
            ))}
          </div>
        </>
      )}
      {onOpen && <span className="dp-gallery__expand" aria-hidden="true"><Expand size={15} /></span>}

      {list.length > 1 && (
        <div className="dp-gallery__thumbs">
          {list.map((src, i) => (
            <button key={`${src}-th-${i}`} type="button" className={i === index ? 'is-on' : ''} onClick={() => goTo(i)}>
              <img src={getImageUrl(src) || PLACEHOLDER} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
