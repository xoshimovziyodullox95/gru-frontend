import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- qo'shildi
import { ArrowLeft, Plus, Send, Paperclip, Sparkles, Menu, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import '../../styles/aiAssistant.css';

export default function AIAssistantPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation(); // <-- qo'shildi

  const userName = user?.user_metadata?.full_name || '';
  const avatarUrl = user?.user_metadata?.avatar_url || '';
  const initials = userName ? userName.trim().charAt(0).toUpperCase() : 'U';

  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthToken(session?.access_token || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_BASE = '/api/gru-ai';
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  const isEmpty = messages.length === 0;

  useEffect(() => {
    if (authToken) fetchChats();
  }, [authToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchChats() {
    setLoadingChats(true);
    try {
      const res = await fetch(`${API_BASE}/chats`, { headers: authHeaders });
      const data = await res.json();
      setChats(data.chats || []);
    } catch (err) {
      console.error('Chatlarni yuklashda xato:', err);
    } finally {
      setLoadingChats(false);
    }
  }

  async function openChat(chatId) {
    setActiveChatId(chatId);
    setMessages([]);
    setSidebarOpen(false);
    try {
      const res = await fetch(`${API_BASE}/chats/${chatId}`, { headers: authHeaders });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Chatni ochishda xato:', err);
    }
  }

  function startNewChat() {
    setActiveChatId(null);
    setMessages([]);
    setInput('');
    setFiles([]);
    setSidebarOpen(false);
  }

  function handleFileSelect(e) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function sendMessage() {
    if (!input.trim() && files.length === 0) return;
    if (!authToken) {
      console.warn('Token hali tayyor emas, biroz kuting va qayta urinib ko\'ring.');
      return;
    }
    setLoading(true);

    const userMsg = {
      role: 'user',
      text: input,
      attachments: files.map((f) => ({ name: f.name, mimeType: f.type })),
    };
    setMessages((prev) => [...prev, userMsg]);

    const currentInput = input;
    const currentFiles = files;
    setInput('');
    setFiles([]);

    try {
      let chatId = activeChatId;

      if (!chatId) {
        const createRes = await fetch(`${API_BASE}/chats`, {
          method: 'POST',
          headers: authHeaders,
        });
        const created = await createRes.json();
        chatId = created._id;
        setActiveChatId(chatId);
      }

      const formData = new FormData();
      formData.append('text', currentInput);
      currentFiles.forEach((f) => formData.append('files', f));

      const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      fetchChats();
    } catch (err) {
      console.error('Xabar yuborishda xato:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: t('aiAssistant.errorMessage') },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const inputBar = (
    <div className="gru-ai-input-row">
      <button
        className="gru-ai-icon-btn"
        onClick={() => fileInputRef.current?.click()}
        title={t('aiAssistant.fileAttach')}
      >
        <Paperclip size={18} />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        hidden
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
      />

      <textarea
        className="gru-ai-textarea"
        placeholder={t('aiAssistant.placeholder')}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />

      <button
        className="gru-ai-send-btn"
        onClick={sendMessage}
        disabled={loading || !authToken || (!input.trim() && files.length === 0)}
      >
        <Send size={18} />
      </button>
    </div>
  );

  return (
    <div className="gru-ai-page">
      {/* ===== SIDEBAR ===== */}
      <aside className={`gru-ai-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="gru-ai-brand">
          <span className="gru-ai-brand-mark">{t('aiAssistant.brand')}</span>
          <span className="gru-ai-brand-sub">{t('aiAssistant.brandSub')}</span>
        </div>

        <button className="gru-ai-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> {t('aiAssistant.backHome')}
        </button>

        <button className="gru-ai-new-chat-btn" onClick={startNewChat}>
          <Plus size={16} /> {t('aiAssistant.newChat')}
        </button>

        <div className="gru-ai-chat-list">
          {loadingChats && <p className="gru-ai-sidebar-hint">{t('aiAssistant.loadingChats')}</p>}
          {!loadingChats && chats.length === 0 && (
            <p className="gru-ai-sidebar-hint">{t('aiAssistant.noChats')}</p>
          )}
          {chats.map((c) => (
            <button
              key={c._id}
              className={`gru-ai-chat-item ${activeChatId === c._id ? 'active' : ''}`}
              onClick={() => openChat(c._id)}
            >
              {c.title || t('aiAssistant.newChatTitle')}
            </button>
          ))}
        </div>

        {/* ===== PASTKI AKKAUNT QATORI ===== */}
        <button className="gru-ai-account-row" onClick={() => navigate('/profile')}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="gru-ai-account-avatar" />
          ) : (
            <span className="gru-ai-account-avatar gru-ai-account-avatar-fallback">
              {initials}
            </span>
          )}
          <span className="gru-ai-account-name">{userName || t('aiAssistant.accountName')}</span>
          <Settings size={16} className="gru-ai-account-gear" />
        </button>
      </aside>

      {sidebarOpen && (
        <div className="gru-ai-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="gru-ai-main">
        <header className="gru-ai-header">
          <button className="gru-ai-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="gru-ai-header-title">
            <Sparkles size={18} />
            <span>{t('aiAssistant.title')}</span>
          </div>
          <div style={{ width: 36 }} />
        </header>

        {isEmpty ? (
          /* ===== BO'SH HOLAT ===== */
          <div className="gru-ai-landing">
            <div className="gru-ai-landing-glow" />
            <Sparkles size={40} className="gru-ai-landing-icon" />
            <h1 className="gru-ai-landing-title">
              {userName
                ? t('aiAssistant.welcomeTitle', { name: `, ${userName}` })
                : t('aiAssistant.welcomeTitle', { name: '' })}
            </h1>
            <p className="gru-ai-landing-sub">{t('aiAssistant.welcomeSub')}</p>
            <div className="gru-ai-landing-input">{inputBar}</div>
          </div>
        ) : (
          <>
            <div className="gru-ai-messages">
              {messages.map((m, idx) => (
                <div key={idx} className={`gru-ai-message ${m.role}`}>
                  <div className="gru-ai-bubble">
                    {m.text}
                    {m.attachments?.length > 0 && (
                      <div className="gru-ai-attachments">
                        {m.attachments.map((a, i) => (
                          <span key={i} className="gru-ai-attachment-chip">
                            📎 {a.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="gru-ai-message assistant">
                  <div className="gru-ai-bubble gru-ai-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="gru-ai-input-area">
              <div className="gru-ai-input-inner">
                {files.length > 0 && (
                  <div className="gru-ai-file-preview">
                    {files.map((f, i) => (
                      <span key={i} className="gru-ai-attachment-chip removable">
                        📎 {f.name}
                        <button onClick={() => removeFile(i)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                {inputBar}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}