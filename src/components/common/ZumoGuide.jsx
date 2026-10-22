import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ZUMO_GUIDE_EVENT } from './zumoGuideEvents.js';
import '../../styles/zumoGuide.css';

const TOUR_STEPS = [
  { target: '.zumo-topbar__menu', title: 'Tezkor menyu', text: 'Qidiruv, e’lon joylash, video qo‘shish va sozlamalarga shu menyudan kirasiz.', placement: 'bottom' },
  { target: '.cta-request', title: 'Usta kerakmi?', text: 'Kerakli xizmatni tanlab, muammo va manzilingizni yozing. Ustalar taklif yuboradi, siz mosini tanlaysiz.', placement: 'bottom', action: 'request' },
  { target: '.cta-marketplace', title: 'Bozor', text: 'Tovarlar, joylar va xizmat e’lonlarini ko‘ring. E’lonni ochib, egasiga bevosita yozishingiz mumkin.', placement: 'bottom' },
  { target: '.home-listing-section', title: 'E’lonlar karuseli', text: 'Yangi e’lonlarni yon tomonga surib ko‘ring. “Barcha e’lonlarni ko‘rish” orqali to‘liq bozorga o‘tasiz.', placement: 'top' },
  { target: '.gru-bottom-add, .gru-add-listing-btn', title: 'E’lon yoki video qo‘shish', text: '“+” tugmasi yoki e’lon joylash havolasi orqali tovar, joy, xizmat e’loni yoki video joylang.', placement: 'top' },
  { target: '.gru-bottom-nav a[href="/chat"]', title: 'Chat', text: 'Xaridor, sotuvchi yoki usta bilan yozishing. Javoblar va yangi buyurtma takliflari haqida bildirishnoma olasiz.', placement: 'top' },
];

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const PAGE_GUIDES = [
  { test: (p) => p === '/request', id: 'request', title: 'Usta so‘rovi: 3 qadam', text: '1) Xizmat turini tanlang yoki qidiring. 2) Qachon kerakligini belgilang va muammoni kamida 10 ta belgi bilan yozing. 3) Manzilni xaritadan belgilang yoki yozing, keyin so‘rovni yuboring. Mos ustalarga xabar boradi; takliflarni o‘zingiz solishtirasiz.' },
  { test: (p) => p === '/marketplace' || p === '/marketplace/all', id: 'marketplace', title: 'Bozor e’lonlarini ko‘rish', text: 'Qidiruv va filtrlardan foydalanib tovar, joy yoki xizmat toping. Kartani ochib rasmlar, narx va tafsilotlarni ko‘ring; yoqqan e’lonni saqlashingiz yoki egasiga yozishingiz mumkin.' },
  { test: (p) => p === '/marketplace/products', id: 'marketplace-products', title: 'Tovar turini tanlang', text: 'Avval mos mahsulot bo‘limini tanlang. Keyingi sahifada kategoriya va e’lonlar chiqadi; qidiruv yoki filtr bilan natijani toraytiring.' },
  { test: (p) => p.startsWith('/marketplace/products/'), id: 'marketplace-product-list', title: 'Mahsulotlarni toping', text: 'Kartalarni ko‘rib, mos mahsulotni tanlang. Tafsilot sahifasida narx va rasmlarni tekshiring, keyin sotuvchiga chat orqali yozing.' },
  { test: (p) => p === '/marketplace/services' || p.startsWith('/marketplace/services/'), id: 'marketplace-services', title: 'Xizmat tanlash', text: 'Xizmat kategoriyasini ochib, mutaxassislar va takliflarni ko‘ring. Profil, xizmat tavsifi va aloqa ma’lumotlarini tekshirib, kerak bo‘lsa chatga yozing.' },
  { test: (p) => p === '/marketplace/locations' || p === '/marketplace/bank', id: 'marketplace-special', title: 'Bo‘lim ichidan tanlang', text: 'Kartalar va kategoriyalarni ko‘rib, kerakli taklifni oching. Tafsilotlarni tekshiring; savol bo‘lsa egasiga chat orqali murojaat qiling.' },
  { test: (p) => p === '/marketplace/profile', id: 'marketplace-profile', title: 'Marketplace profilingiz', text: 'Marketplace’dagi hisob va buyurtmalaringizni ko‘ring. Kerakli e’lon yoki buyurtmani ochib, tafsilotlarni tekshiring.' },
  { test: (p) => p === '/cart', id: 'cart', title: 'Savatni tekshiring', text: 'Tanlagan mahsulotlaringiz shu yerda. Miqdor va narxni tekshirib, davom eting. Savatga qo‘shilgan mahsulot hali buyurtma yuborildi degani emas.' },
  { test: (p) => p === '/saved', id: 'saved', title: 'Saqlangan e’lonlar', text: 'Yoqtirgan e’lonlaringizni shu yerdan qayta topasiz. E’lonni ochib tafsilotlarini ko‘ring yoki egasi bilan bog‘laning.' },
  { test: (p) => p === '/bank-services' || p.startsWith('/bank-service/'), id: 'bank-services', title: 'Bank xizmatlari', text: 'Xizmatlarni solishtirib, shartlar, komissiya va talablarni batafsil ko‘ring. Sizga mos taklifni tanlab, qo‘shimcha ma’lumot oling.' },
  { test: (p) => p === '/business-directions', id: 'business-directions', title: 'Biznes yo‘nalishini tanlang', text: 'Yo‘nalishlarni ko‘rib, o‘zingizga mosini oching. Kategoriya ichida e’lonlar va bizneslar chiqadi; qidiruv orqali keraklisini tez topasiz.' },
  { test: (p) => p === '/profile' || p.startsWith('/profile/'), id: 'profile', title: 'Profilingizni boshqaring', text: 'Shaxsiy ma’lumotlar va e’lonlaringizni ko‘ring. O‘z e’loningizni tahrirlash, buyurtmalarni kuzatish va sozlamalarni o‘zgartirish uchun tegishli bo‘limni tanlang.' },
  { test: (p) => p === '/chat', id: 'chat', title: 'Suhbatlar', text: 'Suhbatni tanlab xabar yozing. E’lon yoki buyurtma haqida gaplashayotganda zarur tafsilotlarni shu yerda kelishing.' },
  { test: (p) => p === '/notifications', id: 'notifications', title: 'Bildirishnomalar', text: 'Yangi xabarlar, takliflar va buyurtma holati shu yerda ko‘rinadi. Bildirishnomani bosing — tegishli suhbat yoki buyurtma ochiladi.' },
  { test: (p) => p === '/my-requests' || p === '/requests' || /^\/requests\/[^/]+$/.test(p), id: 'my-requests', title: 'Xizmat so‘rovlaringiz', text: 'Yuborgan so‘rovlaringiz holati va ustalardan kelgan takliflarni shu yerda kuzating. Tafsilotni ochib, mos ustani tanlang yoki chatda aniqlik kiriting.' },
  { test: (p) => p === '/provider-requests' || p.startsWith('/provider-requests/'), id: 'provider-requests', title: 'Usta so‘rovlari', text: 'Sizga mos mijoz so‘rovlarini ko‘rib chiqing. Ish tafsilotlari va manzilni o‘qib, bajara olsangiz taklif yuboring; mijoz sizni tanlasa chat orqali bog‘lanadi.' },
  { test: (p) => p === '/add-listing', id: 'add-listing', title: 'E’lon turini tanlang', text: 'Sotmoqchi bo‘lgan tovar, joy yoki xizmat turini tanlang. Keyingi formaga aniq nom, tavsif, narx va sifatli rasmlarni kiritsangiz, e’lon tushunarli chiqadi.' },
  { test: (p) => p === '/add-location' || p.startsWith('/edit/location/'), id: 'location-form', title: 'Joy e’loni', text: 'Joy nomi, manzili, narxi va muhim shartlarni kiriting. Xarita va rasmlarni qo‘shib, e’lonni saqlashdan oldin ma’lumotlarni tekshiring.' },
  { test: (p) => p === '/add-equipment' || p.startsWith('/edit/equipment/'), id: 'equipment-form', title: 'Tovar e’loni', text: 'Tovar nomi, holati, narxi va tavsifini yozing. Haqiqiy rasmlar qo‘shing, aloqa ma’lumotlarini tekshirib e’lonni joylang.' },
  { test: (p) => p === '/add-service' || p.startsWith('/edit/service/'), id: 'service-form', title: 'Xizmat e’loni', text: 'Qaysi ishlarni bajarishingiz, tajribangiz, xizmat hududingiz va narxni tushunarli yozing. Shunda mijozlar sizni topib, so‘rov yubora oladi.' },
  { test: (p) => p === '/add-video', id: 'video-form', title: 'Video e’lon qo‘shish', text: 'Videoni tanlang, qisqa sarlavha va tavsif yozing. E’lon nimani ko‘rsatishini aniq tushuntirib, joylashdan oldin ko‘rib chiqing.' },
  { test: (p) => p === '/broadcast-ad', id: 'broadcast-ad', title: 'Obunachilarga e’lon yuborish', text: 'Xabaringizni oladigan auditoriya va e’lon mazmunini tekshiring. Tarqatishdan oldin matn va media to‘g‘ri ekanini tasdiqlang.' },
  { test: (p) => p === '/become-provider', id: 'become-provider', title: 'Xizmat ko‘rsatuvchi bo‘ling', text: 'Xizmat yo‘nalishingiz, tajribangiz va aloqa ma’lumotlarini kiriting. Profilingiz to‘liq bo‘lsa, mijozlar sizni topib so‘rov yuborishi osonlashadi.' },
  { test: (p) => p === '/my-branches', id: 'my-branches', title: 'Filiallarni boshqarish', text: 'Biznes manzillari va filial ma’lumotlarini tekshiring. Yangi filial qo‘shsangiz, manzil va aloqa ma’lumotlarini aniq kiriting.' },
  { test: (p) => p === '/supplier-stats', id: 'supplier-stats', title: 'Yetkazib beruvchi statistikasi', text: 'Ko‘rsatkichlarni davr va bo‘limlar bo‘yicha ko‘rib chiqing. Buyurtmalar va savdo holatini tekshirib, kerak bo‘lsa e’lon yoki zaxirani yangilang.' },
  { test: (p) => p === '/received-orders' || p === '/my-orders' || p === '/history', id: 'orders', title: 'Buyurtmalarni boshqarish', text: 'Buyurtma holati, mijoz yoki sotuvchi ma’lumotlarini tekshiring. Keyingi qadamni buyurtma tafsilotlaridagi amallar orqali bajaring.' },
  { test: (p) => p === '/dashboard' || p === '/business', id: 'business-dashboard', title: 'Biznes boshqaruvi', text: 'Biznes ko‘rsatkichlari, e’lonlar va buyurtmalarni tegishli bo‘limlardan boshqaring. Avval profil va yo‘nalish ma’lumotlari to‘liq ekanini tekshiring.' },
  { test: (p) => p === '/bank-dashboard' || p === '/admin-dashboard', id: 'staff-dashboard', title: 'Boshqaruv paneli', text: 'Ko‘rsatkichlar va boshqaruv amallari shu sahifada. O‘zgartirish kiritishdan avval tanlangan bo‘lim va ma’lumotni tekshirib chiqing.' },
  { test: (p) => p === '/premium', id: 'premium', title: 'Premium imkoniyatlar', text: 'Tarif imkoniyatlari va shartlarini solishtiring. Sizga kerakli funksiyalarni tanlab, davom etishdan avval to‘lov shartlarini ko‘rib chiqing.' },
  { test: (p) => p === '/ai-assistant', id: 'ai-assistant', title: 'ZUMO AI yordamchisi', text: 'Savolingizni oddiy tilda yozing: qidiruv, e’lon yoki xizmat bo‘yicha yordam so‘rashingiz mumkin. Javobni tekshirib, kerak bo‘lsa tegishli bo‘limga o‘ting.' },
  { test: (p) => p.startsWith('/category/') || p.startsWith('/subcategory/'), id: 'category', title: 'Kategoriya e’lonlari', text: 'Tanlangan yo‘nalishdagi e’lonlarni ko‘ring. Filtr va qidiruv bilan tanlang, kartani ochib egasiga murojaat qiling.' },
  { test: (p) => p.startsWith('/location/') || p.startsWith('/equipment/') || p.startsWith('/services/') || p.startsWith('/posts/'), id: 'listing-detail', title: 'E’lon tafsilotlari', text: 'Rasm, tavsif, narx va e’lon egasini tekshiring. Qiziqsangiz saqlang yoki chat orqali bog‘laning; kelishuvni chatda aniqlashtiring.' },
  { test: (p) => p.startsWith('/service-provider/'), id: 'provider-detail', title: 'Xizmat ko‘rsatuvchi profili', text: 'Xizmatlar, tajriba va aloqa ma’lumotlarini ko‘rib chiqing. Ma’qul kelsa chatga yozing yoki xizmat so‘rovi yuboring.' },
  { test: (p) => p === '/game' || p === '/lessons' || p === '/physic' || p.startsWith('/physic/'), id: 'learn-play', title: 'O‘rganish va mashq', text: 'Mavzu yoki mashqni tanlab, ko‘rsatmalarni ketma-ket bajaring. Natijangizni saqlab, keyingi dars yoki bosqichga o‘tishingiz mumkin.' },
];

function getPageGuide(pathname) {
  return PAGE_GUIDES.find((guide) => guide.test(pathname)) || null;
}

export default function ZumoGuide() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [flow, setFlow] = useState(null);
  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState(null);
  const [pageGuide, setPageGuide] = useState(null);
  const storageKey = useMemo(() => user?.id ? `zumo_guide_seen_v3_${user.id}` : null, [user?.id]);
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.fullName || user?.email?.split('@')[0] || 'do‘st';

  useEffect(() => {
    if (loading || !user || !storageKey || AUTH_PATHS.includes(location.pathname)) return;
    try { if (!localStorage.getItem(storageKey)) { setFlow('welcome'); setStep(-1); } }
    catch { setFlow('welcome'); setStep(-1); }
  }, [loading, user, storageKey, location.pathname]);

  const pageStorageKey = useMemo(() => pageGuide && user?.id ? `zumo_page_guide_v1_${user.id}_${pageGuide.id}` : null, [pageGuide, user?.id]);

  useEffect(() => {
    if (loading || !user || !storageKey || flow || AUTH_PATHS.includes(location.pathname)) return;
    const guide = getPageGuide(location.pathname);
    if (!guide) return;
    try {
      if (!localStorage.getItem(storageKey)) return;
      const key = `zumo_page_guide_v1_${user.id}_${guide.id}`;
      if (!localStorage.getItem(key)) {
        setPageGuide(guide);
        setFlow('page');
      }
    } catch {
      setPageGuide(guide);
      setFlow('page');
    }
  }, [loading, user, storageKey, flow, location.pathname]);

  const markSeen = useCallback(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, '1'); } catch { /* storage can be blocked */ }
  }, [storageKey]);

  useEffect(() => {
    const onOpen = (event) => {
      const nextFlow = event.detail?.flow === 'service-request' ? 'service-request' : 'welcome';
      setStep(nextFlow === 'welcome' ? -1 : 1);
      setPageGuide(null);
      if (nextFlow === 'service-request') markSeen();
      setFlow(nextFlow);
    };
    window.addEventListener(ZUMO_GUIDE_EVENT, onOpen);
    return () => window.removeEventListener(ZUMO_GUIDE_EVENT, onOpen);
  }, [markSeen]);

  const close = useCallback(() => {
    if (flow === 'welcome') markSeen();
    if (flow === 'page' && pageStorageKey) {
      try { localStorage.setItem(pageStorageKey, '1'); } catch { /* storage can be blocked */ }
    }
    setRect(null);
    setPageGuide(null);
    setFlow(null);
  }, [flow, markSeen, pageStorageKey]);

  const activeStep = flow === 'service-request' ? TOUR_STEPS[1] : flow === 'page' ? { target: 'main h1, h1', ...pageGuide } : TOUR_STEPS[step];

  useEffect(() => {
    if (!flow || !activeStep) { setRect(null); return undefined; }
    let frame = 0;
    let resizeObserver;
    let didScroll = false;
    const measure = () => {
      const target = document.querySelector(activeStep.target);
      if (!target) { setRect(null); return; }
      if (!didScroll) {
        didScroll = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
      const bounds = target.getBoundingClientRect();
      setRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height, right: bounds.right, bottom: bounds.bottom });
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        const updated = target.getBoundingClientRect();
        setRect({ top: updated.top, left: updated.left, width: updated.width, height: updated.height, right: updated.right, bottom: updated.bottom });
      });
      resizeObserver.observe(target);
    };
    frame = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const timer = window.setTimeout(measure, 320);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [flow, activeStep, location.pathname]);

  useEffect(() => {
    if (!flow) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [flow, close]);

  const startTour = () => {
    markSeen();
    if (location.pathname !== '/home') navigate('/home');
    setStep(0);
  };

  const advance = () => {
    if (flow === 'page') {
      if (pageStorageKey) {
        try { localStorage.setItem(pageStorageKey, '1'); } catch { /* storage can be blocked */ }
      }
      setFlow(null);
      setPageGuide(null);
      setRect(null);
      return;
    }
    if (flow === 'service-request' || step >= TOUR_STEPS.length - 1) {
      if (flow === 'welcome') markSeen();
      setFlow(null);
      setRect(null);
      if (activeStep?.action === 'request') navigate('/request');
      return;
    }
    setStep((current) => current + 1);
  };

  if (!flow) return null;
  if (step < 0 && flow === 'welcome') {
    return (
      <div className="zumo-tour-welcome" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
        <section className="zumo-tour-welcome__card" role="dialog" aria-modal="true" aria-labelledby="zumo-tour-welcome-title">
          <button type="button" className="zumo-tour-welcome__close" onClick={close} aria-label="Yopish"><X size={19} /></button>
          <div className="zumo-tour-welcome__symbol"><span>Z</span><i /></div>
          <span className="zumo-tour-welcome__eyebrow">ZUMO · 1 daqiqalik tanishtiruv</span>
          <h2 id="zumo-tour-welcome-title">Salom, {displayName}!</h2>
          <p>ZUMO’da tovar va xizmat topish, ustaga buyurtma berish hamda o‘z e’loningizni joylash mumkin. Hozir ekrandagi asosiy tugmalarni birma-bir ko‘rsataman.</p>
          <div className="zumo-tour-welcome__actions"><button type="button" onClick={close} className="zumo-tour-welcome__skip">Keyinroq</button><button type="button" onClick={startTour} className="zumo-tour-welcome__start">Ko‘rsatishni boshlash <ChevronRight size={18} /></button></div>
          <div className="zumo-tour-welcome__dots"><i /><i /><i /><i /><i /></div>
        </section>
      </div>
    );
  }

  const isContextual = flow === 'service-request';
  const isPageGuide = flow === 'page';
  const currentStep = isContextual ? TOUR_STEPS[1] : activeStep;
  const currentIndex = isContextual ? 1 : step;
  const cardWidth = Math.min(360, window.innerWidth - 28);
  let cardLeft = rect ? rect.left + rect.width / 2 - cardWidth / 2 : (window.innerWidth - cardWidth) / 2;
  cardLeft = clamp(cardLeft, 14, window.innerWidth - cardWidth - 14);
  const placeAbove = rect && (currentStep?.placement === 'top' || rect.bottom + 215 > window.innerHeight);
  const cardTop = rect ? (placeAbove ? Math.max(14, rect.top - 200) : Math.min(window.innerHeight - 205, rect.bottom + 18)) : Math.max(80, (window.innerHeight - 210) / 2);

  return (
    <div className="zumo-tour" aria-live="polite">
      <svg className="zumo-tour__shade" width="100%" height="100%" aria-hidden="true">
        <defs><mask id="zumo-tour-cutout"><rect width="100%" height="100%" fill="white" />{rect && <rect x={Math.max(0, rect.left - 7)} y={Math.max(0, rect.top - 7)} width={rect.width + 14} height={rect.height + 14} rx="16" fill="black" />}</mask></defs>
        <rect width="100%" height="100%" fill="rgba(4,12,27,.76)" mask="url(#zumo-tour-cutout)" />
        {rect && <rect className="zumo-tour__ring" x={Math.max(0, rect.left - 7)} y={Math.max(0, rect.top - 7)} width={rect.width + 14} height={rect.height + 14} rx="16" />}
      </svg>
      <aside className="zumo-tour-card" style={{ left: cardLeft, top: cardTop }} role="dialog" aria-modal="true" aria-labelledby="zumo-tour-title">
        <div className="zumo-tour-card__top"><span>{isContextual ? 'XIZMAT SO‘ROVI' : isPageGuide ? 'SAHIFA YO‘RIQNOMASI' : `QADAM ${currentIndex + 1} / ${TOUR_STEPS.length}`}</span><button type="button" onClick={close} aria-label="Tanishtiruvni yopish"><X size={17} /></button></div>
        <h2 id="zumo-tour-title">{currentStep?.title || 'Bu bo‘lim hozir ko‘rinmayapti'}</h2>
        <p>{currentStep?.text || 'Bosh sahifaga o‘ting, shunda ilovaning asosiy tugmalarini ko‘rsataman.'}</p>
        {!rect && <p className="zumo-tour-card__loading">Kerakli tugmani topyapman…</p>}
        <div className="zumo-tour-card__bottom"><button type="button" className="zumo-tour-card__skip" onClick={close}>{isPageGuide ? 'Keyinroq' : 'O‘tkazib yuborish'}</button><div className="zumo-tour-card__controls">{!isContextual && !isPageGuide && currentIndex > 0 && <button type="button" className="zumo-tour-card__back" onClick={() => setStep((value) => value - 1)} aria-label="Orqaga"><ArrowLeft size={17} /></button>}<button type="button" className="zumo-tour-card__next" onClick={advance}>{isContextual ? 'So‘rovni boshlash' : isPageGuide ? 'Tushunarli' : currentIndex === TOUR_STEPS.length - 1 ? 'Tugatish' : 'Keyingi'} {currentIndex === TOUR_STEPS.length - 1 && !isContextual && !isPageGuide ? <Check size={16} /> : <ArrowRight size={16} />}</button></div></div>
      </aside>
    </div>
  );
}
