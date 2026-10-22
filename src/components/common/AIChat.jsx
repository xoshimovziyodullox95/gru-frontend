import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send } from 'lucide-react';
import { sendAIMessage } from '../services/aiChat';
import '../../styles/aiChat.css';
import { formatPrice } from '../utils/formatPrice';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Salom! Men ZUMO AI yordamchisiman. Nima kerak?"
    }
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
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const data = await sendAIMessage(updatedMessages);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data?.reply || 'Javob topilmadi.',
          cards: data?.cards || []
        }
      ]);
    } catch (error) {
      console.error(error);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Server bilan bog'lanishda xatolik yuz berdi."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={`ai-chat-toggle ${hideToggle && !isOpen ? 'ai-chat-toggle--hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="ZUMO AI yordamchi"
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="ai-chat-modal">
          <div className="ai-chat-header">
            <h3>ZUMO AI</h3>

            <button
              className="ai-chat-close"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index}>
                <div
                  className={`ai-message ${
                    msg.role === 'user'
                      ? 'user'
                      : 'assistant'
                  }`}
                >
                  <div className="ai-message-bubble">
                    {msg.content}
                  </div>
                </div>

                {/* 🔥 Klass nomlari endi aiChat.css bilan mos:
                    ai-suggestions-grid / ai-suggestion-card / ai-suggestion-info */}
                {msg.cards?.length > 0 && (
                  <div className="ai-suggestions-grid">
                    {msg.cards.map(card => (
                      <Link
                        key={card.id}
                        to={card.link}
                        className="ai-suggestion-card"
                      >
                        <img
                          src={card.image}
                          alt={card.title}
                          onError={(e) => {
                            e.target.src = '/images/zumo-placeholder.svg';
                          }}
                        />

                        <div className="ai-suggestion-info">
                          <h4>{card.title}</h4>

                          {typeof card.price === 'number' && (
                            // Eski: <span className="price">${card.price}</span>
<span className="price">{formatPrice(card.price, card.currency)}</span>
                          )}
                          {typeof card.price === 'string' && card.price && (
                            // Eski: <span className="price">${card.price}</span>
<span className="price">{formatPrice(card.price, card.currency)}</span>
                          )}

                          {card.address && (
                            <span className="address">{card.address}</span>
                          )}

                          <button type="button" className="ai-suggestion-btn">
                            Batafsil
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-message assistant">
                <div className="ai-message-bubble">
                  Yozmoqda...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input-area">
            <input
              type="text"
              value={input}
              placeholder="Xabar yozing..."
              className="ai-chat-input"
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
            />

            <button
              className="ai-chat-send"
              onClick={handleSend}
              disabled={loading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}