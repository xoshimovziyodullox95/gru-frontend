// Filtr holatini URL'da saqlaydi: e'londan "Orqaga" qaytganda filtrlar va
// aylantirish joyi o'z holicha qoladi (sahifa qayta ochilsa ham).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

const SEP = ',';

// Bitta qiymat (matn, belgi yoki tanlov). Bo'sh/standart qiymat URL'dan o'chadi.
export function useUrlParam(key, fallback = '') {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const value = raw ?? fallback;
  const setValue = useCallback((next) => {
    // Bir bosishda bir nechta filtr o'zgarsa ham (masalan "tozalash") hammasi saqlansin:
    // BrowserRouter manzilni darhol yangilaydi, shuning uchun har safar joriy manzildan o'qiymiz
    const p = new URLSearchParams(window.location.search);
    const v = typeof next === 'function' ? next(p.get(key) ?? fallback) : next;
    if (v === '' || v == null || v === fallback) p.delete(key);
    else p.set(key, String(v));
    setParams(p, { replace: true });
  }, [key, fallback, setParams]);
  return [value, setValue];
}

// Bir nechta tanlov (Set). URL'da vergul bilan: ?type=service,equipment
export function useUrlSet(key) {
  const [raw, setRaw] = useUrlParam(key, '');
  const set = useMemo(() => new Set(raw ? raw.split(SEP).filter(Boolean) : []), [raw]);
  const setSet = useCallback((next) => {
    setRaw((prevRaw) => {
      const prev = new Set(prevRaw ? prevRaw.split(SEP).filter(Boolean) : []);
      const v = typeof next === 'function' ? next(prev) : next;
      return [...v].join(SEP);
    });
  }, [setRaw]);
  return [set, setSet];
}

// Marketplace ichida sahifa .mkt-content ichida aylanadi, boshqa joyda — oynaning o'zi
const getScroller = () => document.querySelector('.mkt-content') || null;
const readY = (el) => (el ? el.scrollTop : window.scrollY);

// Sahifadan chiqishda scroll joyini eslab qoladi va "Orqaga" qaytganda,
// ma'lumot yuklangach (ready), o'sha joyga qaytaradi.
export function useScrollRestore(ready) {
  const { key } = useLocation();
  const storeKey = `zumo:scroll:${key}`;
  const restored = useRef(false);

  // Chiqish paytida konteyner allaqachon olib tashlangan bo'lishi mumkin,
  // shuning uchun oxirgi joyni aylantirish paytida yozib boramiz
  useEffect(() => {
    const el = getScroller();
    const target = el || window;
    let y = null; // null — aylantirilmadi, eski yozuvni buzmaymiz (StrictMode qayta ulashi ham)
    const onScroll = () => { y = readY(el); };
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      if (y == null) return;
      try { sessionStorage.setItem(storeKey, String(y)); } catch { /* storage yo'q */ }
    };
  }, [storeKey]);

  useLayoutEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    let y = 0;
    try { y = Number(sessionStorage.getItem(storeKey)) || 0; } catch { /* storage yo'q */ }
    if (y <= 0) return;
    const el = getScroller();
    if (el) el.scrollTop = y;
    else window.scrollTo(0, y);
  }, [ready, storeKey]);
}

// Ha/yo'q belgisi (?top=1). setFlag(true | false | (v) => !v)
export function useUrlFlag(key) {
  const [raw, setRaw] = useUrlParam(key, '');
  const setFlag = useCallback((next) => {
    setRaw((prevRaw) => {
      const v = typeof next === 'function' ? next(prevRaw === '1') : next;
      return v ? '1' : '';
    });
  }, [setRaw]);
  return [raw === '1', setFlag];
}
