import { useEffect, useRef } from 'react';

// Escape (telefonda — "orqaga" tugmasi, capacitorShell uni Escape qilib yuboradi) oynani yopadi.
// Oyna ochiq turganda "orqaga" hech narsa qilmay qolmasligi uchun har bir aria-modal oynada kerak.
export default function useEscapeClose(active, onClose) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}
