// Suzuvchi "ZUMO yordamchi" — FAQAT ZUMO bazasi bo'yicha: tovar, usta/xizmat, joy topib beradi
// va ilovadan foydalanishda yordam beradi. Umumiy savollar uchun — ZUMO AI sahifasi (/ai-assistant).
import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { sendAIMessage } from '../services/aiChat';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
// Markdown kutubxonasi og'ir — chat ochilib, birinchi javob chiqqanda yuklanadi
const AiMarkdown = lazy(() => import('./AiMarkdown'));
import { T } from '../utils/T';
import '../../styles/aiChat.css';

const MAX_INPUT = 1500;
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
      content: T('Salom! Men ZUMO yordamchisiman. Nima izlayotganingizni va byudjetingizni yozing — ZUMO’dan eng mosini topib beraman.'),
    },
  ]);

  const messagesEndRef = useRef(null);

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
      setMessages((prev) => [...prev, { role: 'assistant', content: data?.reply || T('Javob topilmadi.'), cards: data?.cards || [] }]);
    } catch (error) {
      // Limit yoki boshqa xatoda server tushunarli matn qaytaradi
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: error.response?.data?.reply || error.response?.data?.error || T('Server bilan bog\'lanishda xatolik yuz berdi.') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onlyGreeting = messages.length === 1;

  return (
    <>
      <button
        className={`ai-chat-toggle ${hideToggle && !isOpen ? 'ai-chat-toggle--hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label={T('ZUMO yordamchi')}
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="ai-chat-modal" role="dialog" aria-label={T('ZUMO yordamchi')}>
          <div className="ai-chat-header">
            <h3>{T('ZUMO yordamchi')}</h3>
            <button className="ai-chat-close" onClick={() => setIsOpen(false)} aria-label={T('Yopish')}>
              <X size={20} />
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index}>
                <div className={`ai-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                  <div className="ai-message-bubble">
                    {msg.role === 'assistant'
                      ? <Suspense fallback={<span className="ai-md">{msg.content}</span>}><AiMarkdown>{msg.content}</AiMarkdown></Suspense>
                      : msg.content}
                  </div>
                </div>

                {msg.cards?.length > 0 && (
                  <div className="ai-suggestions-grid">
                    {msg.cards.map((card) => (
                      <Link key={`${card.type}-${card.id}`} to={card.link} className="ai-suggestion-card" onClick={() => setIsOpen(false)}>
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
            ))}

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
