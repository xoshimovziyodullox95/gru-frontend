import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ZUMO_GUIDE_EVENT } from './zumoGuideEvents.js';
import api from '../services/api';
import { getUserProfile } from '../services/user';
import ZumoBot from './ZumoBot.jsx';
import useTypewriter from '../hooks/useTypewriter';
import '../../styles/zumoGuide.css';

import { T } from '../utils/T';
// Robot Zumik har qadamda shu tugmani qo'li bilan ko'rsatadi. Ekranda ko'rinmagani
// (masalan, kompyuterda pastki menyu yo'q) avtomatik o'tkazib yuboriladi.
const TOUR_STEPS = [
  { target: '.hero-search', title: T('Qidiruv'), text: T('Usta, tovar yoki joy nomini yozing — hammasi bitta qidiruvda topiladi.') },
  { target: '.cta-request', title: T('Usta kerakmi?'), text: T('Kerakli xizmatni tanlab, muammo va manzilingizni yozing. Ustalar taklif yuboradi, siz mosini tanlaysiz.'), action: 'request' },
  { target: '.cta-marketplace', title: T('Bozor'), text: T('Tovarlar, joylar va xizmat e’lonlarini ko‘ring. E’lonni ochib, egasiga bevosita yozishingiz mumkin.') },
  { target: '.pcg-grid', title: T('Kategoriyalar'), text: T('Kerakli bo‘limni tanlang: elektronika, maishiy texnika, mebel, kiyim va boshqalar.') },
  { target: '[data-tour="add"], .gru-bottom-add', title: T('E’lon yoki video qo‘shish'), text: T('Sotadigan narsangiz bormi? Shu tugma orqali bepul e’lon yoki video joylang.') },
  { target: '[data-tour="chat"]', title: T('Chat'), text: T('Xaridor, sotuvchi yoki usta bilan shu yerda yozishasiz. Yangi xabarlar haqida bildirishnoma keladi.') },
  { target: '[data-tour="profile"]', title: T('Profil'), text: T('Buyurtmalaringiz, e’lonlaringiz, saqlanganlar va sozlamalar shu yerda.') },
  { target: '.zumo-topbar__menu', title: T('Tezkor menyu'), text: T('Qidiruv, e’lon joylash, video qo‘shish va sozlamalarga shu menyudan tez kirasiz.') },
  { target: '.ai-chat-toggle:not(.ai-chat-toggle--hidden)', title: T('Savol bormi?'), text: T('AI yordamchiga yozing — ilovadan foydalanish bo‘yicha istalgan vaqtda javob beradi.') },
];

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
  const [flow, setFlow] = useState(null);
  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState(null);
  const [pageGuide, setPageGuide] = useState(null);
  const [armAngle, setArmAngle] = useState(null);
  const botRef = useRef(null);
  const storageKey = useMemo(() => user?.id ? `zumo_guide_seen_v3_${user.id}` : null, [user?.id]);
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.fullName || user?.email?.split('@')[0] || T('do‘st');

  // Tanishuv bir marta: avval shu qurilma xotirasi, keyin serverdagi belgi (boshqa qurilmada ko'rgan bo'lsa)
  const checkedFor = useRef(null);
  useEffect(() => {
    if (loading || !user || !storageKey || checkedFor.current === storageKey || AUTH_PATHS.includes(location.pathname)) return;
    checkedFor.current = storageKey;
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
        setFlow('welcome');
        setStep(-1);
      })
      .catch(() => {});
  }, [loading, user, storageKey, location.pathname]);

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
    if (flow === 'welcome') markSeen();
    if (flow === 'page' && pageStorageKey) {
      try { localStorage.setItem(pageStorageKey, '1'); } catch { /* storage can be blocked */ }
    }
    setRect(null);
    setPageGuide(null);
    setFlow(null);
  }, [flow, markSeen, pageStorageKey]);

  const activeStep = flow === 'service-request' ? TOUR_STEPS[1] : flow === 'page' ? { target: 'main h1, h1', ...pageGuide } : TOUR_STEPS[step];
  const sayText = !flow ? '' : (flow === 'welcome' && step < 0)
    ? T('Men Zumik — ZUMO yordamchisiman. Bu yerda tovar va xizmat topish, ustaga buyurtma berish hamda o‘z e’loningizni joylash mumkin. Hozir asosiy tugmalarni qo‘lim bilan ko‘rsatib beraman.')
    : (activeStep?.text || T('Bosh sahifaga o‘ting, shunda ilovaning asosiy tugmalarini ko‘rsataman.'));
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
      if (step >= TOUR_STEPS.length - 1) { markSeen(); setFlow(null); setRect(null); }
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
  }, [flow, activeStep, location.pathname, step, markSeen]);

  useEffect(() => {
    if (!flow) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [flow, close]);

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
          <button type="button" className="zumo-tour-welcome__close" onClick={close} aria-label={T('Yopish')}><X size={19} /></button>
          <div className="zumo-tour-welcome__bot"><ZumoBot size={92} talking={typed.typing && !typed.thinking} /></div>
          <span className="zumo-tour-welcome__eyebrow">{T('ZUMO · 1 daqiqalik tanishtiruv')}</span>
          <h2 id="zumo-tour-welcome-title">{T('Salom, {{name}}!', { name: displayName })}</h2>
          <p><ZumoSays typed={typed} full={sayText} /></p>
          <div className="zumo-tour-welcome__actions"><button type="button" onClick={close} className="zumo-tour-welcome__skip">{T('Keyinroq')}</button><button type="button" onClick={startTour} className="zumo-tour-welcome__start">{T('Ko‘rsatishni boshlash')} <ChevronRight size={18} /></button></div>
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
        <div className="zumo-tour-card__top"><span>{isContextual ? T('XIZMAT SO‘ROVI') : isPageGuide ? T('SAHIFA YO‘RIQNOMASI') : T('QADAM {{n}} / {{total}}', { n: currentIndex + 1, total: TOUR_STEPS.length })}</span><button type="button" onClick={close} aria-label={T('Tanishtiruvni yopish')}><X size={17} /></button></div>
        <h2 id="zumo-tour-title">{currentStep?.title || T('Bu bo‘lim hozir ko‘rinmayapti')}</h2>
        <p><ZumoSays typed={typed} full={sayText} /></p>
        {!rect && <p className="zumo-tour-card__loading">{T('Kerakli tugmani topyapman…')}</p>}
        <div className="zumo-tour-card__bottom"><button type="button" className="zumo-tour-card__skip" onClick={close}>{isPageGuide ? T('Keyinroq') : T('O‘tkazib yuborish')}</button><div className="zumo-tour-card__controls">{!isContextual && !isPageGuide && currentIndex > 0 && <button type="button" className="zumo-tour-card__back" onClick={() => setStep((value) => value - 1)} aria-label={T('Orqaga')}><ArrowLeft size={17} /></button>}<button type="button" className="zumo-tour-card__next" onClick={() => (typed.typing ? typed.skip() : advance())}>{isContextual ? T('So‘rovni boshlash') : isPageGuide ? T('Tushunarli') : currentIndex === TOUR_STEPS.length - 1 ? T('Tugatish') : T('Keyingi')} {currentIndex === TOUR_STEPS.length - 1 && !isContextual && !isPageGuide ? <Check size={16} /> : <ArrowRight size={16} />}</button></div></div>
      </aside>
    </div>
  );
}
