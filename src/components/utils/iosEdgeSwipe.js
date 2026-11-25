// iPhone: ekranning chap chetidan o'ngga surib "orqaga" (iOS foydalanuvchilari odatlangan imo-ishora).
// Barmoq ortidan dumaloq strelka chiqadi; yetarli surilsa — onBack() (ochiq oynani yopadi yoki oldingi sahifa).
const EDGE_PX = 24;        // shu chetdan boshlangan surish hisoblanadi
const TRIGGER_PX = 90;     // shuncha surilsa — orqaga
const MAX_PULL = 130;

export function setupIosEdgeSwipe(onBack) {
  const ind = document.createElement('div');
  ind.className = 'ios-edge-back';
  ind.setAttribute('aria-hidden', 'true');
  ind.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  document.body.appendChild(ind);

  let startX = 0;
  let startY = 0;
  let active = false;
  let decided = false;   // gorizontal ekanligi aniqlandimi
  let dx = 0;

  const reset = () => {
    active = false;
    decided = false;
    dx = 0;
    ind.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    ind.style.opacity = '0';
    ind.style.transform = 'translate(-60px, -50%)';
  };
  reset();

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.clientX > EDGE_PX) return;
    // Matn kiritilayotgan bo'lsa yoki gorizontal karusel ichida bo'lsa ham chetdan surish ishlaydi
    startX = t.clientX;
    startY = t.clientY;
    active = true;
    decided = false;
    dx = 0;
    ind.style.top = `${t.clientY}px`;
    ind.style.transition = 'none';
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!active) return;
    const t = e.touches[0];
    const mx = t.clientX - startX;
    const my = t.clientY - startY;
    if (!decided) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      // Vertikal aylantirish bo'lsa — aralashmaymiz
      if (Math.abs(my) > Math.abs(mx) || mx < 0) { active = false; return; }
      decided = true;
    }
    if (e.cancelable) e.preventDefault(); // sahifa gorizontal siljimasin
    dx = Math.max(0, Math.min(MAX_PULL, mx));
    const p = Math.min(1, dx / TRIGGER_PX);
    ind.style.opacity = String(0.35 + p * 0.65);
    ind.style.transform = `translate(${dx * 0.55 - 40}px, -50%) scale(${0.8 + p * 0.25})`;
    ind.classList.toggle('is-ready', dx >= TRIGGER_PX);
  }, { passive: false });

  const end = () => {
    if (!active) return;
    const fire = decided && dx >= TRIGGER_PX;
    ind.classList.remove('is-ready');
    reset();
    if (fire) {
      if (navigator.vibrate) navigator.vibrate(8);
      onBack();
    }
  };
  window.addEventListener('touchend', end, { passive: true });
  window.addEventListener('touchcancel', reset, { passive: true });
}
