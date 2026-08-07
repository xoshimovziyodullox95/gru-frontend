import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bell, Heart, MessageCircle as CommentIcon, ShoppingBag, CheckCheck } from 'lucide-react';
import { getNotifications, markOneRead, markAllRead } from '../services/notifications';
import '../../styles/notificationsPage.css';

// ============================================================
// Bitta notification qatori
// ============================================================
function NotificationRow({ notif, onClick, t }) {
  const fromName = notif.fromUserId?.fullName || t('notifications.user');
  const avatarUrl = notif.fromUserId?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fromName)}&background=00E5FF&color=fff&rounded=true&size=44`;

  let icon = <Bell size={16} />;
  let text = t('notifications.newNotification');

  if (notif.type === 'like') {
    icon = <Heart size={16} color="#ff3040" />;
    text = t('notifications.liked');
  } else if (notif.type === 'comment') {
    icon = <CommentIcon size={16} color="#0095f6" />;
    const commentText = notif.commentText || '';
    text = t('notifications.commented') + (commentText ? `: "${commentText}"` : '');
  } else if (notif.type === 'reply') {
    icon = <CommentIcon size={16} color="#0095f6" />;
    const replyText = notif.replyText || '';
    text = t('notifications.replied') + (replyText ? `: "${replyText}"` : '');
  } else if (notif.type === 'order') {
    icon = <ShoppingBag size={16} color="#00E5FF" />;
    const qty = notif.orderInfo?.quantity;
    const title = notif.orderInfo?.title || '';
    let orderText = t('notifications.ordered');
    if (title) {
      orderText += `: ${title}`;
      if (qty && qty > 0) {
        orderText += t('notifications.orderDetails', { quantity: qty });
      }
    } else if (qty && qty > 0) {
      orderText += t('notifications.orderDetails', { quantity: qty });
    }
    text = orderText;
  }

  return (
    <div
      className={`notif-row ${notif.read ? 'notif-row--read' : 'notif-row--unread'}`}
      onClick={() => onClick(notif)}
    >
      <img src={avatarUrl} alt={fromName} className="notif-row-avatar" />
      <div className="notif-row-icon">{icon}</div>
      <div className="notif-row-content">
        <p>
          <strong>{fromName}</strong> {text}
        </p>
        <span className="notif-row-time">
          {new Date(notif.createdAt).toLocaleString()}
        </span>
      </div>
      {!notif.read && <span className="notif-row-dot" />}
    </div>
  );
}

// ============================================================
// Asosiy sahifa
// ============================================================
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((res) => setNotifs(res.data))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = async (notif) => {
    try {
      await markOneRead(notif._id);
      setNotifs((prev) => prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)));
    } catch (e) {
      // o'qilgan deb belgilash muvaffaqiyatsiz bo'lsa ham navigatsiyani to'xtatmaymiz
    }

    if (notif.itemType === 'location') {
      navigate(`/location/${notif.itemId}`);
    } else if (notif.itemType === 'equipment') {
      navigate(`/equipment/${notif.itemId}`);
    } else if (notif.itemType === 'serviceprovider') {
      navigate(`/services/${notif.itemId}`);
    } else if (notif.itemType === 'post') {
      navigate(`/video/${notif.itemId}`);
    } else {
      navigate('/notifications');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <button className="notif-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>{t('notifications.title')}</h1>
        {notifs.some((n) => !n.read) && (
          <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="notifications-loading"><span className="loader" /></div>
      ) : notifs.length === 0 ? (
        <div className="notifications-empty">
          <Bell size={40} className="empty-icon" />
          <p>{t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifs.map((notif) => (
            <NotificationRow key={notif._id} notif={notif} onClick={handleClick} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}