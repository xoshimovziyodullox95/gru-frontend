import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/user';
import { getSocket, registerSocketUser } from '../lib/socket';
import { registerPush } from '../services/push';
import '../../styles/Notificationspage.css'

export default function NotificationListener() {
  const { user } = useAuth();
  const soundRef = useRef(null);

  useEffect(() => {
    if (!soundRef.current) {
      soundRef.current = new Audio('/sounds/notification.mp3');
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getUserProfile()
      .then((res) => {
        if (cancelled) return;
        const mongoUserId = res.data?._id;
        if (!mongoUserId) return;

        // 1) Real-time (sayt ochiq bo'lganda darrov)
        registerSocketUser(mongoUserId);

        // 2) Push (sayt yopiq bo'lsa ham, brauzer fonda ishlasa keladi)
        registerPush();

        const socket = getSocket();

        const handleNewNotification = (notif) => {
          soundRef.current?.play().catch(() => {});

          const fromName = notif.fromUserId?.fullName || 'Foydalanuvchi';

          if (notif.type === 'order') {
            toast.info(
              `${fromName} sizga buyurtma berdi: ${notif.orderInfo?.title || ''}`
            );
          } else if (notif.type === 'like') {
            toast.info(`${fromName} postingizga like bosdi`);
          } else if (notif.type === 'comment' || notif.type === 'reply') {
            toast.info(`${fromName}: "${notif.commentText || notif.replyText || ''}"`);
          } else {
            toast.info(`${fromName} sizga yangi bildirishnoma yubordi`);
          }
        };

        socket.on('new_notification', handleNewNotification);
        socket.__notifHandler = handleNewNotification;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      const socket = getSocket();
      if (socket.__notifHandler) {
        socket.off('new_notification', socket.__notifHandler);
        delete socket.__notifHandler;
      }
    };
  }, [user]);

  return null;
}