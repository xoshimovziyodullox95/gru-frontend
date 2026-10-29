// src/components/common/ShareSheet.jsx
/* ============================================================
   SHARE SHEET — ZUMO sayt dizayniga mos (cyan + glow)
   ============================================================ */

import { useState, useEffect, useMemo } from 'react';
import {
  X, Search, Link as LinkIcon, Check, Send, Loader2,
  MessageCircle, Film, Camera, Video, Copy, Share2, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/user';
import { getConversations, sendMessage } from '../services/chat';
import toast from 'react-hot-toast';
import '../../styles/share-sheet.css';

import { T } from '../utils/T';
const AVATAR_PLACEHOLDER = '/images/zumo-placeholder.svg';

function toIdStr(v) {
  if (!v) return '';
  if (typeof v === 'object') return String(v._id || v.id || v);
  return String(v);
}

export default function ShareSheet({ isOpen, onClose, reel, listing }) {
  const shareItem = listing || reel;
  const isListing = Boolean(listing);
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    setSearch('');
    setCopied(false);

    Promise.all([getAllUsers(), getConversations()])
      .then(([usersRes, convRes]) => {
        const myId = toIdStr(user.id || user._id);
        const all = usersRes.data || [];
        const convs = convRes.data || [];
        const convIds = convs.map((c) => c.userId);

        const filtered = all.filter(
          (u) => toIdStr(u._id || u.id) !== myId
        );

        const sorted = [...filtered].sort((a, b) => {
          const aIdx = convIds.indexOf(toIdStr(a._id || a.id));
          const bIdx = convIds.indexOf(toIdStr(b._id || b.id));
          if (aIdx === -1 && bIdx === -1) return 0;
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });

        setUsers(sorted);
      })
      .catch((err) => {
        console.error('ShareSheet load xato:', err);
        toast.error(T('Foydalanuvchilarni yuklab bo\'lmadi'));
      })
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.fullName || u.full_name || u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  if (!isOpen || !shareItem) return null;

  const buildUrl = () => {
    if (shareItem.itemType === 'youtube-external') return shareItem.link || '';
    return `${window.location.origin}${shareItem.link || ''}`;
  };

  const buildMessage = () => {
    const url = buildUrl();
    const title = encodeURIComponent(shareItem.title || (isListing ? 'E’lon' : 'Video'));
    const thumb = shareItem.thumbnailUrl ? encodeURIComponent(shareItem.thumbnailUrl) : '';
    if (isListing) {
      return `LISTING::${encodeURIComponent(listing.listingType || 'listing')}::${encodeURIComponent(url)}::${title}::${thumb}::${encodeURIComponent(listing.price || '')}`;
    }
    return `REEL::${url}::${title}::${thumb}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl());
      setCopied(true);
      toast.success(T('Havola nusxalandi'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(T('Nusxalashda xatolik'));
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareItem.title || (isListing ? T('E’lon') : T('Video')),
          url: buildUrl(),
        });
      } catch (err) {
        if (err.name !== 'AbortError') handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleSend = async (targetUser) => {
    const targetId = toIdStr(targetUser._id || targetUser.id);
    setSending(targetId);
    try {
      await sendMessage({ to: targetId, message: buildMessage() });
      toast.success(
        T('{{v}}ga yuborildi', { v: targetUser.fullName || 'Foydalanuvchi' })
      );
      onClose();
    } catch (err) {
      console.error('Send xato:', err);
      toast.error(T('Yuborilmadi'));
    } finally {
      setSending(null);
    }
  };

  const previewThumb = shareItem.thumbnailUrl || null;
  const quickUsers = users.slice(0, 8);

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="share-header">
          <div className="share-header__title">
            <Share2 size={18} strokeWidth={2.4} />
            <h2>{T('Ulashish')}</h2>
          </div>
          <button
            type="button"
            className="share-close"
            onClick={onClose}
            aria-label={T('Yopish')}
          >
            <X size={18} strokeWidth={2.6} />
          </button>
        </header>

        {/* Preview */}
        <div className="share-preview">
          <div className="share-preview__thumb">
            {previewThumb ? (
              <img
                src={previewThumb}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : isListing ? (
              <Users size={22} strokeWidth={1.8} />
            ) : (
              <Film size={22} strokeWidth={1.8} />
            )}
          </div>
          <div className="share-preview__info">
            <strong>{shareItem.title || (isListing ? T('E’lon') : T('Video'))}</strong>
            <small>{buildUrl()}</small>
          </div>
        </div>

        {/* Quick people */}
        {quickUsers.length > 0 && (
          <div className="share-people">
            {quickUsers.map((u) => {
              const uid = toIdStr(u._id || u.id);
              const isSending = sending === uid;
              return (
                <button
                  key={uid}
                  type="button"
                  className={`share-person ${isSending ? 'sending' : ''}`}
                  onClick={() => handleSend(u)}
                  disabled={isSending}
                >
                  <span className="share-person__avatar">
                    <img
                      src={u.avatar_url || AVATAR_PLACEHOLDER}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = AVATAR_PLACEHOLDER;
                      }}
                    />
                    {isSending && (
                      <span className="share-person__load">
                        <Loader2 size={16} className="spin" />
                      </span>
                    )}
                  </span>
                  <span className="share-person__name">
                    {(u.fullName || u.email || '').split(' ')[0]}
                  </span>
                  <span className="share-person__sub">{T('Yuborish')}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="share-search">
          <Search size={16} strokeWidth={2.4} />
          <input
            type="text"
            placeholder={T('Qidirish...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="share-search__clear"
              onClick={() => setSearch('')}
              aria-label={T('Tozalash')}
            >
              <X size={14} strokeWidth={2.6} />
            </button>
          )}
        </div>

        {/* Users list */}
        <div className="share-list">
          {loading ? (
            <div className="share-loading">
              <Loader2 size={24} className="spin" />
              <span>{T('Yuklanmoqda...')}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="share-empty">
              <Search size={28} strokeWidth={1.8} />
              <span>
                {search ? T('Topilmadi') : T('Suhbatlar yo\'q')}
              </span>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const uid = toIdStr(u._id || u.id);
              const isSending = sending === uid;

              return (
                <button
                  key={uid}
                  type="button"
                  className={`share-user ${isSending ? 'sending' : ''}`}
                  onClick={() => handleSend(u)}
                  disabled={isSending}
                >
                  <div className="share-user__avatar">
                    <img
                      src={u.avatar_url || AVATAR_PLACEHOLDER}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = AVATAR_PLACEHOLDER;
                      }}
                    />
                    {u.isOnline && <span className="share-user__online" />}
                  </div>
                  <div className="share-user__info">
                    <strong>{u.fullName || u.email}</strong>
                    <small>{u.email}</small>
                  </div>
                  <span className="share-user__send">
                    {isSending ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Send size={16} strokeWidth={2.4} />
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom apps */}
        <div className="share-apps">
          <button
            type="button"
            className={`share-app ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            <span className="share-app__icon">
              {copied ? (
                <Check size={20} strokeWidth={2.4} />
              ) : (
                <LinkIcon size={20} strokeWidth={2.2} />
              )}
            </span>
            <span>{copied ? T('Nusxa') : T('Havola')}</span>
          </button>

          <button
            type="button"
            className="share-app"
            onClick={() => {
              const text = `${shareItem.title || (isListing ? 'E’lon' : 'Video')}\n${buildUrl()}`;
              navigator.clipboard.writeText(text);
              toast.success(T('Matn nusxalandi'));
            }}
          >
            <span className="share-app__icon">
              <Copy size={20} strokeWidth={2.2} />
            </span>
            <span>{T('Matn')}</span>
          </button>

          <button
            type="button"
            className="share-app"
            onClick={handleNativeShare}
          >
            <span className="share-app__icon">
              <Share2 size={20} strokeWidth={2.2} />
            </span>
            <span>{T('Boshqa')}</span>
          </button>

          <button
            type="button"
            className="share-app"
            onClick={() => {
              navigator.clipboard.writeText(buildUrl());
              toast.success(T('Story uchun nusxalandi'));
            }}
          >
            <span className="share-app__icon">
              <Camera size={20} strokeWidth={2.2} />
            </span>
            <span>{T('Story')}</span>
          </button>

          <button
            type="button"
            className="share-app"
            onClick={() => {
              navigator.clipboard.writeText(buildUrl());
              toast.success(T('Telegram uchun nusxalandi'));
            }}
          >
            <span className="share-app__icon">
              <Send size={20} strokeWidth={2.2} />
            </span>
            <span>{T('Telegram')}</span>
          </button>

          <button
            type="button"
            className="share-app"
            onClick={() => {
              navigator.clipboard.writeText(buildUrl());
              toast.success(T('WhatsApp uchun nusxalandi'));
            }}
          >
            <span className="share-app__icon">
              <MessageCircle size={20} strokeWidth={2.2} />
            </span>
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            className="share-app"
            onClick={() => {
              navigator.clipboard.writeText(buildUrl());
              toast.success(T('Video uchun nusxalandi'));
            }}
          >
            <span className="share-app__icon">
              <Video size={20} strokeWidth={2.2} />
            </span>
            <span>{T('Video')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
