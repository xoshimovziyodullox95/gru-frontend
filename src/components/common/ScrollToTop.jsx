import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Yangi sahifaga o'tganda tepadan boshlanadi. "Orqaga"/"oldinga" (POP) bo'lsa — tegmaymiz:
// ro'yxat sahifalari useScrollRestore bilan oldingi joyiga qaytadi (aks holda bu uni 0 ga tushirib yuborardi).
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo(0, 0);
    const el = document.querySelector('.mkt-content');
    if (el) el.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, navType]);

  return null;
}
