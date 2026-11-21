// Profil rasmini kesish (Instagram kabi): surish, ikki barmoq yoki slayder bilan kattalashtirish.
// Natija — 640x640 JPEG Blob.
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { T } from '../utils/T';

const VIEW = 280;
const OUT = 640;
const MAX_ZOOM = 4;

export default function AvatarCropper({ file, busy = false, onCancel, onDone }) {
  const src = useMemo(() => URL.createObjectURL(file), [file]);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const base = natural ? VIEW / Math.min(natural.w, natural.h) : 1;
  const dw = natural ? natural.w * base * zoom : VIEW;
  const dh = natural ? natural.h * base * zoom : VIEW;

  // Rasm doirani doim to'liq qoplasin — chetlari bo'sh qolmasin
  const clamp = (p, w = dw, h = dh) => {
    const mx = Math.max(0, (w - VIEW) / 2);
    const my = Math.max(0, (h - VIEW) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  };

  const applyZoom = (next) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    setZoom(z);
    if (natural) setPos((p) => clamp({ x: p.x * (z / zoom), y: p.y * (z / zoom) }, natural.w * base * z, natural.h * base * z));
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    gesture.current = pts.length === 2
      ? { type: 'pinch', dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), zoom }
      : { type: 'pan', x: e.clientX, y: e.clientY, pos };
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pinch') {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      applyZoom(g.zoom * (dist / g.dist));
    } else {
      setPos(clamp({ x: g.pos.x + e.clientX - g.x, y: g.pos.y + e.clientY - g.y }));
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    const rest = [...pointers.current.values()];
    gesture.current = rest.length === 1 ? { type: 'pan', x: rest[0].x, y: rest[0].y, pos } : null;
  };

  const save = () => {
    if (!natural || busy) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    const s = OUT / VIEW;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(imgRef.current, (OUT - dw * s) / 2 + pos.x * s, (OUT - dh * s) / 2 + pos.y * s, dw * s, dh * s);
    canvas.toBlob((blob) => blob && onDone(blob), 'image/jpeg', 0.9);
  };

  return (
    <div className="pf-cropper" role="dialog" aria-modal="true" aria-label={T('Rasmni kesish')}>
      <header className="pf-cropper__head">
        <button type="button" onClick={onCancel} disabled={busy} aria-label={T('Bekor qilish')}><X size={22} /></button>
        <strong>{T('Rasmni joylashtiring')}</strong>
        <button type="button" className="is-primary" onClick={save} disabled={!natural || busy} aria-label={T('Saqlash')}>
          {busy ? <Loader2 size={22} className="pf-spin" /> : <Check size={22} />}
        </button>
      </header>

      <div className="pf-cropper__stage">
        <div
          className="pf-cropper__frame"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => applyZoom(zoom - e.deltaY * 0.002)}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              style={{ width: dw, height: dh, transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)` }}
            />
          )}
          <span className="pf-cropper__mask" aria-hidden="true" />
        </div>
        <p className="pf-cropper__hint">{T('Surib joylang, ikki barmoq bilan kattalashtiring')}</p>
      </div>

      <div className="pf-cropper__zoom">
        <ZoomOut size={18} />
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => applyZoom(Number(e.target.value))}
          aria-label={T('Kattalashtirish')}
        />
        <ZoomIn size={18} />
      </div>
    </div>
  );
}
