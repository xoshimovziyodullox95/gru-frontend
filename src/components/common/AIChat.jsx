// Suzuvchi "ZUMO yordamchi" — FAQAT ZUMO bazasi bo'yicha: tovar, mutaxassis/xizmat, joy topib beradi
// va ilovadan foydalanishda yordam beradi. Umumiy savollar uchun — ZUMO AI sahifasi (/ai-assistant).
import { lazy, Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Send, Sparkles } from 'lucide-react';
import { sendAIMessage } from '../services/aiChat';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
// Markdown kutubxonasi og'ir — chat ochilib, birinchi javob chiqqanda yuklanadi
const AiMarkdown = lazy(() => import('./AiMarkdown'));
import { T } from '../utils/T';
import ZumoBot from './ZumoBot.jsx';
import useTypewriter from '../hooks/useTypewriter';
import '../../styles/aiChat.css';

const MAX_INPUT = 1500;
const NOOP = () => {};

// Zumik javobi: yangi javob harfma-harf yoziladi (fresh), tugagach Markdown va kartalar chiqadi
function AssistantMessage({ msg, onTyped, onGrow, onTalk, onCardClick }) {
  const typed = useTypewriter(msg.content, { enabled: Boolean(msg.fresh), delay: 0, speed: 16 });
  useEffect(() => { onGrow(); }, [typed.shown, onGrow]);
  useEffect(() => {
    onTalk(typed.typing);
    if (typed.done && msg.fresh) onTyped();
  }, [typed.typing, typed.done, msg.fresh, onTyped, onTalk]);

  return (
    <div>
      <div className="ai-message assistant">
        <span className="ai-avatar"><ZumoBot size={28} still talking={typed.typing} /></span>
        <div className="ai-message-bubble" onClick={typed.typing ? typed.skip : undefined}>
          {typed.typing
            ? <span className="ai-md zumo-caret">{typed.shown}</span>
            : <Suspense fallback={<span className="ai-md">{msg.content}</span>}><AiMarkdown>{msg.content}</AiMarkdown></Suspense>}
        </div>
      </div>

      {!typed.typing && msg.cards?.length > 0 && (
        <div className="ai-suggestions-grid">
          {msg.cards.map((card) => (
            <Link key={`${card.type}-${card.id}`} to={card.link} className="ai-suggestion-card" onClick={onCardClick}>
              <img
                src={card.image ? getImageUrl(card.image) : '/images/zumo-placeholder.svg'}
                alt=""
                loading="lazy"
                onError={(e) => { e.currentTarget.src = '/images/zumo-placeholder.svg'; }}
              />
              <div className="ai-suggestion-info">
                <h4>{card.title}</h4>
                {card.price != null && card.price !== '' && (
                  <span className="price">
                    {typeof card.price === 'number' ? formatPrice(card.price, card.currency) : card.price}
                  </span>
                )}
                {(card.region || card.address) && <span className="address">{card.region || card.address}</span>}
                <span className="ai-suggestion-btn">{T('Batafsil')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
const SUGGESTIONS = [
  'Menda 3 mln so‘m bor, muzlatgich kerak',
  'Uyimga santexnik kerak',
  'Do‘kon uchun ijaraga joy bormi?',
  'E’lonni qanday joylayman?',
];

export default function AIChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      fresh: true,
      content: T('Salom! Men Zumik — sizning ZUMO yordamchingizman 🤖 Nima izlayotganingizni va byudjetingizni yozing, eng mosini topib beraman.'),
    },
  ]);

  const messagesEndRef = useRef(null);

  // Personaj: Zumik seansda bir marta o'zini tanishtiradi, vaqti-vaqti bilan qo'l silkitadi
  const [introVisible, setIntroVisible] = useState(false);
  const [waving, setWaving] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('zumik_intro_seen') === '1'; } catch { /* har safar ko'rsatamiz */ }
    const timers = [];
    if (!seen) {
      timers.push(setTimeout(() => {
        // Bo'lim maslahati (ZumikPageTips) ko'rinib turgan bo'lsa — ikki Zumik bir vaqtda gapirmasin
        if (document.querySelector('.zumik-tip')) return;
        setIntroVisible(true);
        setWaving(true);
        try { sessionStorage.setItem('zumik_intro_seen', '1'); } catch { /* faqat shu safar */ }
      }, 3500));
      timers.push(setTimeout(() => { setIntroVisible(false); setWaving(false); }, 11000));
    }
    const waveLoop = setInterval(() => {
      setWaving(true);
      timers.push(setTimeout(() => setWaving(false), 2400));
    }, 20000);
    return () => { timers.forEach(clearTimeout); clearInterval(waveLoop); };
  }, []);
  const [talking, setTalking] = useState(false);
  const scrollToEnd = useCallback(() => messagesEndRef.current?.scrollIntoView({ block: 'end' }), []);
  // Yozib bo'lingan javob qayta ochilganda yana yozilmasin
  const markTyped = useCallback((index) => {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, fresh: false } : m)));
  }, []);

  // Pastga o'qiyotganda tugma matnni yopmasin — yashirinadi, yuqoriga
  // aylantirganda yoki sahifa oxirida qayta chiqadi.
  const [hideToggle, setHideToggle] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
      if (Math.abs(y - lastY) < 8) return;
      setHideToggle(y > lastY && y > 120 && !atBottom);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const content = String(text ?? input).trim().slice(0, MAX_INPUT);
    if (!content || loading) return;

    const updated = [...messages, { role: 'user', content }];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      // Serverga faqat matn yuboriladi (kartalar emas); birinchi salomlashuv kerak emas
      const data = await sendAIMessage(updated.slice(1).map(({ role, content: c }) => ({ role, content: c })));
      setMessages((prev) => [...prev, { role: 'assistant', fresh: true, content: data?.reply || T('Javob topilmadi.'), cards: data?.cards || [] }]);
    } catch (error) {
      // Limit yoki boshqa xatoda server tushunarli matn qaytaradi
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', fresh: true, content: error.response?.data?.reply || error.response?.data?.error || T('Server bilan bog\'lanishda xatolik yuz berdi.') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onlyGreeting = messages.length === 1;

  return (
    <>
      {introVisible && !isOpen && !hideToggle && (
        <button type="button" className="zumik-intro" onClick={() => { setIntroVisible(false); setIsOpen(true); }}>
          <strong>{T('Salom! Men Zumik 👋')}</strong>
          <span>{T('Sizning yordamchingizman. Savolingiz bormi?')}</span>
        </button>
      )}
      <button
        className={`ai-chat-toggle ${hideToggle && !isOpen ? 'ai-chat-toggle--hidden' : ''}`}
        onClick={() => { setIntroVisible(false); setIsOpen(true); }}
        aria-label={T('Zumik — yordamchi')}
      >
        <ZumoBot size={44} still={!waving} />
      </button>

      {isOpen && (
        <div className="ai-chat-modal" role="dialog" aria-label={T('Zumik — yordamchi')}>
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-chat-title__bot"><ZumoBot size={38} still talking={talking} /></span>
              <div>
                <h3>Zumik</h3>
                <span className="ai-chat-status">
                  {loading ? T('yozmoqda…') : talking ? T('javob yozyapti…') : T('ZUMO yordamchi · onlayn')}
                </span>
              </div>
            </div>
            <button className="ai-chat-close" onClick={() => setIsOpen(false)} aria-label={T('Yopish')}>
              <X size={20} />
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (msg.role === 'user' ? (
              <div key={index} className="ai-message user">
                <div className="ai-message-bubble">{msg.content}</div>
              </div>
            ) : (
              <AssistantMessage
                key={index}
                msg={msg}
                onTyped={() => markTyped(index)}
                onGrow={scrollToEnd}
                onTalk={index === messages.length - 1 ? setTalking : NOOP}
                onCardClick={() => setIsOpen(false)}
              />
            )))}

            {onlyGreeting && (
              <div className="ai-chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="ai-chip" onClick={() => send(T(s))}>
                    {T(s)}
                  </button>
                ))}
                <button type="button" className="ai-chip ai-chip--accent" onClick={() => { setIsOpen(false); navigate('/ai-assistant'); }}>
                  <Sparkles size={14} /> {T('Umumiy savollar — ZUMO AI')}
                </button>
              </div>
            )}

            {loading && (
              <div className="ai-message assistant">
                <span className="ai-avatar"><ZumoBot size={28} still /></span>
                <div className="ai-message-bubble ai-typing" aria-label={T('Yozmoqda...')}>
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="ai-chat-input-area" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input
              type="text"
              value={input}
              maxLength={MAX_INPUT}
              placeholder={T('Masalan: 5 mln gacha noutbuk')}
              className="ai-chat-input"
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="ai-chat-send" disabled={loading || !input.trim()} aria-label={T('Yuborish')}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
