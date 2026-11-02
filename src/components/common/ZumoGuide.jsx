import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ZUMO_GUIDE_EVENT } from './zumoGuideEvents.js';
import api from '../services/api';
import { getUserProfile } from '../services/user';
import ZumoBot from './ZumoBot.jsx';
import ZumoWelcomeChat, { TOUR_RESUME_KEY } from './ZumoWelcomeChat.jsx';
import useTypewriter from '../hooks/useTypewriter';
import '../../styles/zumoGuide.css';

import { T } from '../utils/T';
// Robot Zumik har qadamda shu tugmani qo'li bilan ko'rsatadi. Ekranda ko'rinmagani
// (masalan, kompyuterda pastki menyu yo'q) avtomatik o'tkazib yuboriladi.
const STEP = {
  search: { target: '.hero-search', title: T('Qidiruv'), text: T('Usta, tovar yoki joy nomini yozing — hammasi bitta qidiruvda topiladi.') },
  request: { target: '.cta-request', title: T('Usta kerakmi?'), text: T('Kerakli xizmatni tanlab, muammo va manzilingizni yozing. Ustalar taklif yuboradi, siz mosini tanlaysiz.'), action: 'request' },
  market: { target: '.cta-marketplace', title: T('Bozor'), text: T('Tovarlar, joylar va xizmat e’lonlarini ko‘ring. E’lonni ochib, egasiga bevosita yozishingiz mumkin.') },
  cats: { target: '.pcg-grid', title: T('Kategoriyalar'), text: T('Kerakli bo‘limni tanlang: elektronika, maishiy texnika, mebel, kiyim va boshqalar.') },
  add: { target: '[data-tour="add"], .gru-bottom-add', title: T('E’lon yoki video qo‘shish'), text: T('Sotadigan narsangiz bormi? Shu tugma orqali bepul e’lon yoki video joylang.') },
  chat: { target: '[data-tour="chat"]', title: T('Chat'), text: T('Xaridor, sotuvchi yoki usta bilan shu yerda yozishasiz. Yangi xabarlar haqida bildirishnoma keladi.') },
  profile: { target: '[data-tour="profile"]', title: T('Profil'), text: T('Buyurtmalaringiz, e’lonlaringiz, saqlanganlar va sozlamalar shu yerda.') },
  menu: { target: '.zumo-topbar__menu', title: T('Tezkor menyu'), text: T('Qidiruv, e’lon joylash, video qo‘shish va sozlamalarga shu menyudan tez kirasiz.') },
  ai: { target: '.ai-chat-toggle', title: T('Savol bormi?'), text: T('AI yordamchiga yozing — ilovadan foydalanish bo‘yicha istalgan vaqtda javob beradi.') },
  // Usta va sotuvchi uchun
  addService: { target: '[data-tour="add"], .gru-bottom-add', title: T('Xizmatingizni joylang'), text: T('«Qo‘shish» → «E’lon joylash» → xizmat turini tanlang. Yaqin atrofdagi mijozlar sizni ko‘radi.') },
  providerOrders: { target: '[data-tour="profile"]', title: T('Buyurtmalar shu yerda'), text: T('Profil → «Xizmat so‘rovlari»: mijoz so‘rovi kelganda telefoningizga baland ovozli xabar keladi.') },
  providerChat: { target: '[data-tour="chat"]', title: T('Mijoz bilan yozishuv'), text: T('Narx va vaqtni mijoz bilan chatda kelishasiz. Rasm ham yuborish mumkin.') },
  addProduct: { target: '[data-tour="add"], .gru-bottom-add', title: T('Tovar joylash'), text: T('«Qo‘shish» → «E’lon joylash»: rasm, narx va kategoriyani tanlang — 1 daqiqa, bepul.') },
  sellerOrders: { target: '[data-tour="profile"]', title: T('Kelgan buyurtmalar'), text: T('Profil → «Kelgan buyurtmalar»: xaridor buyurtma bersa, shu yerda qabul qilasiz va holatini yangilaysiz.') },
  sellerChat: { target: '[data-tour="chat"]', title: T('Xaridor bilan yozishuv'), text: T('Xaridorlar savollarini shu yerda yozadi — tez javob bersangiz, ko‘proq sotasiz.') },
};

// Zumik suhbatda so'raydi: kim sifatida foydalanasiz — shunga mos qadamlar
const ROLE_STEPS = {
  client: [STEP.search, STEP.request, STEP.market, STEP.cats, STEP.chat, STEP.profile, STEP.ai],
  provider: [STEP.addService, STEP.providerOrders, STEP.providerChat, STEP.menu, STEP.ai],
  seller: [STEP.addProduct, STEP.sellerOrders, STEP.sellerChat, STEP.cats, STEP.ai],
};

const BOT_SIZE = 74;

// Zumik "gapiradi": avval uch nuqta, keyin matn harfma-harf. To'liq matn ko'rinmas holda
// joy band qiladi — yozilayotganda karta balandligi sakramaydi.
function ZumoSays({ typed, full }) {
  return (
    <span className="zumo-say">
      <span className="zumo-say__ghost" aria-hidden="true">{full}</span>
      <span className="zumo-say__live">
        {typed.thinking
          ? <span className="zumo-typing-dots" aria-label={T('Yozmoqda...')}><i /><i /><i /></span>
          : <span className={typed.typing ? 'zumo-caret' : ''}>{typed.shown}</span>}
      </span>
    </span>
  );
}
// Bir nechta selektordan ekranda haqiqatan ko'rinib turganini olamiz (display:none — o'lchami 0)
const findVisible = (selector) => [...document.querySelectorAll(selector)]
  .find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) || null;

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function ZumoGuide() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Tanishuvda til tanlangan va sahifa qayta yuklangan bo'lsa — suhbat shu tildan davom etadi
  const [resumeLang, setResumeLang] = useState(() => {
    try { return sessionStorage.getItem(TOUR_RESUME_KEY); } catch { return null; }
  });
  const [flow, setFlow] = useState(() => (resumeLang ? 'welcome' : null));
  useEffect(() => {
    try { sessionStorage.removeItem(TOUR_RESUME_KEY); } catch { /* belgi qolsa ham zarari yo'q */ }
  }, []);
  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState(null);
  const [pageGuide, setPageGuide] = useState(null);
  const [armAngle, setArmAngle] = useState(null);
  const [tourSteps, setTourSteps] = useState(ROLE_STEPS.client);
  const [missingTarget, setMissingTarget] = useState(false);

  const [prevStep, setPrevStep] = useState(step);
  if (prevStep !== step) { setPrevStep(step); setMissingTarget(false); }
  const botRef = useRef(null);
  const storageKey = useMemo(() => user?.id ? `zumo_guide_seen_v3_${user.id}` : null, [user?.id]);
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.fullName || user?.email?.split('@')[0] || T('do‘st');

  // Tanishuv bir marta: avval shu qurilma xotirasi, keyin serverdagi belgi (boshqa qurilmada ko'rgan bo'lsa)
  const checkedFor = useRef(null);
  // Tanishuv allaqachon ochiq (masalan, til tanlab qayta yuklangach davom etyapti) — server javobi uni boshidan ochmasin
  const flowRef = useRef(flow);
  useEffect(() => { flowRef.current = flow; }, [flow]);
  useEffect(() => {
    if (loading || !user || !storageKey || checkedFor.current === storageKey || AUTH_PATHS.includes(location.pathname)) return;
    checkedFor.current = storageKey;
    if (resumeLang) return;
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
      // xotira yopiq bo'lsa server belgisiga tayanamiz
    }
    getUserProfile()
      .then((res) => {
        if (res.data?.onboardingSeen) {
          try { localStorage.setItem(storageKey, '1'); } catch { /* storage can be blocked */ }
          return;
        }
        if (flowRef.current) return;
        setFlow('welcome');
        setStep(-1);
      })
      .catch(() => {});
  }, [loading, user, storageKey, location.pathname, resumeLang]);

  const pageStorageKey = useMemo(() => pageGuide && user?.id ? `zumo_page_guide_v1_${user.id}_${pageGuide.id}` : null, [pageGuide, user?.id]);


  const markSeen = useCallback(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, '1'); } catch { /* storage can be blocked */ }
    // Serverda ham belgilaymiz — boshqa telefon/brauzerda qayta chiqmasin
    api.put('/user/settings', { onboardingSeen: true }).catch(() => {});
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
    setResumeLang(null);
    if (flow === 'welcome') markSeen();
    if (flow === 'page' && pageStorageKey) {
      try { localStorage.setItem(pageStorageKey, '1'); } catch { /* storage can be blocked */ }
    }
    setRect(null);
    setPageGuide(null);
    setFlow(null);
  }, [flow, markSeen, pageStorageKey]);

  const activeStep = flow === 'service-request' ? STEP.request : flow === 'page' ? { target: 'main h1, h1', ...pageGuide } : tourSteps[step];
  // Salomlashuv suhbati (ZumoWelcomeChat) o'z matnlarini o'zi yozadi
  const sayText = (!flow || (flow === 'welcome' && step < 0)) ? '' : (activeStep?.text || T('Bosh sahifaga o‘ting, shunda ilovaning asosiy tugmalarini ko‘rsataman.'));
  const typed = useTypewriter(sayText, { enabled: Boolean(flow) });

  useEffect(() => {
    if (!flow || !activeStep) { setRect(null); return undefined; }
    let frame = 0;
    let resizeObserver;
    let didScroll = false;
    let found = false;
    const measure = () => {
      const target = findVisible(activeStep.target);
      if (!target) { setRect(null); return; }
      found = true;
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
    // Tugma bu ekranda yo'q bo'lsa — keyingi qadamga o'tamiz (oxirgisi bo'lsa yopamiz)
    const skipTimer = flow === 'welcome' ? window.setTimeout(() => {
      if (found) return;
      // Oxirgi qadam o'zi yopilmaydi — karta tugmasiz markazda qoladi, foydalanuvchi "Tugatish"ni bosadi
      if (step >= tourSteps.length - 1) setMissingTarget(true);
      else setStep((current) => current + 1);
    }, 1200) : 0;
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      clearTimeout(skipTimer);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [flow, activeStep, location.pathname, step, markSeen, tourSteps]);

  useEffect(() => {
    if (!flow) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [flow, close]);

  // Tanishuv paytida AI tugmasi oynalar ustida turmasin — faqat o'zi ko'rsatilayotgan qadamda chiqadi
  useEffect(() => {
    const hide = Boolean(flow) && activeStep !== STEP.ai;
    document.body.classList.toggle('zumo-tour-open', hide);
    // AI qadamida tugma aylantirish sabab yashiringan bo'lsa ham ko'rsatiladi
    document.body.classList.toggle('zumo-tour-ai', Boolean(flow) && activeStep === STEP.ai);
    return () => document.body.classList.remove('zumo-tour-open', 'zumo-tour-ai');
  }, [flow, activeStep]);

  // Robot qo'li: yelkadan yoritilgan tugma markaziga burchak
  useLayoutEffect(() => {
    const bot = botRef.current;
    if (!bot || !rect) { setArmAngle(null); return; }
    const box = bot.getBoundingClientRect();
    const sx = box.left + box.width * ZumoBot.SHOULDER.x;
    const sy = box.top + box.height * ZumoBot.SHOULDER.y;
    const angle = (Math.atan2(rect.top + rect.height / 2 - sy, rect.left + rect.width / 2 - sx) * 180) / Math.PI;
    setArmAngle((prev) => (prev !== null && Math.abs(prev - angle) < 0.5 ? prev : angle));
  }, [rect, step, flow]);

  const startTour = (role = 'client') => {
    setResumeLang(null); // keyingi safar tanishuv yana til so'rashdan boshlanadi
    setTourSteps(ROLE_STEPS[role] || ROLE_STEPS.client);
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
    if (flow === 'service-request' || step >= tourSteps.length - 1) {
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
        <section className="zumo-tour-welcome__card zumo-tour-welcome__card--chat" role="dialog" aria-modal="true" aria-labelledby="zumo-tour-welcome-title">
          <button type="button" className="zumo-tour-welcome__close" onClick={close} aria-label={T('Yopish')}><X size={19} /></button>
          <ZumoWelcomeChat name={displayName} onChoose={startTour} onLater={close} initialLang={resumeLang} />
        </section>
      </div>
    );
  }

  const isContextual = flow === 'service-request';
  const isPageGuide = flow === 'page';
  const currentStep = isContextual ? STEP.request : activeStep;
  const currentIndex = isContextual ? 1 : step;
  const cardWidth = Math.min(360, window.innerWidth - 28);
  let cardLeft = rect ? rect.left + rect.width / 2 - cardWidth / 2 : (window.innerWidth - cardWidth) / 2;
  cardLeft = clamp(cardLeft, 14, window.innerWidth - cardWidth - 14);
  // Karta va robot uchun joy: tugma ostida yetarli bo'lsa pastga, bo'lmasa tepaga
  const CARD_H = 200;
  const ROOM = CARD_H + BOT_SIZE + 16;
  const placeAbove = Boolean(rect) && window.innerHeight - rect.bottom < ROOM && rect.top >= ROOM;
  const cardTop = rect
    ? (placeAbove ? rect.top - BOT_SIZE - CARD_H : Math.min(window.innerHeight - CARD_H - 10, rect.bottom + BOT_SIZE + 4))
    : Math.max(80 + BOT_SIZE, (window.innerHeight - 210) / 2);
  // Robot karta chetida, iloji boricha tugma to'g'risida turadi
  const botLeft = clamp(
    rect ? rect.left + rect.width / 2 - cardLeft - BOT_SIZE * ZumoBot.SHOULDER.x : (cardWidth - BOT_SIZE) / 2,
    4,
    cardWidth - BOT_SIZE - 4,
  );

  return (
    <div className="zumo-tour" aria-live="polite">
      <svg className="zumo-tour__shade" width="100%" height="100%" aria-hidden="true">
        <defs><mask id="zumo-tour-cutout"><rect width="100%" height="100%" fill="white" />{rect && <rect x={Math.max(0, rect.left - 7)} y={Math.max(0, rect.top - 7)} width={rect.width + 14} height={rect.height + 14} rx="16" fill="black" />}</mask></defs>
        <rect width="100%" height="100%" fill="rgba(4,12,27,.76)" mask="url(#zumo-tour-cutout)" />
        {rect && <rect className="zumo-tour__ring" x={Math.max(0, rect.left - 7)} y={Math.max(0, rect.top - 7)} width={rect.width + 14} height={rect.height + 14} rx="16" />}
      </svg>
      <aside className="zumo-tour-card" style={{ left: cardLeft, top: cardTop }} role="dialog" aria-modal="true" aria-labelledby="zumo-tour-title">
        <span
          ref={botRef}
          className={`zumo-tour-card__bot ${placeAbove ? 'zumo-tour-card__bot--below' : ''}`}
          style={{ left: botLeft }}
        >
          <ZumoBot size={BOT_SIZE} angle={rect ? armAngle : null} talking={typed.typing && !typed.thinking} />
        </span>
        <div className="zumo-tour-card__top"><span>{isContextual ? T('XIZMAT SO‘ROVI') : isPageGuide ? T('SAHIFA YO‘RIQNOMASI') : T('QADAM {{n}} / {{total}}', { n: currentIndex + 1, total: tourSteps.length })}</span><button type="button" onClick={close} aria-label={T('Tanishtiruvni yopish')}><X size={17} /></button></div>
        <h2 id="zumo-tour-title">{currentStep?.title || T('Bu bo‘lim hozir ko‘rinmayapti')}</h2>
        <p><ZumoSays typed={typed} full={sayText} /></p>
        {!rect && !missingTarget && <p className="zumo-tour-card__loading">{T('Kerakli tugmani topyapman…')}</p>}
        <div className="zumo-tour-card__bottom"><button type="button" className="zumo-tour-card__skip" onClick={close}>{isPageGuide ? T('Keyinroq') : T('O‘tkazib yuborish')}</button><div className="zumo-tour-card__controls">{!isContextual && !isPageGuide && currentIndex > 0 && <button type="button" className="zumo-tour-card__back" onClick={() => setStep((value) => value - 1)} aria-label={T('Orqaga')}><ArrowLeft size={17} /></button>}<button type="button" className="zumo-tour-card__next" onClick={() => (typed.typing ? typed.skip() : advance())}>{isContextual ? T('So‘rovni boshlash') : isPageGuide ? T('Tushunarli') : currentIndex === tourSteps.length - 1 ? T('Tugatish') : T('Keyingi')} {currentIndex === tourSteps.length - 1 && !isContextual && !isPageGuide ? <Check size={16} /> : <ArrowRight size={16} />}</button></div></div>
      </aside>
    </div>
  );
}
