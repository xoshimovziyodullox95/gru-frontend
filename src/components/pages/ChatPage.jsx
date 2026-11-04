import { safeGoBack } from '../utils/navigation.js';
// src/components/pages/ChatPage.jsx
/* ============================================================
   CHAT PAGE — Telegram uslubida (REEL SHARE + POST DETAIL)
   ============================================================ */

import { lazy, Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import EmptyState from '../common/EmptyState';
import { REEL_SOURCES, buildReels } from '../utils/reelBuilder';
// Reels pleyeri og'ir — faqat chatda reels bosilganda yuklanadi
const MarketplaceReels = lazy(() => import('../marketplace/MarketplaceReels'));
import { useAuth } from '../context/AuthContext';
import { getSocket, registerSocketUser } from '../services/socket';
import { playDing, unlockAudio } from '../services/chatSound';
import {
  getConversations,
  getMessages,
  sendMessage,
  sendMedia,
  sendVoice,
  reactMessage,
  forwardMessage,
  markChatRead,
  replyMessage,
  editMessage,
  deleteMessage,
  getChatMe,
} from '../services/chat';
import { getAllUsers } from '../services/user';
import {
  Send, ArrowLeft, Search, X, MapPin,
  Smile, Reply, Check, CheckCheck, Paperclip,
  MoreVertical, MessageSquare, Loader2, Inbox, Palette, Image as ImageIcon,
  Pencil, Trash2, Copy, Volume2, VolumeX, PlayCircle,
  ExternalLink, Film, Package, Mic, Square, Forward, Pause,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import '../../styles/chat.css';

import { T } from '../utils/T';
import { getImageUrl } from '../utils/imageUrl';
const LOCATION_PREFIX = 'LOC::';
const REEL_PREFIX = 'REEL::';
const LISTING_PREFIX = 'LISTING::';

/* ============================================================
   YORDAMCHI FUNKSIYALAR
   ============================================================ */

function isLocationMessage(text) {
  return typeof text === 'string' && text.startsWith(LOCATION_PREFIX);
}

function isReelMessage(text) {
  return typeof text === 'string' && text.startsWith(REEL_PREFIX);
}

function isSharedListingMessage(text) {
  return typeof text === 'string' && text.startsWith(LISTING_PREFIX);
}

function parseSharedListingMessage(text) {
  const parts = text.slice(LISTING_PREFIX.length).split('::');
  const decode = (value) => {
    try { return decodeURIComponent(value || ''); } catch { return value || ''; }
  };
  return {
    listingType: decode(parts[0]),
    url: decode(parts[1]),
    title: decode(parts[2]) || T('E’lon'),
    thumbnail: decode(parts[3]),
    price: decode(parts[4]),
    note: decode(parts[5]),
  };
}

function buildListingDraftMessage({ type, id, title, thumbnail, price, note }) {
  const routeByType = {
    equipment: 'equipment',
    location: 'location',
    serviceprovider: 'service-provider',
  };
  const route = routeByType[type];
  if (!route || !id || !title) return '';
  const parts = [type, `/${route}/${encodeURIComponent(id)}`, title, thumbnail, price, note];
  return `${LISTING_PREFIX}${parts.map((part) => encodeURIComponent(part || '')).join('::')}`;
}

function setListingMessageNote(message, note) {
  if (!isSharedListingMessage(message)) return message;
  const parts = message.slice(LISTING_PREFIX.length).split('::');
  while (parts.length < 5) parts.push('');
  parts[5] = encodeURIComponent(note || '');
  return `${LISTING_PREFIX}${parts.slice(0, 5).join('::')}::${parts[5]}`;
}

function parseReelMessage(text) {
  const body = text.slice(REEL_PREFIX.length);
  const parts = body.split('::');

  const safeDecode = (v) => {
    try {
      return decodeURIComponent(v || '');
    } catch {
      return v || '';
    }
  };

  return {
    url: parts[0] || '',
    title: safeDecode(parts[1]) || T('Video'),
    thumbnail: safeDecode(parts[2]) || '',
    // Muqovasi yo'q reels uchun — videoning o'zidan kadr (eski xabarlarda bo'lmaydi)
    video: safeDecode(parts[3]) || '',
  };
}

function toIdStr(value) {
  if (!value) return '';
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    return String(value);
  }
  return String(value);
}

function previewOf(msg) {
  if (msg.mediaType === 'image') return T('📷 Rasm yuborildi');
  if (msg.mediaType === 'video') return T('🎥 Video yuborildi');
  if (isLocationMessage(msg.message)) return '📍 Joylashuv';
  if (isReelMessage(msg.message)) return T('🎬 Video ulashildi');
  if (isSharedListingMessage(msg.message)) return T('📦 E’lon: {{title}}', { title: parseSharedListingMessage(msg.message).title });
  return msg.message?.substring(0, 40) || T('Yangi xabar');
}

/* ============================================================
   REEL MESSAGE CARD — YouTube uslubida (FIXED navigate)
   ============================================================ */

function ReelMessageCard({ text, onOpenReel }) {
  const navigate = useNavigate();
  const { url, title, thumbnail, video } = parseReelMessage(text);
  const [thumbFailed, setThumbFailed] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!url) return;
    // Ichki havola — ilova ichida (reels/post sahifasi); faqat YouTube va boshqa saytlar brauzerda
    const path = internalPath(url);
    if (path && onOpenReel) onOpenReel({ path, video, title, thumbnail });
    else if (path) navigate(path);
    else if (/^https?:\/\//.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Reels formatida: tik (9:16) kartochka, pastda nom — Instagram'da ulashilgan reels kabi
  return (
    <div
      className="tg-reel-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(e); }}
    >
      <div className="tg-reel-card__thumb">
        {thumbnail && !thumbFailed ? (
          <img src={thumbnail} alt={title} onError={() => setThumbFailed(true)} />
        ) : video ? (
          <video src={`${getImageUrl(video)}#t=0.5`} muted playsInline preload="metadata" poster={TRANSPARENT_POSTER} />
        ) : (
          <div className="tg-reel-card__placeholder"><Film size={36} /></div>
        )}
        <span className="tg-reel-card__badge"><Film size={12} /> Reels</span>
        <span className="tg-reel-card__play-icon"><PlayCircle size={44} /></span>
        <div className="tg-reel-card__info">
          <strong>{title}</strong>
          <span className="tg-reel-card__open"><ExternalLink size={12} /> {T('Ochish')}</span>
        </div>
      </div>
    </div>
  );
}

function SharedListingMessageCard({ text }) {
  const navigate = useNavigate();
  const { url, title, thumbnail, price, listingType, note } = parseSharedListingMessage(text);
  const [thumbFailed, setThumbFailed] = useState(false);
  const openListing = (event) => {
    event.stopPropagation();
    const path = internalPath(url);
    if (path) navigate(path);
    else if (url.startsWith('https://') || url.startsWith('http://')) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button type="button" className="tg-shared-listing-card" onClick={openListing}>
      {thumbnail && !thumbFailed ? (
        <img src={thumbnail} alt="" onError={() => setThumbFailed(true)} />
      ) : <span className="tg-shared-listing-card__placeholder">📦</span>}
      <span className="tg-shared-listing-card__info">
        <small>{listingType === 'serviceprovider' ? 'XIZMAT' : T('E’LON')}</small>
        <strong>{title}</strong>
        {price && <span>{price}</span>}
        {note && <span className="tg-shared-listing-card__note">{note}</span>}
        <span className="tg-shared-listing-card__open"><ExternalLink size={12} /> {T('E’lonni ko‘rish')}</span>
      </span>
    </button>
  );
}

/* ============================================================
   ASOSIY KOMPONENT
   ============================================================ */

// Ilova ichidagi havolami? Eski xabarlarda to'liq manzil bo'ladi (https://localhost/..., sayt domeni) —
// ularni ham ilova ichida ochamiz, faqat haqiqiy tashqi saytlar brauzerda ochiladi
const APP_HOSTS = ['localhost', '127.0.0.1'];
function internalPath(url) {
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (APP_HOSTS.includes(host) || host === window.location.hostname || /(^|\.)(zumo\.uz|gru\.uz)$/.test(host)) {
      return `${u.pathname}${u.search}${u.hash}`;
    }
  } catch { /* noto'g'ri manzil — tashqi deb hisoblaymiz */ }
  return null;
}

// Chat foni (oboi) — tanlov shu qurilmada saqlanadi. Sukut bo'yicha Telegram kabi naqsh
// (ZUMO ikonkalari: chat, yurak, kalit, uy, savat, yulduz) — fon rangi mavzudan olinadi
const PATTERN_SVG = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill='none' stroke='%2300a6d6' stroke-opacity='.16' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 16h22a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H24l-7 6v-6h-3a5 5 0 0 1-5-5V21a5 5 0 0 1 5-5z'/%3E%3Cpath d='M101 22c-3-6-13-6-13 2 0 7 13 13 13 13s13-6 13-13c0-8-10-8-13-2z'/%3E%3Cpath d='M62 60l9 9m-3-14a7 7 0 0 0-9 9l-14 14 5 5 14-14a7 7 0 0 0 9-9l-4 4-4-1-1-4z'/%3E%3Cpath d='M122 66l12-10 12 10v14h-24z'/%3E%3Cpath d='M14 100h6l5 20h20l5-14H24'/%3E%3Ccircle cx='29' cy='126' r='2'/%3E%3Ccircle cx='43' cy='126' r='2'/%3E%3Cpath d='M98 104l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z'/%3E%3Ccircle cx='140' cy='132' r='5'/%3E%3Cpath d='M60 140h14M67 133v14'/%3E%3C/g%3E%3C/svg%3E\")";
const WALLPAPERS = [
  { id: 'zumo', label: () => T('ZUMO naqsh'), css: `${PATTERN_SVG}, var(--tg-bg)`, size: '160px 160px, cover' },
  { id: 'plain', label: () => T('Oddiy'), css: '' },
  { id: 'sky', label: () => T('Osmon'), css: 'linear-gradient(160deg, #cfefff 0%, #e9f7ff 45%, #fdfcff 100%)' },
  { id: 'night', label: () => T('Tun'), css: `${PATTERN_SVG}, linear-gradient(160deg, #0b1a33 0%, #11284a 50%, #0a1426 100%)`, size: '160px 160px, cover', dark: true },
  { id: 'mint', label: () => T('Yalpiz'), css: 'linear-gradient(160deg, #d8f7ec 0%, #effcf7 55%, #ffffff 100%)' },
  { id: 'peach', label: () => T('Shaftoli'), css: 'linear-gradient(160deg, #ffe3d6 0%, #fff1ea 50%, #fffaf7 100%)' },
];
const WALLPAPER_KEY = 'zumo_chat_wallpaper';
const WALLPAPER_IMG_KEY = 'zumo_chat_wallpaper_img';
const readWallpaperImage = () => {
  try { return localStorage.getItem(WALLPAPER_IMG_KEY) || ''; } catch { return ''; }
};
// Galereyadan tanlangan rasm — 1280px gacha kichraytirib JPEG (localStorage sig'sin)
const compressWallpaper = (file) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(img.src);
    resolve(canvas.toDataURL('image/jpeg', 0.72));
  };
  img.onerror = reject;
  img.src = URL.createObjectURL(file);
});
const readWallpaper = () => {
  try { return localStorage.getItem(WALLPAPER_KEY) || 'zumo'; } catch { return 'zumo'; }
};

// Server rasm/video bilan birga shu matnni yozadi — media ostida takrorlanmasin
const AUTO_MEDIA_TEXT = /^📎 (Rasm|Video) yuborildi$/;
// 1x1 shaffof GIF: Android WebView video yuklanguncha kulrang fon va katta "▶" chizmasin
const TRANSPARENT_POSTER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Rasmi yo'q yoki buzilgan bo'lsa — ism bosh harflari bilan avatar
const initialsAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Z')}&background=00B4D8&color=fff&rounded=true&size=96`;
function ChatAvatar({ src, name }) {
  const fallback = initialsAvatar(name);
  const usable = src && !src.includes('zumo-placeholder') ? src : fallback;
  return (
    <img
      src={usable}
      alt=""
      onError={(e) => { if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback; }}
    />
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const listingDraft = searchParams.get('draft') || '';
  const listingAttachmentDraft = buildListingDraftMessage({
    type: searchParams.get('listingType'),
    id: searchParams.get('listingId'),
    title: searchParams.get('listingTitle'),
    thumbnail: searchParams.get('listingThumbnail'),
    price: searchParams.get('listingPrice'),
    note: listingDraft,
  });

  const [currentUserId, setCurrentUserId] = useState('');
  useEffect(() => {
    if (!user) return;
    getChatMe()
      .then((res) => setCurrentUserId(String(res.data.id)))
      .catch(() => setCurrentUserId(toIdStr(user?.id || user?._id)));
  }, [user]);

  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pendingListingMessage, setPendingListingMessage] = useState(listingAttachmentDraft);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineStatus, setOnlineStatus] = useState({});
  const [sendingMedia, setSendingMedia] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [reactPickerId, setReactPickerId] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const [wallpaper, setWallpaper] = useState(readWallpaper);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const [wallpaperImage, setWallpaperImage] = useState(readWallpaperImage);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const wallpaperInputRef = useRef(null);
  const activeWallpaper = wallpaper === 'photo' && wallpaperImage
    ? { id: 'photo', css: `url("${wallpaperImage}") center / cover`, photo: true }
    : WALLPAPERS.find((w) => w.id === wallpaper) || WALLPAPERS[0];
  const pickWallpaperPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressWallpaper(file);
      localStorage.setItem(WALLPAPER_IMG_KEY, dataUrl);
      setWallpaperImage(dataUrl);
      chooseWallpaper('photo');
    } catch {
      toast.error(T('Rasmni fon qilib bo‘lmadi'));
    }
  };
  const chooseWallpaper = (id) => {
    setWallpaper(id);
    setWallpaperOpen(false);
    try { localStorage.setItem(WALLPAPER_KEY, id); } catch { /* faqat shu safar */ }
  };

  // Telegram uslubi: o'ngga surish — javob, uzoq bosish — menyu (telefonda "⋮" ko'rinmaydi)
  const touchRef = useRef({ id: null, x: 0, y: 0, dx: 0, timer: 0, scrolling: false });
  const [swipe, setSwipe] = useState({ id: null, dx: 0 });
  const [flashId, setFlashId] = useState(null);

  // Chatdagi reels — bosh sahifadagi to'liq ekranli pleyerning o'zida ochiladi (layk, izoh, surish bilan)
  const [reelViewer, setReelViewer] = useState(null);
  const ROUTE_SOURCE = { posts: 'posts', equipment: 'equipment', location: 'locations', 'service-provider': 'services' };
  const API_PATH = { posts: 'posts', equipment: 'equipment', locations: 'locations', services: 'service-providers' };
  const openReel = async ({ path, video, title, thumbnail }) => {
    const match = path.match(/^\/(posts|equipment|location|service-provider)\/([a-f0-9]{24})/i);
    const sourceKey = match && ROUTE_SOURCE[match[1]];
    const source = REEL_SOURCES.find((src) => src.key === sourceKey);
    let reels = [];
    if (source) {
      try {
        const { data } = await api.get(`/${API_PATH[sourceKey]}/${match[2]}`);
        const item = data?.post || data?.item || data?.data || data;
        reels = buildReels([item], source, currentUserId, t);
      } catch { /* e'lon o'chirilgan bo'lishi mumkin — quyida xabardagi videoga tayanamiz */ }
    }
    if (!reels.length && video) {
      reels = [{ id: `chat-${path}`, originalId: match?.[2], videoUrl: video, thumbnailUrl: thumbnail || null, title, typeLabel: 'Reels', link: path, itemType: source?.itemType || 'post', likesCount: 0, comments: [] }];
    }
    if (reels.length) setReelViewer(reels);
    else navigate(path);
  };
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [, setTick] = useState(0);
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem('chat_muted') === '1'
  );

  useEffect(() => {
    setPendingListingMessage(listingAttachmentDraft);
  }, [listingAttachmentDraft]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const isTypingRef = useRef(false);
  const typingTimers = useRef({});
  const isMutedRef = useRef(isMuted);
  const activeChatRef = useRef(activeChat);
  const conversationsRef = useRef(conversations);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  const notify = () => {
    if (!isMutedRef.current) playDing();
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('chat_muted', next ? '1' : '0');
      return next;
    });
  };

  /* ============================================================
     YORDAMCHI
     ============================================================ */

  const getStatusText = (userId) => {
    const st = onlineStatus[userId];
    if (!st) return '';
    if (st.isOnline) return 'online';
    if (st.lastSeen) {
      const diff = Math.floor((Date.now() - new Date(st.lastSeen).getTime()) / 1000);
      if (diff < 60) return T('hozirgina onlayn edi');
      if (diff < 3600) return T('{{v}} daqiqa oldin onlayn edi', { v: Math.floor(diff / 60) });
      if (diff < 86400) return T('{{v}} soat oldin onlayn edi', { v: Math.floor(diff / 3600) });
      return T('oxirgi marta {{v}}', { v: new Date(st.lastSeen).toLocaleDateString('uz-UZ') });
    }
    return 'offline';
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatShortTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 86400) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
  };

  const filteredUsers = allUsers.filter((item) => {
    const itemId = toIdStr(item._id || item.id);
    if (itemId === currentUserId) return false;
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const fullName = (item.fullName || item.full_name || '').toLowerCase();
    const email = (item.email || '').toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const upsertConversation = useCallback((info) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c.userId === info.userId);
      const base = exists || {
        userId: info.userId,
        fullName: info.fullName || 'Foydalanuvchi',
        avatar: info.avatar || '/images/zumo-placeholder.svg',
        unread: 0,
        isOnline: false,
      };
      const updated = {
        ...base,
        lastMessage: info.lastMessage ?? base.lastMessage,
        lastMessageTime: info.lastMessageTime ?? base.lastMessageTime,
        unread: Math.max(0, (base.unread || 0) + (info.unreadDelta || 0)),
      };
      return [updated, ...prev.filter((c) => c.userId !== info.userId)];
    });
  }, []);

  const bumpAfterSend = (msg) => {
    const chat = activeChatRef.current;
    if (!chat) return;
    upsertConversation({
      userId: chat.userId,
      fullName: chat.fullName,
      avatar: chat.avatar,
      lastMessage: msg.message || '',
      lastMessageTime: msg.createdAt,
    });
  };

  const fetchStatuses = useCallback((ids) => {
    const s = getSocket();
    const list = Array.from(new Set((ids || []).filter(Boolean)));
    if (!s.connected || list.length === 0) return;
    s.emit('get_statuses', list, (map) => {
      if (map) setOnlineStatus((prev) => ({ ...prev, ...map }));
    });
  }, []);

  const markActiveRead = useCallback(async (userId) => {
    if (!userId || document.hidden) return;
    try {
      await markChatRead(userId);
      setConversations((prev) =>
        prev.map((c) => (c.userId === userId && c.unread ? { ...c, unread: 0 } : c))
      );
      window.dispatchEvent(new Event('chatRead'));
    } catch (err) {
      console.warn('markChatRead xato:', err);
    }
  }, []);

  /* ============================================================
     AUDIO UNLOCK + Notification ruxsati
     ============================================================ */

  useEffect(() => {
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(i);
  }, []);

  /* ============================================================
     SOCKET
     ============================================================ */

  useEffect(() => {
    if (!currentUserId) return;

    registerSocketUser(currentUserId);
    const s = getSocket();
    setSocket(s);

    const refreshAllStatuses = () => {
      const ids = conversationsRef.current.map((c) => c.userId);
      if (activeChatRef.current) ids.push(activeChatRef.current.userId);
      fetchStatuses(ids);
    };

    const onConnect = () => {
      s.emit('register', currentUserId);
      refreshAllStatuses();
    };

    const onUserOnline = ({ userId, isOnline, lastSeen }) => {
      setOnlineStatus((prev) => ({
        ...prev,
        [userId]: {
          isOnline,
          lastSeen: isOnline ? null : lastSeen || new Date().toISOString(),
        },
      }));
      if (!isOnline) {
        setTypingUsers((prev) => ({ ...prev, [userId]: false }));
      }
    };

    const onTyping = ({ from }) => {
      setTypingUsers((prev) => ({ ...prev, [from]: true }));
      clearTimeout(typingTimers.current[from]);
      typingTimers.current[from] = setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [from]: false }));
      }, 4000);
    };

    const onStopTyping = ({ from }) => {
      clearTimeout(typingTimers.current[from]);
      setTypingUsers((prev) => ({ ...prev, [from]: false }));
    };

    s.on('connect', onConnect);
    s.on('user_online', onUserOnline);
    s.on('user_typing', onTyping);
    s.on('user_stop_typing', onStopTyping);

    if (s.connected) refreshAllStatuses();

    return () => {
      s.off('connect', onConnect);
      s.off('user_online', onUserOnline);
      s.off('user_typing', onTyping);
      s.off('user_stop_typing', onStopTyping);
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [currentUserId, fetchStatuses]);

  /* ============================================================
     REAL-TIME: edit / delete / read
     ============================================================ */

  useEffect(() => {
    if (!socket) return;

    const onEdited = ({ messageId, message }) => {
      setMessages((prev) =>
        prev.map((m) =>
          toIdStr(m._id) === String(messageId) ? { ...m, message, edited: true } : m
        )
      );
    };

    const onDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => toIdStr(m._id) !== String(messageId)));
    };

    const onRead = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          toIdStr(m._id) === String(messageId) ? { ...m, isRead: true } : m
        )
      );
    };

    const onMessagesRead = ({ by }) => {
      setMessages((prev) =>
        prev.map((m) =>
          toIdStr(m.from) === currentUserId && toIdStr(m.to) === String(by)
            ? { ...m, isRead: true }
            : m
        )
      );
    };

    const onReacted = ({ _id, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (toIdStr(m._id) === String(_id) ? { ...m, reactions } : m))
      );
    };

    socket.on('message_edited', onEdited);
    socket.on('message_deleted', onDeleted);
    socket.on('message_read', onRead);
    socket.on('messages_read', onMessagesRead);
    socket.on('message_reacted', onReacted);

    return () => {
      socket.off('message_edited', onEdited);
      socket.off('message_deleted', onDeleted);
      socket.off('message_read', onRead);
      socket.off('messages_read', onMessagesRead);
      socket.off('message_reacted', onReacted);
    };
  }, [socket, currentUserId]);

  /* ============================================================
     LOAD: conversations + users
     ============================================================ */

  useEffect(() => {
    if (!currentUserId) return;

    Promise.all([getConversations(), getAllUsers()])
      .then(([convRes, usersRes]) => {
        const convs = (convRes.data || []).filter((c) => c.userId !== currentUserId);
        setConversations(convs);
        setAllUsers(usersRes.data || []);

        const statusMap = {};
        convs.forEach((c) => {
          statusMap[c.userId] = { isOnline: !!c.isOnline, lastSeen: c.lastSeen || null };
        });
        setOnlineStatus((prev) => ({ ...statusMap, ...prev }));

        if (targetUserId) {
          const found = convs.find((c) => c.userId === targetUserId);
          if (found) {
            setActiveChat(found);
          } else {
            const userInfo = (usersRes.data || []).find(
              (u) => toIdStr(u._id || u.id) === targetUserId
            );
            setActiveChat({
              userId: targetUserId,
              fullName: userInfo?.fullName || userInfo?.email || 'Foydalanuvchi',
              avatar: userInfo?.avatar_url || '/images/zumo-placeholder.svg',
            });
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Load xato:', err);
        setLoading(false);
      });
  }, [currentUserId, targetUserId]);

  /* ============================================================
     LOAD MESSAGES
     ============================================================ */

  useEffect(() => {
    if (!activeChat || !currentUserId) return;

    setReplyTo(null);
    setEditingMessage(null);
    setNewMessage(listingDraft);

    fetchStatuses([activeChat.userId]);

    getMessages(activeChat.userId)
      .then((res) => {
        const list = res.data || [];
        setMessages(list);

        const hasUnread = list.some(
          (m) => toIdStr(m.to) === currentUserId && !m.isRead
        );
        if (hasUnread) markActiveRead(activeChat.userId);
      })
      .catch(console.error);
  }, [activeChat, currentUserId, fetchStatuses, markActiveRead, listingDraft]);

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && activeChatRef.current) {
        markActiveRead(activeChatRef.current.userId);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [markActiveRead]);

  /* ============================================================
     RECEIVE MESSAGES
     ============================================================ */

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleReceive = (msg) => {
      const fromId = toIdStr(msg.from);
      const active = activeChatRef.current;
      const inActiveChat = !!active && fromId === active.userId;
      const seenNow = inActiveChat && !document.hidden;

      notify();

      clearTimeout(typingTimers.current[fromId]);
      setTypingUsers((prev) => ({ ...prev, [fromId]: false }));

      upsertConversation({
        userId: fromId,
        fullName: msg.senderName,
        avatar: msg.senderAvatar,
        lastMessage: msg.message || '',
        lastMessageTime: msg.createdAt,
        unreadDelta: seenNow ? 0 : 1,
      });

      if (inActiveChat) {
        setMessages((prev) =>
          prev.some((m) => toIdStr(m._id) === toIdStr(msg._id)) ? prev : [...prev, msg]
        );
        if (seenNow) markActiveRead(fromId);
      }

      const senderName = msg.senderName || t('chat.newMessage', 'Yangi xabar');
      const senderAvatar = msg.senderAvatar || '/images/zumo-placeholder.svg';

      if (!inActiveChat) {
        toast(
          (tt) => (
            <div
              onClick={() => {
                setActiveChat({ userId: fromId, fullName: senderName, avatar: senderAvatar });
                toast.dismiss(tt.id);
              }}
              style={{ cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
            >
              <img
                src={senderAvatar}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = '/images/zumo-placeholder.svg';
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{senderName}</div>
                <div
                  style={{
                    fontSize: 12.5,
                    opacity: 0.85,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 220,
                  }}
                >
                  {previewOf(msg)}
                </div>
              </div>
            </div>
          ),
          { icon: '💬', duration: 4500 }
        );
      }

      if (
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.hidden
      ) {
        try {
          const n = new Notification(senderName, {
            body: previewOf(msg),
            icon: senderAvatar,
            tag: `chat-${fromId}`,
          });
          n.onclick = () => {
            window.focus();
            setActiveChat({ userId: fromId, fullName: senderName, avatar: senderAvatar });
            n.close();
          };
        } catch (e) {}
      }
    };

    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
     
  }, [socket, currentUserId, t, upsertConversation, markActiveRead]);

  /* ============================================================
     SCROLL / MENU / ESC
     ============================================================ */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.tg-msg-menu-wrap')) setOpenMenuId(null);
      if (!e.target.closest('.tg-react-picker') && !e.target.closest('.tg-msg-menu')) setReactPickerId(null);
    };
    // Telefonda ham: tashqariga tegish yoki "orqaga" (Escape) menyuni yopadi
    const onKey = (e) => { if (e.key === 'Escape') { setOpenMenuId(null); setReactPickerId(null); setWallpaperOpen(false); } };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ============================================================
     HANDLERS
     ============================================================ */

  const stopTyping = () => {
    clearTimeout(typingTimeout.current);
    if (isTypingRef.current && socket && activeChatRef.current) {
      socket.emit('stop_typing', { to: activeChatRef.current.userId });
    }
    isTypingRef.current = false;
  };

  const handleTyping = () => {
    if (!socket || !activeChat) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { to: activeChat.userId });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, 2000);
  };

  const send = async () => {
    if (!newMessage.trim() || !activeChat) return;
    const msgText = newMessage.trim();
    const messageText = pendingListingMessage
      ? setListingMessageNote(pendingListingMessage, msgText)
      : msgText;
    setNewMessage('');
    stopTyping();

    try {
      const res = await sendMessage({ to: activeChat.userId, message: messageText });
      setMessages((prev) => [...prev, res.data]);
      bumpAfterSend(res.data);
      setPendingListingMessage('');
    } catch (err) {
      toast.error(T('Xabar yuborilmadi'));
      setNewMessage(msgText);
    }
  };

  const handleSendMedia = async () => {
    if (!mediaPreview || !activeChat) return;
    setSendingMedia(true);
    try {
      const res = await sendMedia(activeChat.userId, mediaPreview.file);
      setMessages((prev) => [...prev, res.data]);
      bumpAfterSend(res.data);
      setMediaPreview(null);
    } catch (err) {
      toast.error(T('Media yuborilmadi'));
    } finally {
      setSendingMedia(false);
    }
  };

  const handleMultipleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeChat) return;
    setSendingMedia(true);
    for (const file of files) {
      try {
        const res = await sendMedia(activeChat.userId, file);
        setMessages((prev) => [...prev, res.data]);
        bumpAfterSend(res.data);
      } catch (err) {
        toast.error(T('Media yuborilmadi'));
      }
    }
    setSendingMedia(false);
    e.target.value = '';
  };

  const sendLocation = () => {
    if (!activeChat) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const msg = `${LOCATION_PREFIX}${url}`;
        sendMessage({ to: activeChat.userId, message: msg })
          .then((res) => {
            setMessages((prev) => [...prev, res.data]);
            bumpAfterSend(res.data);
          })
          .catch(() => toast.error(T('Joylashuv yuborilmadi')));
      },
      () => toast.error(T('Joylashuv olinmadi'))
    );
  };

  /* ============================================================
     OVOZLI XABAR
     ============================================================ */
  const startRecording = async () => {
    if (!activeChat || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      toast.error(T('Mikrofonga ruxsat berilmadi'));
    }
  };

  const cancelRecording = () => {
    clearInterval(recordTimerRef.current);
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = () => mr.stream.getTracks().forEach((t) => t.stop());
      mr.stop();
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const stopAndSendRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    const duration = recordSeconds;
    clearInterval(recordTimerRef.current);
    mr.onstop = async () => {
      mr.stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      recordedChunksRef.current = [];
      if (blob.size > 0 && activeChat) {
        try {
          const res = await sendVoice(activeChat.userId, blob, duration);
          setMessages((prev) => [...prev, res.data]);
          bumpAfterSend(res.data);
        } catch {
          toast.error(T('Ovozli xabar yuborilmadi'));
        }
      }
    };
    mr.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setRecordSeconds(0);
  };

  /* ============================================================
     REAKSIYA + FORWARD
     ============================================================ */
  const reactToMessage = async (msg, emoji) => {
    setReactPickerId(null);
    const mine = { userId: currentUserId, emoji };
    setMessages((prev) =>
      prev.map((m) => {
        if (toIdStr(m._id) !== toIdStr(msg._id)) return m;
        const already = (m.reactions || []).find((r) => toIdStr(r.userId) === currentUserId && r.emoji === emoji);
        const rest = (m.reactions || []).filter((r) => toIdStr(r.userId) !== currentUserId);
        return { ...m, reactions: already ? rest : [...rest, mine] };
      })
    );
    try {
      await reactMessage(msg._id, emoji);
    } catch {
      toast.error(T('Reaksiya yuborilmadi'));
    }
  };

  const openForward = (msg) => {
    setForwardMsg(msg);
    setOpenMenuId(null);
  };

  const sendForwardTo = async (toUserId) => {
    if (!forwardMsg) return;
    try {
      await forwardMessage(forwardMsg._id, toUserId);
      toast.success(T('Yuborildi'));
      setForwardMsg(null);
      setForwardSearch('');
      if (activeChat?.userId === toUserId) {
        getMessages(toUserId).then((res) => setMessages(res.data || []));
      }
    } catch {
      toast.error(T('Yuborilmadi'));
    }
  };

  const onBubbleTouchStart = (e, menuId) => {
    const t = e.touches[0];
    const state = touchRef.current;
    clearTimeout(state.timer);
    Object.assign(state, { id: menuId, x: t.clientX, y: t.clientY, dx: 0, scrolling: false });
    state.timer = window.setTimeout(() => {
      if (state.id === menuId && state.dx < 8 && !state.scrolling) {
        setOpenMenuId(menuId);
        navigator.vibrate?.(15);
      }
    }, 380);
  };

  const onBubbleTouchMove = (e, menuId) => {
    const state = touchRef.current;
    if (state.id !== menuId || state.scrolling) return;
    const t = e.touches[0];
    const dx = t.clientX - state.x;
    const dy = t.clientY - state.y;
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
      state.scrolling = true;
      clearTimeout(state.timer);
      setSwipe({ id: null, dx: 0 });
      return;
    }
    if (dx > 8) {
      clearTimeout(state.timer);
      state.dx = Math.min(dx, 90);
      setSwipe({ id: menuId, dx: state.dx });
    }
  };

  const onBubbleTouchEnd = (msg, menuId) => {
    const state = touchRef.current;
    clearTimeout(state.timer);
    if (menuId !== null && state.id === menuId && state.dx >= 56) {
      navigator.vibrate?.(10);
      handleReply(msg);
    }
    state.id = null;
    state.dx = 0;
    setSwipe({ id: null, dx: 0 });
  };

  // Iqtibos bosilganda asl xabarga o'tib, uni qisqa yoritadi
  const jumpToMessage = (id) => {
    const el = id && document.querySelector(`[data-msg-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(String(id));
    window.setTimeout(() => setFlashId(null), 1400);
  };

  const handleReply = (msg) => {
    setEditingMessage(null);
    setReplyTo(msg);
    setOpenMenuId(null);
    setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
  };

  const sendReply = async () => {
    if (!replyTo || !newMessage.trim()) return;
    stopTyping();
    try {
      const res = await replyMessage(replyTo._id, newMessage.trim());
      setMessages((prev) => [...prev, res.data]);
      bumpAfterSend(res.data);
      setNewMessage('');
      setReplyTo(null);
    } catch (err) {
      toast.error(T('Xabar yuborilmadi'));
    }
  };

  const handleCopy = (msg) => {
    if (isReelMessage(msg.message) || isSharedListingMessage(msg.message)) {
      const { url } = isSharedListingMessage(msg.message)
        ? parseSharedListingMessage(msg.message)
        : parseReelMessage(msg.message);
      navigator.clipboard.writeText(url);
    } else {
      navigator.clipboard.writeText(msg.message || '');
    }
    toast.success(T('Nusxalandi'));
    setOpenMenuId(null);
  };

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
      await editMessage(editingMessage._id, newMessage.trim());
      setMessages((prev) =>
        prev.map((m) =>
          m._id === editingMessage._id
            ? { ...m, message: newMessage.trim(), edited: true }
            : m
        )
      );
      setEditingMessage(null);
      setNewMessage('');
    } catch (err) {
      toast.error(T('Tahrirlanmadi'));
    }
  };

  const handleDelete = async (msg) => {
    setOpenMenuId(null);
    if (!window.confirm(T('O\'chirishni tasdiqlaysizmi?'))) return;
    try {
      await deleteMessage(msg._id);
      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
    } catch (err) {
      toast.error(T('O\'chirilmadi'));
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  if (loading) {
    return (
      <div className="tg-loading">
        <Loader2 size={28} className="spin" />
        <span>{T('Yuklanmoqda...')}</span>
      </div>
    );
  }

  const activeIsOnline = !!onlineStatus[activeChat?.userId]?.isOnline;

  return (
    <>
      <div className={`tg-chat ${activeChat ? 'tg-chat--mobile-open' : ''}`}>
        {/* ===================== SIDEBAR ===================== */}
        <aside className="tg-sidebar">
          <header className="tg-sidebar__header">
            <button
              type="button"
              className="tg-icon-btn"
              onClick={() => safeGoBack(navigate)}
              aria-label={T('Orqaga')}
            >
              <ArrowLeft size={20} />
            </button>
            <h2>{T('Suhbatlar')}</h2>
            <button
              type="button"
              className="tg-icon-btn"
              onClick={toggleMute}
              aria-label={isMuted ? T('Ovozni yoqish') : "Ovozni o'chirish"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </header>

          <div className="tg-search">
            <Search size={16} />
            <input
              type="text"
              placeholder={T('Foydalanuvchi qidirish...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="tg-search-clear"
                onClick={() => setSearchTerm('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="tg-chatlist">
            {searchTerm ? (
              filteredUsers.length === 0 ? (
                <div className="tg-empty">
                  <Search size={32} />
                  <span>{T('Foydalanuvchi topilmadi')}</span>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const uid = toIdStr(u._id || u.id);
                  return (
                    <button
                      key={uid}
                      type="button"
                      className={`tg-chatitem ${activeChat?.userId === uid ? 'active' : ''}`}
                      onClick={() => {
                        setActiveChat({
                          userId: uid,
                          fullName: u.fullName || u.email,
                          avatar: u.avatar_url || '/images/zumo-placeholder.svg',
                        });
                        setSearchTerm('');
                      }}
                    >
                      <div className="tg-avatar">
                        <ChatAvatar src={u.avatar_url} name={u.fullName || u.email} />
                        {onlineStatus[uid]?.isOnline && <span className="tg-online-dot" />}
                      </div>
                      <div className="tg-chatitem__body">
                        <div className="tg-chatitem__top">
                          <span className="tg-chatitem__name">{u.fullName || u.email}</span>
                        </div>
                        <div className="tg-chatitem__bottom">
                          <span className="tg-chatitem__last">{u.email}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={T('Hozircha suhbat yo‘q')}
                text={T('E’lon sahifasida «Sotuvchiga yozish» yoki mutaxassis sahifasida chat tugmasini bosing — suhbat shu yerda boshlanadi.')}
                actionLabel={T('Bozorga o‘tish')}
                onAction={() => navigate('/marketplace')}
              />
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  type="button"
                  className={`tg-chatitem ${
                    activeChat?.userId === conv.userId ? 'active' : ''
                  } ${conv.unread > 0 ? 'has-unread' : ''}`}
                  onClick={() => setActiveChat(conv)}
                >
                  <div className="tg-avatar">
                    <ChatAvatar src={conv.avatar} name={conv.fullName} />
                    {(onlineStatus[conv.userId]?.isOnline ?? conv.isOnline) && (
                      <span className="tg-online-dot" />
                    )}
                  </div>
                  <div className="tg-chatitem__body">
                    <div className="tg-chatitem__top">
                      <span className="tg-chatitem__name">{conv.fullName}</span>
                      {conv.lastMessageTime && (
                        <span className="tg-chatitem__time">
                          {formatShortTime(conv.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="tg-chatitem__bottom">
                      {typingUsers[conv.userId] ? (
                        <span className="tg-chatitem__last typing">yozmoqda...</span>
                      ) : (
                        <span className="tg-chatitem__last">
                          {isLocationMessage(conv.lastMessage) ? (
                            <>
                              <MapPin size={12} /> {T('Joylashuv')}
                            </>
                          ) : isSharedListingMessage(conv.lastMessage) ? (
                            <><Package size={12} /> {T('E’lon')}</>
                          ) : isReelMessage(conv.lastMessage) ? (
                            <>
                              <Film size={12} /> {T('Video')}
                            </>
                          ) : (
                            conv.lastMessage?.substring(0, 40)
                          )}
                        </span>
                      )}
                      {conv.unread > 0 && (
                        <span className="tg-unread">{conv.unread > 99 ? '99+' : conv.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ===================== MAIN CHAT ===================== */}
        <main className="tg-main">
          {activeChat ? (
            <>
              <header className="tg-header">
                <button
                  type="button"
                  className="tg-icon-btn tg-back-mobile"
                  onClick={() => setActiveChat(null)}
                  aria-label={T('Orqaga')}
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="tg-avatar tg-avatar--sm">
                  <ChatAvatar src={activeChat.avatar} name={activeChat.fullName} />
                  {activeIsOnline && <span className="tg-online-dot" />}
                </div>

                <div className="tg-header__info">
                  <div className="tg-header__name">{activeChat.fullName}</div>
                  <div className={`tg-header__status ${activeIsOnline ? 'online' : ''}`}>
                    {typingUsers[activeChat.userId] ? (
                      <span className="tg-typing">
                        {T('yozmoqda')} 
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    ) : (
                      getStatusText(activeChat.userId)
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="tg-icon-btn"
                  onClick={toggleMute}
                  aria-label={isMuted ? T('Ovozni yoqish') : "Ovozni o'chirish"}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="tg-head-menu">
                  <button type="button" className="tg-icon-btn" onClick={() => setHeaderMenuOpen((v) => !v)} aria-label={T('Menyu')} aria-expanded={headerMenuOpen}>
                    <MoreVertical size={20} />
                  </button>
                  {headerMenuOpen && (
                    <>
                      <button type="button" className="tg-head-menu__backdrop" aria-label={T('Yopish')} onClick={() => setHeaderMenuOpen(false)} />
                      <div className="tg-head-menu__list" role="menu">
                        <button type="button" role="menuitem" onClick={() => { setHeaderMenuOpen(false); setWallpaperOpen(true); }}>
                          <Palette size={18} /> {T('Chat foni')}
                        </button>
                        <button type="button" role="menuitem" onClick={() => { setHeaderMenuOpen(false); toggleMute(); }}>
                          {isMuted ? <Volume2 size={18} /> : <VolumeX size={18} />} {isMuted ? T('Ovozni yoqish') : T('Ovozni o‘chirish')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </header>

              <div
                className={`tg-messages ${activeWallpaper.css ? 'tg-messages--wallpaper' : ''} ${activeWallpaper.dark ? 'tg-messages--dark' : ''}`}
                style={activeWallpaper.css ? { background: activeWallpaper.css, backgroundSize: activeWallpaper.size, backgroundAttachment: activeWallpaper.photo ? 'fixed' : 'local' } : undefined}
              >
                {messages.length === 0 ? (
                  <div className="tg-empty">
                    <MessageSquare size={40} />
                    <span>{T('Hozircha xabarlar yo\'q')}</span>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const senderId = toIdStr(msg.from);
                    const isSent = senderId === currentUserId;
                    const isReply = msg.replyTo;
                    const isLocation = isLocationMessage(msg.message);
                    const isReel = isReelMessage(msg.message);
                    const isSharedListing = isSharedListingMessage(msg.message);
                    const canEdit =
                      isSent &&
                      msg.message &&
                      !isLocation &&
                      !isReel &&
                      !isSharedListing &&
                      !msg.mediaUrl;
                    const menuId = msg._id || i;

                    const prevMsg = messages[i - 1];
                    const isGrouped = toIdStr(prevMsg?.from) === senderId;

                    const nextMsg = messages[i + 1];
                    const isLastOfGroup = toIdStr(nextMsg?.from) !== senderId;

                    return (
                      <div
                        key={menuId}
                        data-msg-id={msg._id}
                        className={`tg-message-row ${isSent ? 'sent' : 'received'} ${
                          isGrouped ? 'grouped' : ''
                        } ${flashId && flashId === String(msg._id) ? 'tg-flash' : ''}`}
                      >
                        <div className="tg-message-wrapper">
                          <div
                            className={`tg-bubble ${isSent ? 'sent' : 'received'} ${
                              isLastOfGroup ? (isSent ? 'tail-right' : 'tail-left') : ''
                            } ${isReel ? 'tg-bubble--reel' : ''} ${isSharedListing ? 'tg-bubble--listing' : ''}`}
                            onDoubleClick={() => handleReply(msg)}
                            onTouchStart={(e) => onBubbleTouchStart(e, menuId)}
                            onTouchMove={(e) => onBubbleTouchMove(e, menuId)}
                            onTouchEnd={() => onBubbleTouchEnd(msg, menuId)}
                            onTouchCancel={() => onBubbleTouchEnd(msg, null)}
                            onContextMenu={(e) => e.preventDefault()}
                            style={swipe.id === menuId ? { transform: `translateX(${swipe.dx}px)`, transition: 'none' } : undefined}
                          >
                            {swipe.id === menuId && (
                              <span className="tg-swipe-reply" style={{ opacity: Math.min(1, swipe.dx / 56) }}>
                                <Reply size={16} />
                              </span>
                            )}
                            {isReply && (
                              <div
                                className="tg-reply-preview"
                                onClick={(e) => { e.stopPropagation(); jumpToMessage(toIdStr(msg.replyTo?._id)); }}
                              >
                                {msg.replyTo?.mediaUrl && msg.replyTo?.mediaType === 'image' && (
                                  <img className="tg-reply-thumb" src={getImageUrl(msg.replyTo.mediaUrl)} alt="" />
                                )}
                                {msg.replyTo?.mediaUrl && msg.replyTo?.mediaType === 'video' && (
                                  <video className="tg-reply-thumb" src={`${getImageUrl(msg.replyTo.mediaUrl)}#t=0.1`} muted playsInline preload="metadata" poster={TRANSPARENT_POSTER} />
                                )}
                                <span className="tg-reply-bar" />
                                <div className="tg-reply-body">
                                  <span className="tg-reply-name">
                                    {toIdStr(msg.replyTo?.from) === currentUserId
                                      ? T('Siz')
                                      : activeChat.fullName}
                                  </span>
                                  <span className="tg-reply-text">
                                    {isSharedListingMessage(msg.replyTo?.message)
                                      ? T('📦 E’lon: {{title}}', { title: parseSharedListingMessage(msg.replyTo.message).title })
                                      : isReelMessage(msg.replyTo?.message)
                                      ? '🎬 Video'
                                      : isLocationMessage(msg.replyTo?.message)
                                      ? '📍 Joylashuv'
                                      : msg.replyTo?.mediaType
                                        ? previewOf(msg.replyTo)
                                        : msg.replyTo?.message || T('Xabar')}
                                  </span>
                                </div>
                              </div>
                            )}

                            {msg.mediaUrl && msg.mediaType === 'image' && (
                              <div
                                className="tg-media-wrap"
                                onClick={() =>
                                  setLightbox({ url: getImageUrl(msg.mediaUrl), type: 'image' })
                                }
                              >
                                <img
                                  src={getImageUrl(msg.mediaUrl)}
                                  alt=""
                                  className="tg-media-img"
                                />
                              </div>
                            )}

                            {msg.mediaUrl && msg.mediaType === 'video' && (
                              <div
                                className="tg-media-wrap tg-media-video"
                                onClick={() =>
                                  setLightbox({ url: getImageUrl(msg.mediaUrl), type: 'video' })
                                }
                              >
                                {/* #t=0.1 — birinchi kadr muqova bo'lib ko'rinadi */}
                                <video
                                  src={`${getImageUrl(msg.mediaUrl)}#t=0.1`}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  poster={TRANSPARENT_POSTER}
                                  className="tg-media-img"
                                />
                                <div className="tg-play-overlay">
                                  <span className="tg-play-btn"><PlayCircle size={30} /></span>
                                </div>
                              </div>
                            )}

                            {msg.mediaUrl && msg.mediaType === 'voice' && (
                              <div className="tg-voice-msg">
                                <audio src={getImageUrl(msg.mediaUrl)} controls preload="metadata" />
                                {!!msg.mediaDuration && (
                                  <span className="tg-voice-msg__dur">
                                    {Math.floor(msg.mediaDuration / 60)}:{String(msg.mediaDuration % 60).padStart(2, '0')}
                                  </span>
                                )}
                              </div>
                            )}

                            {isLocation ? (
                              <a
                                href={msg.message.replace(LOCATION_PREFIX, '')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tg-location"
                              >
                                <div className="tg-location__icon">
                                  <MapPin size={20} />
                                </div>
                                <div className="tg-location__text">
                                  <strong>{T('Joylashuv')}</strong>
                                  <span>{T('Xaritada ko\'rish')}</span>
                                </div>
                              </a>
                            ) : isSharedListing ? (
                              <SharedListingMessageCard text={msg.message} />
                            ) : isReel ? (
                              <ReelMessageCard text={msg.message} onOpenReel={openReel} />
                            ) : (
                              msg.message && !(msg.mediaUrl && AUTO_MEDIA_TEXT.test(msg.message)) && (
                                <p className="tg-text">{msg.message}</p>
                              )
                            )}

                            {!!msg.reactions?.length && (
                              <div className="tg-reactions">
                                {Object.entries(
                                  msg.reactions.reduce((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                    return acc;
                                  }, {})
                                ).map(([emoji, count]) => (
                                  <span
                                    key={emoji}
                                    className={`tg-reaction ${msg.reactions.some((r) => toIdStr(r.userId) === currentUserId && r.emoji === emoji) ? 'mine' : ''}`}
                                    onClick={() => reactToMessage(msg, emoji)}
                                  >
                                    {emoji} {count > 1 ? count : ''}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="tg-meta">
                              {msg.edited && <span className="tg-edited">{T('tahrirlandi')}</span>}
                              <span className="tg-time">{formatTime(msg.createdAt)}</span>
                              {isSent && (
                                <span className={`tg-check ${msg.isRead ? 'read' : ''}`}>
                                  {msg.isRead ? <CheckCheck size={15} /> : <Check size={15} />}
                                </span>
                              )}
                            </div>

                            {reactPickerId === menuId && (
                              <div className="tg-react-picker">
                                {REACTION_EMOJIS.map((em) => (
                                  <button key={em} type="button" onClick={() => reactToMessage(msg, em)}>{em}</button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="tg-msg-menu-wrap">
                            <button
                              type="button"
                              className={`tg-msg-menu-btn ${openMenuId === menuId ? 'open' : ''}`}
                              onClick={() => setOpenMenuId(openMenuId === menuId ? null : menuId)}
                            >
                              <MoreVertical size={14} />
                            </button>
                            {openMenuId === menuId && (
                              <div className="tg-msg-menu">
                                <button onClick={() => { setOpenMenuId(null); setReactPickerId(menuId); }}>
                                  <Smile size={14} /> {T('Reaksiya')}
                                </button>
                                <button onClick={() => handleReply(msg)}>
                                  <Reply size={14} /> {T('Javob berish')}
                                </button>
                                <button onClick={() => openForward(msg)}>
                                  <Forward size={14} /> {T('Ulashish')}
                                </button>
                                {msg.message && !isLocation && (
                                  <button onClick={() => handleCopy(msg)}>
                                    <Copy size={14} />{' '}
                                    {isReel ? T('Havolani nusxalash') : T('Nusxalash')}
                                  </button>
                                )}
                                {canEdit && (
                                  <button onClick={() => handleEditStart(msg)}>
                                    <Pencil size={14} /> {T('Tahrirlash')}
                                  </button>
                                )}
                                {isSent && (
                                  <button className="danger" onClick={() => handleDelete(msg)}>
                                    <Trash2 size={14} /> {T('O\'chirish')}
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
                <div className="tg-reply-bar tg-reply-bar--edit">
                  <Pencil size={16} />
                  <div className="tg-reply-bar__body">
                    <span className="tg-reply-bar__label">{T('Xabarni tahrirlash')}</span>
                    <span className="tg-reply-bar__text">
                      {editingMessage.message?.substring(0, 60)}
                    </span>
                  </div>
                  <button type="button" className="tg-reply-bar__close" onClick={handleEditCancel}>
                    <X size={18} />
                  </button>
                </div>
              )}

              {replyTo && !editingMessage && (
                <div className="tg-reply-bar">
                  <Reply size={16} />
                  <div className="tg-reply-bar__body">
                    <span className="tg-reply-bar__label">{T('Javob')}</span>
                    <span className="tg-reply-bar__text">
                      {isSharedListingMessage(replyTo.message)
                        ? T('📦 E’lon: {{title}}', { title: parseSharedListingMessage(replyTo.message).title })
                        : isReelMessage(replyTo.message)
                        ? '🎬 Video'
                        : isLocationMessage(replyTo.message)
                        ? '📍 Joylashuv'
                        : replyTo.mediaType
                          ? previewOf(replyTo)
                          : replyTo.message?.substring(0, 60)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="tg-reply-bar__close"
                    onClick={() => setReplyTo(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {mediaPreview && (
                <div className="tg-media-preview">
                  <button
                    type="button"
                    className="tg-media-preview__close"
                    onClick={() => setMediaPreview(null)}
                  >
                    <X size={18} />
                  </button>
                  {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="" />
                  ) : (
                    <video src={mediaPreview.url} controls />
                  )}
                  <button
                    type="button"
                    className="tg-media-preview__send"
                    onClick={handleSendMedia}
                    disabled={sendingMedia}
                  >
                    {sendingMedia ? T('Yuborilmoqda...') : T('Yuborish')}
                  </button>
                </div>
              )}

              {pendingListingMessage && (
                <div className="tg-pending-listing">
                  <SharedListingMessageCard text={setListingMessageNote(pendingListingMessage, newMessage)} />
                  <button
                    type="button"
                    className="tg-pending-listing__remove"
                    aria-label={T('Olib tashlash')}
                    onClick={() => setPendingListingMessage('')}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {isRecording ? (
                <div className="tg-input tg-input--recording">
                  <button type="button" className="tg-input__icon danger" onClick={cancelRecording} aria-label={T('Bekor qilish')}>
                    <Trash2 size={20} />
                  </button>
                  <div className="tg-recording-indicator">
                    <span className="tg-recording-dot" />
                    {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}
                  </div>
                  <button type="button" className="tg-input__send" onClick={stopAndSendRecording} aria-label={T('Yuborish')}>
                    <Send size={20} />
                  </button>
                </div>
              ) : (
              <div className="tg-input">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleMultipleFiles}
                />

                <button
                  type="button"
                  className="tg-input__icon"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={T('Fayl')}
                >
                  <Paperclip size={20} />
                </button>

                <button
                  type="button"
                  className="tg-input__icon"
                  onClick={sendLocation}
                  aria-label={T('Joylashuv')}
                >
                  <MapPin size={20} />
                </button>

                <div className="tg-input__field">
                  <input
                    id="chat-input"
                    type="text"
                    placeholder={
                      editingMessage
                        ? T('Tahrirlash...')
                        : replyTo
                        ? T('Javob yozing...')
                        : T('Xabar yozing...')
                    }
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (!editingMessage) handleTyping();
                    }}
                    onKeyDown={(e) => {
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
                    type="button"
                    className="tg-input__emoji"
                    onClick={() => setShowEmoji(!showEmoji)}
                    aria-label={T('Emoji')}
                  >
                    <Smile size={20} />
                  </button>

                  {showEmoji && (
                    <div className="tg-emoji-picker">
                      <EmojiPicker
                        theme="dark"
                        onEmojiClick={(emoji) => {
                          setNewMessage((prev) => prev + emoji.emoji);
                          setShowEmoji(false);
                        }}
                      />
                    </div>
                  )}
                </div>

                {newMessage.trim() ? (
                  <button
                    type="button"
                    className="tg-input__send"
                    onClick={editingMessage ? handleEditSave : replyTo ? sendReply : send}
                    aria-label={T('Yuborish')}
                  >
                    {editingMessage ? <Check size={20} /> : <Send size={20} />}
                  </button>
                ) : (
                  !editingMessage && (
                    <button
                      type="button"
                      className="tg-input__send"
                      onClick={startRecording}
                      aria-label={T('Ovozli xabar')}
                    >
                      <Mic size={20} />
                    </button>
                  )
                )}
              </div>
              )}
            </>
          ) : (
            <div className="tg-placeholder">
              <MessageSquare size={64} />
              <h3>{T('Suhbatni tanlang')}</h3>
              <p>{T('Xabar yozishni boshlash uchun chapdan suhbat tanlang')}</p>
            </div>
          )}
        </main>
      </div>

      {lightbox && <MediaLightbox media={lightbox} onClose={() => setLightbox(null)} />}

      {forwardMsg && (
        <div className="tg-wall-sheet" role="dialog" aria-modal="true" onClick={() => setForwardMsg(null)}>
          <div className="tg-wall-sheet__card" onClick={(e) => e.stopPropagation()}>
            <div className="tg-wall-sheet__head">
              <strong>{T('Ulashish')}</strong>
              <button type="button" onClick={() => setForwardMsg(null)} aria-label={T('Yopish')}><X size={18} /></button>
            </div>
            <input
              type="text"
              className="tg-forward-search"
              placeholder={T('Qidirish...')}
              value={forwardSearch}
              onChange={(e) => setForwardSearch(e.target.value)}
            />
            <div className="tg-forward-list">
              {conversations
                .filter((c) => !forwardSearch.trim() || c.fullName?.toLowerCase().includes(forwardSearch.trim().toLowerCase()))
                .map((c) => (
                  <button key={c.userId} type="button" className="tg-forward-item" onClick={() => sendForwardTo(c.userId)}>
                    <img src={getImageUrl(c.avatar) || '/images/zumo-placeholder.svg'} alt="" />
                    <span>{c.fullName}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {reelViewer && (
        <Suspense fallback={null}>
          <MarketplaceReels reels={reelViewer} currentUser={user} viewerOnly onViewerClose={() => setReelViewer(null)} />
        </Suspense>
      )}

      {wallpaperOpen && (
        <div className="tg-wall-sheet" role="dialog" aria-modal="true" onClick={() => setWallpaperOpen(false)}>
          <div className="tg-wall-sheet__card" onClick={(e) => e.stopPropagation()}>
            <div className="tg-wall-sheet__head">
              <strong>{T('Chat foni')}</strong>
              <button type="button" onClick={() => setWallpaperOpen(false)} aria-label={T('Yopish')}><X size={18} /></button>
            </div>
            <div className="tg-wall-grid">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`tg-wall-opt ${w.id === wallpaper ? 'is-active' : ''}`}
                  onClick={() => chooseWallpaper(w.id)}
                >
                  <span className="tg-wall-opt__swatch" style={{ background: w.css || 'var(--tg-bg)', backgroundSize: w.size }}>
                    <i className="tg-wall-opt__b1" /><i className="tg-wall-opt__b2" />
                  </span>
                  <span>{w.label()}</span>
                </button>
              ))}
              <button
                type="button"
                className={`tg-wall-opt ${wallpaper === 'photo' ? 'is-active' : ''}`}
                onClick={() => wallpaperInputRef.current?.click()}
              >
                <span
                  className="tg-wall-opt__swatch tg-wall-opt__swatch--photo"
                  style={wallpaperImage ? { background: `url("${wallpaperImage}") center / cover` } : undefined}
                >
                  {!wallpaperImage && <ImageIcon size={26} />}
                </span>
                <span>{T('Galereyadan')}</span>
              </button>
              <input ref={wallpaperInputRef} type="file" accept="image/*" hidden onChange={pickWallpaperPhoto} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// To'liq ekranli rasm/video ko'rish. role="dialog" — Android "orqaga" tugmasi Escape yuboradi va oyna yopiladi
function MediaLightbox({ media, onClose }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="tg-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="tg-lightbox__close" onClick={onClose} aria-label={T('Yopish')}>
        <X size={24} />
      </button>
      {loading && <Loader2 className="tg-lightbox__spinner" size={36} aria-hidden="true" />}
      <div className="tg-lightbox__body" onClick={(e) => e.stopPropagation()}>
        {media.type === 'image' ? (
          <img src={media.url} alt="" onLoad={() => setLoading(false)} onError={() => setLoading(false)} />
        ) : (
          <video
            src={media.url}
            controls
            autoPlay
            playsInline
            controlsList="nodownload noplaybackrate"
            onLoadedData={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        )}
      </div>
    </div>
  );
}
