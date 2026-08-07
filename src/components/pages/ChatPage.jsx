import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- qo'shildi
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import {
  getConversations,
  getMessages,
  sendMessage,
  sendMedia,
  markAsRead,
  replyMessage,
  editMessage,
  deleteMessage
} from '../services/chat';
import { getAllUsers } from '../services/user';
import {
  Send, ArrowLeft, Search, X, MapPin,
  Smile, Reply, Check, CheckCheck, Paperclip,
  MoreVertical, MessageSquare, Loader2, Inbox,
  Pencil, Trash2, Copy, Volume2, VolumeX, PlayCircle
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import '../../styles/chat.css';

const MEDIA_BASE = 'http://localhost:5000';
const LOCATION_PREFIX = 'LOC::';

// ===== Ovoz: bitta umumiy AudioContext =====
let sharedAudioCtx = null;
function getAudioCtx() {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

function playDing() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function isLocationMessage(text) {
  return typeof text === 'string' && text.startsWith(LOCATION_PREFIX);
}

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(); // <-- qo'shildi
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineStatus, setOnlineStatus] = useState({});
  const [sendingMedia, setSendingMedia] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('chat_muted') === '1');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const isMutedRef = useRef(isMuted);
  const activeChatRef = useRef(activeChat);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  const notify = () => {
    if (!isMutedRef.current) playDing();
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('chat_muted', next ? '1' : '0');
      return next;
    });
  };

  // 🆕 getPreviewText – tarjima qilingan
  const getPreviewText = (msg) => {
    if (msg.mediaType === 'image') return t('chat.sentImage');
    if (msg.mediaType === 'video') return t('chat.sentVideo');
    if (isLocationMessage(msg.message)) return t('chat.sentLocation');
    return msg.message?.substring(0, 30) || t('chat.newMessage');
  };

  // 🆕 getMediaLabel – tarjima qilingan
  const getMediaLabel = (type) => {
    if (type === 'image') return t('chat.mediaImage');
    if (type === 'video') return t('chat.mediaVideo');
    return t('chat.mediaFile');
  };

  // 🆕 getStatusText – tarjima qilingan
  const getStatusText = (userId) => {
    const status = onlineStatus[userId];
    if (!status) return '';
    if (status.isOnline) return t('chat.online');
    if (status.lastSeen) {
      const d = new Date(status.lastSeen);
      const now = new Date();
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60) return t('chat.secondsAgo', { seconds: diff });
      if (diff < 3600) return t('chat.minutesAgo', { minutes: Math.floor(diff / 60) });
      if (diff < 86400) return t('chat.hoursAgo', { hours: Math.floor(diff / 3600) });
      return d.toLocaleDateString();
    }
    return t('chat.offline');
  };

  // 🆕 getStatusIcon – xabar holati uchun
  const getStatusIcon = (msg) => {
    if (msg.isRead) return <CheckCheck size={14} />;
    return <Check size={14} />;
  };

  // 🆕 formatTime – o'zgarishsiz
  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ... (qolgan barcha useEffect va funksiyalar o'zgarmaydi, faqat t() qo'shiladi)

  // Birinchi bosishda AudioContext'ni "unlock" qilamiz
  useEffect(() => {
    const unlock = () => {
      try {
        const ctx = getAudioCtx();
        if (ctx && ctx.state === 'suspended') ctx.resume();
      } catch (e) {}
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  // Brauzer bildirishnomasi uchun ruxsat so'raymiz
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Socket ulanishi
  useEffect(() => {
    if (!user) return;
    const s = io('http://localhost:5000', { transports: ['websocket'] });
    s.emit('register', user.id);
    setSocket(s);

    s.on('user_online', ({ userId, isOnline }) => {
      setOnlineStatus(prev => ({
        ...prev,
        [userId]: { isOnline, lastSeen: isOnline ? null : new Date() }
      }));
      setConversations(prev =>
        prev.map(c => c.userId === userId ? { ...c, isOnline } : c)
      );
    });

    s.on('user_typing', ({ from }) => setTypingUsers(prev => ({ ...prev, [from]: true })));
    s.on('user_stop_typing', ({ from }) => setTypingUsers(prev => ({ ...prev, [from]: false })));

    return () => s.close();
  }, [user]);

  // Edit / delete / read real-time hodisalari
  useEffect(() => {
    if (!socket) return;
    const onEdited = ({ messageId, message }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, message, edited: true } : m));
    };
    const onDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };
    const onRead = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isRead: true } : m));
    };
    socket.on('message_edited', onEdited);
    socket.on('message_deleted', onDeleted);
    socket.on('message_read', onRead);
    return () => {
      socket.off('message_edited', onEdited);
      socket.off('message_deleted', onDeleted);
      socket.off('message_read', onRead);
    };
  }, [socket]);

  // Suhbatlar va userlarni yuklash
  useEffect(() => {
    if (!user) return;
    Promise.all([getConversations(), getAllUsers()])
      .then(([convRes, usersRes]) => {
        setConversations(convRes.data);
        setAllUsers(usersRes.data);
        const statusMap = {};
        convRes.data.forEach(c => {
          statusMap[c.userId] = { isOnline: c.isOnline, lastSeen: c.lastSeen };
        });
        setOnlineStatus(statusMap);

        if (targetUserId) {
          const found = convRes.data.find(c => c.userId === targetUserId);
          if (found) setActiveChat(found);
          else {
            const userInfo = usersRes.data.find(u => u._id === targetUserId);
            setActiveChat({
              userId: targetUserId,
              fullName: userInfo?.fullName || 'Foydalanuvchi',
              avatar: userInfo?.avatar_url || '/images/placeholder.jpg',
            });
          }
        }
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [user, targetUserId]);

  // Xabarlarni yuklash
 // Xabarlarni yuklash
useEffect(() => {
  if (!activeChat) return;
  getMessages(activeChat.userId)
    .then(res => {
      setMessages(res.data);
      const unreadIds = res.data
        .filter(m => m.to === user.id && !m.isRead)   // ← MANA SHU 2 QATORNI
        .map(m => m._id);                              // ← ALMASHTIRING
      if (unreadIds.length > 0) {
        Promise.all(unreadIds.map(id => markAsRead(id))).then(() => {
          setConversations(prev =>
            prev.map(c => c.userId === activeChat.userId ? { ...c, unread: 0 } : c)
          );
          window.dispatchEvent(new Event('chatRead'));
        });
      }
    })
    .catch(console.error);
}, [activeChat, user.id]);

  // Xabar qabul qilish
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const fromId = msg.from?._id?.toString() || msg.from?.toString();
      const currentActive = activeChatRef.current;
      const activeId = currentActive?.userId?.toString();
      const isActiveChat = currentActive && fromId === activeId;

      notify();

      if (isActiveChat) {
        setMessages(prev => [...prev, { ...msg, _id: msg._id || Date.now() }]);
        if (msg._id && !msg.isRead) {
          markAsRead(msg._id).then(() => {
            setConversations(prev =>
              prev.map(c => c.userId === activeId ? { ...c, unread: 0 } : c)
            );
            window.dispatchEvent(new Event('chatRead'));
          });
        }
      } else {
        getConversations().then(res => {
          setConversations(res.data);
          const senderConv = res.data.find(c => c.userId === fromId);
          const senderName = senderConv?.fullName || t('chat.newMessage');
          const senderAvatar = senderConv?.avatar || '/images/placeholder.jpg';

          toast(`${senderName}: ${getPreviewText(msg)}`, { icon: <MessageSquare size={16} /> });

          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            try {
              const n = new Notification(senderName, {
                body: getPreviewText(msg),
                icon: senderAvatar,
                tag: `chat-${fromId}`
              });
              n.onclick = () => {
                window.focus();
                navigate(`/chat?userId=${fromId}`);
                n.close();
              };
            } catch (e) {}
          }
        });
        window.dispatchEvent(new Event('chatReceived'));
      }
    };

    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [socket, navigate, t]);

  // Faqat chat oynasi ichida pastga scroll qilish
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Menyudan tashqariga bosilsa yopiladi
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.msg-menu-wrap')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lightbox uchun Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Typing
  const handleTyping = () => {
    if (!socket || !activeChat) return;
    socket.emit('typing', { from: user.id, to: activeChat.userId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { from: user.id, to: activeChat.userId });
    }, 1500);
  };

  // Matnli xabar yuborish
  const send = async () => {
    if (!newMessage.trim() || !activeChat) return;
    const msgText = newMessage;
    setNewMessage('');
    socket?.emit('stop_typing', { from: user.id, to: activeChat.userId });

    try {
      const res = await sendMessage({ to: activeChat.userId, message: msgText });
      setMessages(prev => [...prev, res.data]);
      setConversations(prev => {
        const exists = prev.find(c => c.userId === activeChat.userId);
        if (exists) {
          return prev.map(c => c.userId === activeChat.userId
            ? { ...c, lastMessage: msgText, lastMessageTime: res.data.createdAt }
            : c);
        }
        return [{ userId: activeChat.userId, fullName: activeChat.fullName, avatar: activeChat.avatar, lastMessage: msgText, lastMessageTime: res.data.createdAt, unread: 0, isOnline: false }, ...prev];
      });
    } catch (err) {
      toast.error(t('chat.errors.sendMessage'));
      setNewMessage(msgText);
    }
  };

  // Bitta media yuborish
  const handleSendMedia = async () => {
    if (!mediaPreview || !activeChat) return;
    setSendingMedia(true);
    try {
      const res = await sendMedia(activeChat.userId, mediaPreview.file);
      setMessages(prev => [...prev, res.data]);
      setMediaPreview(null);
    } catch (err) {
      toast.error(t('chat.errors.sendMedia'));
    } finally {
      setSendingMedia(false);
    }
  };

  // Bir nechta fayl yuborish
  const handleMultipleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !activeChat) return;
    setSendingMedia(true);
    for (const file of files) {
      try {
        const res = await sendMedia(activeChat.userId, file);
        setMessages(prev => [...prev, res.data]);
      } catch (err) {
        toast.error(t('chat.errors.sendMedia'));
      }
    }
    setSendingMedia(false);
    e.target.value = '';
  };

  // Joylashuv yuborish
  const sendLocation = () => {
    if (!activeChat) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const msg = `${LOCATION_PREFIX}${url}`;
        sendMessage({ to: activeChat.userId, message: msg })
          .then(res => setMessages(prev => [...prev, res.data]))
          .catch(() => toast.error(t('chat.errors.sendLocation')));
      },
      () => toast.error(t('chat.errors.getLocation'))
    );
  };

  // Reply
  const handleReply = (msg) => {
    setEditingMessage(null);
    setReplyTo(msg);
    setOpenMenuId(null);
    setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
  };

  const sendReply = async () => {
    if (!replyTo || !newMessage.trim()) return;
    try {
      const res = await replyMessage(replyTo._id, newMessage);
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      setReplyTo(null);
    } catch (err) {
      toast.error(t('chat.errors.sendMessage'));
    }
  };

  // Copy
  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg.message || '');
    toast.success(t('chat.copied'));
    setOpenMenuId(null);
  };

  // Edit
  const handleEditStart = (msg) => {
    setReplyTo(null);
    setEditingMessage(msg);
    setNewMessage(msg.message || '');
    setOpenMenuId(null);
    setTimeout(() => document.getElementById('chat-input')?.focus(), 50);
  };

  const handleEditCancel = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleEditSave = async () => {
    if (!editingMessage || !newMessage.trim()) return;
    try {
      await editMessage(editingMessage._id, newMessage);
      setMessages(prev =>
        prev.map(m => m._id === editingMessage._id ? { ...m, message: newMessage, edited: true } : m)
      );
      setEditingMessage(null);
      setNewMessage('');
    } catch (err) {
      toast.error(t('chat.errors.editMessage'));
    }
  };

  // Delete
  const handleDelete = async (msg) => {
    setOpenMenuId(null);
    if (!window.confirm(t('chat.deleteConfirm'))) return;
    try {
      await deleteMessage(msg._id);
      setMessages(prev => prev.filter(m => m._id !== msg._id));
    } catch (err) {
      toast.error(t('chat.errors.deleteMessage'));
    }
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <Loader2 size={26} className="spin" /> {t('chat.loading')}
      </div>
    );
  }

  return (
    <>
      <div className="chat-container">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-title">
            <MessageSquare size={20} /> {t('chat.sidebarTitle')}
          </div>
          <div className="chat-search">
            <Search size={16} />
            <input
              type="text"
              placeholder={t('chat.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm ? (
            filteredUsers.length === 0 ? (
              <div className="chat-empty-sidebar">
                <Search size={24} />
                <span>{t('chat.noUserFound')}</span>
              </div>
            ) : (
              filteredUsers.map(u => (
                <div
                  key={u._id}
                  className={`chat-user ${activeChat?.userId === u._id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChat({
                      userId: u._id,
                      fullName: u.fullName || u.email,
                      avatar: u.avatar_url || '/images/placeholder.jpg'
                    });
                    setSearchTerm('');
                  }}
                >
                  <div className="avatar-wrap">
                    <img src={u.avatar_url || '/images/placeholder.jpg'} alt="" />
                    {onlineStatus[u._id]?.isOnline && <span className="online-dot" />}
                  </div>
                  <div className="chat-user-info">
                    <div className="chat-user-name">{u.fullName || u.email}</div>
                    <div className="chat-user-last">{u.email}</div>
                  </div>
                </div>
              ))
            )
          ) : conversations.length === 0 ? (
            <div className="chat-empty-sidebar">
              <Inbox size={28} />
              <span>{t('chat.noConversations')}</span>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.userId}
                className={`chat-user ${activeChat?.userId === conv.userId ? 'active' : ''} ${conv.unread > 0 ? 'has-unread' : ''}`}
                onClick={() => setActiveChat(conv)}
              >
                <div className="avatar-wrap">
                  <img src={conv.avatar} alt="" />
                  {(onlineStatus[conv.userId]?.isOnline ?? conv.isOnline) && <span className="online-dot" />}
                </div>
                <div className="chat-user-info">
                  <div className="chat-user-name">{conv.fullName}</div>
                  <div className="chat-user-last">
                    {isLocationMessage(conv.lastMessage) ? (
                      <span className="last-msg-icon"><MapPin size={12} /> {t('chat.location')}</span>
                    ) : (
                      conv.lastMessage?.substring(0, 30)
                    )}
                  </div>
                </div>
                {conv.unread > 0 && <span className="unread-dot" />}
              </div>
            ))
          )}
        </div>

        {/* Asosiy chat */}
        <div className="chat-main">
          {activeChat ? (
            <>
              <div className="chat-header">
                <button className="chat-back" onClick={() => navigate(-1)}>
                  <ArrowLeft size={20} />
                </button>
                <div className="avatar-wrap">
                  <img src={activeChat.avatar} alt="" />
                  {(onlineStatus[activeChat.userId]?.isOnline) && <span className="online-dot" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="chat-header-name">{activeChat.fullName}</div>
                  <div className="chat-header-status">
                    {typingUsers[activeChat.userId] ? (
                      <span className="typing-indicator">
                        <span></span><span></span><span></span> {t('chat.typing')}
                      </span>
                    ) : (
                      getStatusText(activeChat.userId)
                    )}
                  </div>
                </div>
                <button className="chat-header-btn" onClick={toggleMute} title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}>
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button className="chat-more-btn"><MoreVertical size={20} /></button>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <Inbox size={30} />
                    <span>{t('chat.noMessages')}</span>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const senderId = msg.from?._id?.toString() || msg.from?.toString();
                    const isSent = senderId === user.id;
                    const isReply = msg.replyTo;
                    const isLocation = isLocationMessage(msg.message);
                    const canEdit = isSent && msg.message && !isLocation && !msg.mediaUrl;
                    const menuId = msg._id || i;

                    return (
                      <div key={menuId} className={`message-row ${isSent ? 'sent' : 'received'}`}>
                        <div className="message-wrapper">
                          {isReply && (
                            <div className="reply-indicator">
                              <Reply size={12} />
                              <span>{msg.replyTo?.message || t('chat.newMessage')}</span>
                            </div>
                          )}
                          <div
                            className={`message-bubble ${isSent ? 'sent' : 'received'}`}
                            onDoubleClick={() => handleReply(msg)}
                          >
                            {msg.mediaUrl && msg.mediaType === 'image' && (
                              <div
                                className="chat-media-wrap"
                                onClick={() => setLightbox({ url: `${MEDIA_BASE}${msg.mediaUrl}`, type: 'image' })}
                              >
                                <img
                                  src={`${MEDIA_BASE}${msg.mediaUrl}`}
                                  alt={t('chat.mediaImage')}
                                  className="chat-media-img"
                                />
                              </div>
                            )}
                            {msg.mediaUrl && msg.mediaType === 'video' && (
                              <div
                                className="chat-media-wrap chat-video-wrap"
                                onClick={() => setLightbox({ url: `${MEDIA_BASE}${msg.mediaUrl}`, type: 'video' })}
                              >
                                <video src={`${MEDIA_BASE}${msg.mediaUrl}`} muted className="chat-media-video" />
                                <div className="video-play-overlay"><PlayCircle size={40} /></div>
                              </div>
                            )}
                            {isLocation ? (
                              <a
                                href={msg.message.replace(LOCATION_PREFIX, '')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="location-card"
                              >
                                <div className="location-icon"><MapPin size={18} /></div>
                                <div className="location-text">
                                  <strong>{t('chat.location')}</strong>
                                  <span>{t('chat.viewOnMap')}</span>
                                </div>
                              </a>
                            ) : (
                              msg.message && <p className="message-text">{msg.message}</p>
                            )}
                            <div className="message-footer">
                              {msg.edited && <span className="edited-label">{t('chat.edited')}</span>}
                              <span className="message-time">{formatTime(msg.createdAt)}</span>
                              {isSent && (
                                <span className="message-status">
                                  {msg.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="msg-menu-wrap">
                            <button
                              className={`msg-menu-btn ${openMenuId === menuId ? 'open' : ''}`}
                              onClick={() => setOpenMenuId(openMenuId === menuId ? null : menuId)}
                            >
                              <MoreVertical size={14} />
                            </button>
                            {openMenuId === menuId && (
                              <div className="msg-menu">
                                <button onClick={() => handleReply(msg)}>
                                  <Reply size={14} /> {t('chat.reply')}
                                </button>
                                {msg.message && !isLocation && (
                                  <button onClick={() => handleCopy(msg)}>
                                    <Copy size={14} /> {t('chat.copy')}
                                  </button>
                                )}
                                {canEdit && (
                                  <button onClick={() => handleEditStart(msg)}>
                                    <Pencil size={14} /> {t('chat.edit')}
                                  </button>
                                )}
                                {isSent && (
                                  <button className="danger" onClick={() => handleDelete(msg)}>
                                    <Trash2 size={14} /> {t('chat.delete')}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {editingMessage && (
                <div className="reply-bar edit-bar">
                  <div className="reply-bar-content">
                    <Pencil size={16} />
                    <span>{t('chat.editMessage')}</span>
                  </div>
                  <button className="reply-bar-close" onClick={handleEditCancel}>
                    <X size={18} />
                  </button>
                </div>
              )}

              {replyTo && !editingMessage && (
                <div className="reply-bar">
                  <div className="reply-bar-content">
                    <Reply size={16} />
                    <span>{t('chat.replyTo', { text: replyTo.message?.substring(0, 40) })}</span>
                  </div>
                  <button className="reply-bar-close" onClick={() => setReplyTo(null)}>
                    <X size={18} />
                  </button>
                </div>
              )}

              {mediaPreview && (
                <div className="chat-media-preview">
                  <button className="preview-close" onClick={() => setMediaPreview(null)}>
                    <X size={18} />
                  </button>
                  {mediaPreview.type === 'image'
                    ? <img src={mediaPreview.url} alt="preview" />
                    : <video src={mediaPreview.url} controls />}
                  <button
                    className="preview-send"
                    onClick={handleSendMedia}
                    disabled={sendingMedia}
                  >
                    {sendingMedia ? t('chat.sending') : t('chat.send')}
                  </button>
                </div>
              )}

              <div className="chat-input">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleMultipleFiles}
                />
                <button className="chat-media-btn" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={20} />
                </button>
                <button className="chat-media-btn" onClick={sendLocation}>
                  <MapPin size={20} />
                </button>
                <button className="chat-media-btn" onClick={() => setShowEmoji(!showEmoji)}>
                  <Smile size={20} />
                </button>

                {showEmoji && (
                  <div className="emoji-picker-wrapper">
                    <EmojiPicker
                      onEmojiClick={(emoji) => {
                        setNewMessage(prev => prev + emoji.emoji);
                        setShowEmoji(false);
                      }}
                    />
                  </div>
                )}

                <input
                  id="chat-input"
                  type="text"
                  placeholder={
                    editingMessage
                      ? t('chat.editMessage')
                      : replyTo
                        ? t('chat.replyPlaceholder')
                        : t('chat.messagePlaceholder')
                  }
                  value={newMessage}
                  onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (editingMessage) handleEditSave();
                      else if (replyTo) sendReply();
                      else send();
                    }
                    if (e.key === 'Escape' && editingMessage) handleEditCancel();
                  }}
                />
                <button
                  onClick={editingMessage ? handleEditSave : (replyTo ? sendReply : send)}
                  disabled={!newMessage.trim()}
                >
                  {editingMessage ? <Check size={20} /> : <Send size={20} />}
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty">
              <MessageSquare size={32} />
              <span>{t('chat.selectChat')}</span>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            <X size={24} />
          </button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            {lightbox.type === 'image' ? (
              <img src={lightbox.url} alt="" />
            ) : (
              <video src={lightbox.url} controls autoPlay />
            )}
          </div>
        </div>
      )}
    </>
  );
}