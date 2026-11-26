// Rasm ko'ruvchilarda (e'lon, joy, usta, chat) ikki barmoq bilan kattalashtirish, surish va ikki marta bosish.
// Sahifa zoomi o'chiq (iOS maximum-scale=1) — shuning uchun faqat shu rasmlarga o'zimiz qo'shamiz.
const SELECTOR = '.ImageViewerImg, .tg-lightbox img, .rv-viewer img, .pf-avatar-viewer img';
const MAX = 4;

let el = null;
let scale = 1, x = 0, y = 0;
let startDist = 0, startScale = 1, startX = 0, startY = 0, panX = 0, panY = 0;
let lastTap = 0;

const apply = (anim) => {
  if (!el) return;
  el.style.transition = anim ? 'transform 0.2s ease' : 'none';
  el.style.transform = scale > 1 ? `translate(${x}px, ${y}px) scale(${scale})` : '';
  el.style.touchAction = scale > 1 ? 'none' : '';
};
const reset = (anim) => { scale = 1; x = 0; y = 0; apply(anim); };
const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
const clampPan = () => {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const w = (r.width / scale) * (scale - 1) / 2, h = (r.height / scale) * (scale - 1) / 2;
  x = Math.max(-w, Math.min(w, x)); y = Math.max(-h, Math.min(h, y));
};

function onStart(e) {
  const target = e.target.closest?.(SELECTOR);
  if (!target) return;
  if (el !== target || el.dataset.zsrc !== target.currentSrc) { if (el) reset(false); el = target; el.dataset.zsrc = target.currentSrc; scale = 1; x = 0; y = 0; }
  if (e.touches.length === 2) {
    startDist = dist(e.touches); startScale = scale;
    e.preventDefault(); e.stopPropagation();
  } else if (e.touches.length === 1) {
    const now = Date.now();
    if (now - lastTap < 280) { // ikki marta bosish
      if (scale > 1) reset(true); else { scale = 2.5; x = 0; y = 0; apply(true); }
      lastTap = 0; e.preventDefault(); e.stopPropagation(); return;
    }
    lastTap = now;
    if (scale > 1) { panX = e.touches[0].clientX; panY = e.touches[0].clientY; startX = x; startY = y; e.stopPropagation(); }
  }
}
function onMove(e) {
  if (!el || !e.target.closest?.(SELECTOR)) return;
  if (e.touches.length === 2 && startDist) {
    scale = Math.max(1, Math.min(MAX, startScale * (dist(e.touches) / startDist)));
    clampPan(); apply(false);
    e.preventDefault(); e.stopPropagation();
  } else if (e.touches.length === 1 && scale > 1) {
    x = startX + (e.touches[0].clientX - panX); y = startY + (e.touches[0].clientY - panY);
    clampPan(); apply(false);
    e.preventDefault(); e.stopPropagation(); // kattalashganda surish — rasm almashmasin
  }
}
function onEnd(e) {
  if (e.touches.length < 2) startDist = 0;
  if (scale <= 1.02 && el) reset(true);
}

export function installPinchZoom() {
  if (typeof window === 'undefined' || window.__zumoPinch) return;
  window.__zumoPinch = true;
  document.addEventListener('touchstart', onStart, { capture: true, passive: false });
  document.addEventListener('touchmove', onMove, { capture: true, passive: false });
  document.addEventListener('touchend', onEnd, { capture: true });
  // iOS'ning o'z pinch hodisasi sahifani siljitmasin
  document.addEventListener('gesturestart', (e) => { if (e.target.closest?.(SELECTOR)) e.preventDefault(); }, { passive: false });
  // Rasm almashsa yoki ko'ruvchi yopilsa — zoom tiklanadi
  new MutationObserver(() => { if (el && (!el.isConnected)) { el = null; scale = 1; x = 0; y = 0; } })
    .observe(document.body, { childList: true, subtree: true });
}
