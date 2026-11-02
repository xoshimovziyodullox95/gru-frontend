// Matnni harfma-harf "yozib" ko'rsatadi (AI yordamchi uslubi).
// Avval `delay` davomida "yozmoqda…" holati (thinking), keyin matn chiqadi.
// skip() — darhol to'liq ko'rsatish (masalan, foydalanuvchi bosganda).
import { useCallback, useEffect, useState } from 'react';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function useTypewriter(text, { enabled = true, speed = 18, delay = 450 } = {}) {
  const full = String(text || '');
  const instant = !enabled || reducedMotion();
  const [state, setState] = useState({ text: full, count: instant ? full.length : 0, thinking: !instant });

  // Matn almashsa — qaytadan boshlaymiz (render paytida, effektsiz)
  if (state.text !== full) {
    setState({ text: full, count: instant ? full.length : 0, thinking: !instant });
  }

  useEffect(() => {
    if (instant || !full) return undefined;
    let timer = 0;
    const start = window.setTimeout(() => {
      setState((s) => (s.text === full ? { ...s, thinking: false } : s));
      // Uzun matnda bir qadamda bir nechta harf — 2–3 soniyadan oshmasin
      const step = Math.max(1, Math.ceil(full.length / 140));
      timer = window.setInterval(() => {
        setState((s) => {
          if (s.text !== full) return s;
          const count = Math.min(full.length, s.count + step);
          if (count >= full.length) window.clearInterval(timer);
          return { ...s, count };
        });
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [full, instant, speed, delay]);

  const skip = useCallback(() => {
    setState((s) => ({ ...s, count: s.text.length, thinking: false }));
  }, []);

  const done = state.count >= full.length && !state.thinking;
  return { shown: full.slice(0, state.count), thinking: state.thinking, typing: !done, done, skip };
}
