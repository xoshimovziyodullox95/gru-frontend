// Birinchi marta bo'limga kirganda Zumik qisqa tushuntiradi (har bo'limda bir marta).
// Ekranni to'smaydi: pastda kichik pufakcha. Tanishuv ochiq bo'lsa chiqmaydi.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ZumoBot from './ZumoBot.jsx';
import useTypewriter from '../hooks/useTypewriter';
import { T } from '../utils/T';
import '../../styles/zumikTips.css';

const TIPS = {
  '/marketplace': () => T('Bu — Bozor. Kategoriyani tanlang yoki qidiring: tovarlar, ustalar va joylar shu yerda.'),
  '/marketplace/all': () => T('Filtrlar bilan narx, kategoriya va turini tanlang. Yoqqanini yurakcha bilan saqlab qo‘ying.'),
  '/cart': () => T('Savat: sonini o‘zgartiring va «Buyurtma berish»ni bosing. To‘lov — tovarni qo‘lingizga olganda.'),
  '/chat': () => T('Chat: xabarni o‘ngga sursangiz — javob, uzoq bossangiz — menyu. «⋮» orqali chat fonini o‘zgartiring.'),
  '/request': () => T('Muammoni tanlang va yozing — yaqin ustalar narx taklif qiladi, siz eng mosini tanlaysiz.'),
  '/add-listing': () => T('Nima joylaysiz: narsa sotish, xizmat yoki joy. 1–2 daqiqa, bepul. Yaxshi rasm — tez sotiladi!'),
  '/notifications': () => T('Bildirishnomalar: buyurtmalar, xabarlar, layk va obunalar shu yerda.'),
  '/marketplace/profile': () => T('Bu profilingiz: e’lonlar, videolar va buyurtmalar. Tahrirlash uchun qalamchani bosing.'),
  '/profile': () => T('Bu profilingiz: e’lonlar, videolar va buyurtmalar. Tahrirlash uchun qalamchani bosing.'),
  '/my-orders': () => T('Buyurtmalaringiz holati shu yerda. Sotuvchi qabul qilsa — darhol xabar keladi.'),
  '/received-orders': () => T('Kelgan buyurtmalar: qabul qiling yoki rad eting. Xaridorga telefon raqamini bosib qo‘ng‘iroq qiling.'),
  '/provider-requests': () => T('Mijoz so‘rovlari: narx taklif qiling. Sizni tanlashsa — manzil va telefon ochiladi.'),
  '/settings': () => T('Sozlamalar: til, mavzu, bildirishnomalar va akkaunt. Tanishuvni qayta ko‘rish ham shu yerda.'),
  '/ai-assistant': () => T('Menga istalgan savolni bering — ZUMO’dan ham, internetdan ham qidirib topaman.'),
};

const SEEN_KEY = 'zumik_tips_seen';
const OFF_KEY = 'zumik_tips_off';
const readSeen = () => {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
};

function TipBubble({ text, onClose, onOff }) {
  const typed = useTypewriter(text, { delay: 350 });
  return (
    <div className="zumik-tip" role="status" onClick={typed.typing ? typed.skip : undefined}>
      <span className="zumik-tip__bot"><ZumoBot size={52} talking={typed.typing && !typed.thinking} /></span>
      <div className="zumik-tip__body">
        <strong>Zumik</strong>
        <p>
          {typed.thinking
            ? <span className="zumo-typing-dots"><i /><i /><i /></span>
            : <span className={typed.typing ? 'zumo-caret' : ''}>{typed.shown}</span>}
        </p>
        <div className="zumik-tip__actions">
          <button type="button" className="zumik-tip__ok" onClick={onClose}>{T('Tushunarli')}</button>
          <button type="button" className="zumik-tip__off" onClick={onOff}>{T('Boshqa ko‘rsatmang')}</button>
        </div>
      </div>
    </div>
  );
}

export default function ZumikPageTips() {
  const { pathname } = useLocation();
  const [tip, setTip] = useState(null); // { path, text }

  useEffect(() => {
    const getText = TIPS[pathname];
    if (!getText) return undefined;
    try {
      if (localStorage.getItem(OFF_KEY) || readSeen().includes(pathname)) return undefined;
    } catch {
      return undefined;
    }
    const timer = setTimeout(() => {
      // Asosiy tanishuv yoki boshqa oyna ochiq bo'lsa — keyingi safar
      if (document.querySelector('.zumo-tour, .zumo-tour-welcome, .co-overlay')) return;
      setTip({ path: pathname, text: getText() });
      try { localStorage.setItem(SEEN_KEY, JSON.stringify([...readSeen(), pathname])); } catch { /* faqat shu safar */ }
    }, 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!tip || tip.path !== pathname) return null;
  return (
    <TipBubble
      key={tip.path}
      text={tip.text}
      onClose={() => setTip(null)}
      onOff={() => {
        try { localStorage.setItem(OFF_KEY, '1'); } catch { /* faqat shu safar */ }
        setTip(null);
      }}
    />
  );
}
