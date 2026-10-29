/* ============================================================
   NOTIFICATION LISTENER
   Socket + Push + 3 ta modal (Request, Offer, Rating)
   ✅ Barcha hook'lar eng yuqori darajada
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { playDing } from '../services/chatSound';
import { getUserProfile } from '../services/user';
import { getSocket, registerSocketUser } from '../lib/socket';
import { registerPush } from '../services/push';
import {
  getServiceRequestById,
  acceptServiceRequestOffer,
} from '../services/serviceRequests';

import IncomingRequestModal from '../provider/IncomingRequestModal';
import IncomingOfferModal from '../client/IncomingOfferModal';

import '../../styles/notificationsPage.css';

import { T } from '../utils/T';
export default function NotificationListener() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // So'rov sahifasida takliflar o'sha yerda ko'rinadi — ustiga ikkinchi oyna ochmaymiz
  const pathRef = useRef(location.pathname);
  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);
  const isOnRequestPage = () =>
    pathRef.current === '/request' || pathRef.current.startsWith('/requests/');

  /* ============================================================
     ✅ BARCHA HOOK'LAR ENG YUQORIDA — shart emas, callback emas
     ============================================================ */

  const pushRegistered = useRef(false);
  const openedFromUrl = useRef(null);
  const lastStatusEventRef = useRef(null);

  const [incomingRequest, setIncomingRequest] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [incomingOffer, setIncomingOffer] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);


  /* ============================================================
     URL orqali modal (?open_request=xxx&rate=1)
     ============================================================ */

  useEffect(() => {
    if (!user) return undefined;

    const params = new URLSearchParams(location.search);
    const requestId = params.get('open_request');
    const openRating = params.get('rate') === '1';

    if (!requestId) return undefined;
    if (openedFromUrl.current === requestId) return undefined;

    openedFromUrl.current = requestId;

    console.log('🔔 URL orqali modal:', requestId, 'rating:', openRating);

    let cancelled = false;

    getServiceRequestById(requestId)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;

        /* Client + rate=1 → Rating modal */
        if (openRating && data.viewer === 'client' && !data.review?.rating) {
          // Baho endi alohida sahifada
          navigate(`/requests/${data._id}/done`, { replace: true });
        }
        /* Provider → Request modal */
        else if (data.viewer === 'provider') {
          setIncomingRequest({
            _id: data._id,
            category: data.category,
            description: data.description,
            location: data.location,
            client: data.client || null,
            createdAt: data.createdAt,
          });
          setIsRequestModalOpen(true);
        }

        window.history.replaceState({}, '', window.location.pathname);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('URL modal xato:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [user, location.search, navigate]);

  /* ============================================================
     Service Worker'dan message
     ============================================================ */

  useEffect(() => {
    if (!user) return undefined;
    if (!('serviceWorker' in navigator)) return undefined;

    const handleMessage = (event) => {
      const data = event.data;

      if (data?.type === 'OPEN_REQUEST' && data.requestId) {
        console.log('📨 SW dan xabar:', data);

        getServiceRequestById(data.requestId)
          .then((res) => {
            const req = res.data;

            if (req.viewer === 'provider') {
              setIncomingRequest({
                _id: req._id,
                category: req.category,
                description: req.description,
                location: req.location,
                client: req.client || null,
                createdAt: req.createdAt,
              });
              setIsRequestModalOpen(true);
            }
          })
          .catch((err) => console.warn('SW modal xato:', err));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [user]);

  /* ============================================================
     SOCKET + PUSH
     ============================================================ */

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;

    getUserProfile()
      .then((res) => {
        if (cancelled) return;

        const mongoUserId = res.data?._id;
        if (!mongoUserId) return;

        console.log('✅ NotificationListener: user', mongoUserId);

        /* Socket register */
        registerSocketUser(mongoUserId);

        /* Push register */
        if (!pushRegistered.current) {
          pushRegistered.current = true;

          registerPush()
            .then((ok) => {
              console.log('🔔 Push register:', ok ? 'OK' : 'FAIL');
            })
            .catch((err) => {
              console.warn('Push register xato:', err);
              pushRegistered.current = false;
            });
        }

        /* ============================================
           SOCKET HANDLERS
           ============================================ */

        const socket = getSocket();

        /* NEW NOTIFICATION */
        const handleNewNotification = (notif) => {
          const preferenceKey = {
            like: 'likes',
            dislike: 'likes',
            comment: 'comments',
            reply: 'comments',
            order: 'orders',
            service_request: 'orders',
            new_offer: 'orders',
            offer_accepted: 'orders',
            offer_declined: 'orders',
            ad_broadcast: 'ads',
            service_application: 'messages',
          }[notif?.type];
          if (preferenceKey) {
            try {
              const preferences = JSON.parse(localStorage.getItem('zumo_notification_preferences') || '{}');
              if (preferences[preferenceKey] === false) return;
            } catch {
              // Noto‘g‘ri saqlangan sozlama bildirishnomalarni bloklamasin.
            }
          }

          console.log('📥 Notification:', notif);

          playDing();
          navigator.vibrate?.([200, 100, 200]);

          const fromName =
            notif.fromUserId?.fullName ||
            notif.fromUserId?.full_name ||
            T('Foydalanuvchi');

          /* 🔧 Service request — Provider modal */
          if (notif.type === 'service_request') {
            setIncomingRequest({
              _id: notif.itemId,
              category: notif.orderInfo?.title || 'Xizmat',
              description: notif.commentText || '',
              location: notif.location || null,
              createdAt: notif.createdAt || new Date().toISOString(),
            });
            setIsRequestModalOpen(true);
            return;
          }

          /* 💰 New offer — Client modal */
          if (notif.type === 'new_offer' && isOnRequestPage()) return;
          if (notif.type === 'new_offer') {
            setIncomingOffer({
              _id: notif.offerId,
              price: notif.orderInfo?.price || 0,
              message: notif.commentText || '',
              arrivalMinutes: notif.arrivalMinutes || 30,
              status: 'pending',
              createdAt: notif.createdAt,
              provider: {
                _id: notif.fromUserId?._id,
                name: notif.fromUserId?.fullName || T('Usta'),
              },
            });
            setCurrentRequest({
              _id: notif.itemId,
              category: notif.orderInfo?.title,
            });
            setIsOfferModalOpen(true);
            return;
          }

          /* Boshqa */
          if (notif.type === 'offer_accepted') {
            toast.success(T('🎉 Taklifingiz qabul qilindi!'), {
              toastId: `accepted-${notif.itemId}`,
            });
          } else if (notif.type === 'offer_declined') {
            toast.warn(T('Mijoz boshqa taklifni tanladi'), {
              toastId: `declined-${notif.itemId}`,
            });
          } else if (notif.type === 'order') {
            const orderStatusMessages = {
              qabul_qilindi: 'Buyurtmangiz sotuvchi tomonidan qabul qilindi',
              yetkazilmoqda: 'Buyurtmangiz yo‘lga chiqdi',
              yetkazildi: 'Buyurtmangiz yetkazildi',
            };
            const statusMessage = notif.orderInfo?.status
              ? orderStatusMessages[notif.orderInfo.status] || T('Buyurtma holati yangilandi')
              : T('{{fromName}} sizga buyurtma berdi', { fromName: fromName });
            toast.info(statusMessage, {
              toastId: `order-${notif.itemId}`,
            });
          } else if (notif.type === 'like') {
            toast.info(T('{{fromName}} postingizga like bosdi', { fromName: fromName }), {
              toastId: `like-${notif.itemId}`,
            });
          } else if (notif.type === 'comment' || notif.type === 'reply') {
            toast.info(
              `${fromName}: "${notif.commentText || notif.replyText || ''}"`,
              { toastId: `comment-${notif.itemId}` }
            );
          } else if (notif.type === 'ad_broadcast') {
            toast.info(T('{{fromName}} yangi reklama yubordi', { fromName: fromName }), {
              toastId: `broadcast-ad-${notif.itemId}`,
            });
          }
        };

        /* REQUEST UPDATED — yangi offer */
        const handleRequestUpdated = (data) => {
          console.log('📥 request_updated:', data);
          if (!data?.offer) return;
          if (isOnRequestPage()) return;

          setIncomingOffer({
            _id: data.offer._id,
            price: data.offer.price,
            message: data.offer.message,
            arrivalMinutes: data.offer.arrivalMinutes || 30,
            status: data.offer.status || 'pending',
            createdAt: data.offer.createdAt,
            provider: data.offer.provider || { name: T('Usta') },
          });
          setCurrentRequest({ _id: data.requestId });
          setIsOfferModalOpen(true);
        };

        /* STATUS CHANGED — completed bo'lsa rating */
        const handleStatusChanged = async (data) => {
          console.log('📥 Status changed:', data);

          if (data.status !== 'completed') return;

          /* ✅ Dublikat guard */
          const eventKey = `${data.requestId}-${data.status}-${data.at}`;

          if (lastStatusEventRef.current === eventKey) {
            console.log('⚠️ Dublikat event — o\'tkazib yuborildi');
            return;
          }
          lastStatusEventRef.current = eventKey;

          try {
            const res = await getServiceRequestById(data.requestId);
            const request = res.data;

            if (request.viewer !== 'client') return;
            if (request.review?.rating) return;

            console.log('⭐ Rating modal ochilmoqda:', request._id);
            navigate(`/requests/${request._id}/done`);
          } catch (err) {
            console.warn('Rating modal xato:', err);
          }
        };

        /* Ro'yxatga olish */
        socket.on('new_notification', handleNewNotification);
        socket.on('request_updated', handleRequestUpdated);
        socket.on('request_status_changed', handleStatusChanged);

        socket.__notifHandler = handleNewNotification;
        socket.__reqHandler = handleRequestUpdated;
        socket.__statusHandler = handleStatusChanged;
      })
      .catch((err) => {
        console.warn('Notification setup xatosi:', err);
      });

    return () => {
      cancelled = true;

      const socket = getSocket();

      if (socket?.__notifHandler) {
        socket.off('new_notification', socket.__notifHandler);
        delete socket.__notifHandler;
      }
      if (socket?.__reqHandler) {
        socket.off('request_updated', socket.__reqHandler);
        delete socket.__reqHandler;
      }
      if (socket?.__statusHandler) {
        socket.off('request_status_changed', socket.__statusHandler);
        delete socket.__statusHandler;
      }
    };
  }, [user, navigate]);

  /* ============================================================
     MODAL HANDLERS — Provider (request)
     ============================================================ */

  const handleRequestClose = () => {
    setIsRequestModalOpen(false);
    setIncomingRequest(null);
  };

  const handleRequestReject = (request) => {
    console.log('❌ Rad etildi:', request);
    handleRequestClose();
  };

  const handleRequestView = () => {
    handleRequestClose();
    navigate('/provider-requests');
  };

  /* ============================================================
     MODAL HANDLERS — Client (offer)
     ============================================================ */

  const handleOfferClose = () => {
    setIsOfferModalOpen(false);
    setIncomingOffer(null);
    setCurrentRequest(null);
  };

  const handleOfferAccept = async (offer) => {
    try {
      const requestId = currentRequest?._id;
      if (!requestId) return;

      await acceptServiceRequestOffer(requestId, offer._id);
      toast.success(T('🎉 Usta tanlandi!'), {
        toastId: `accept-${requestId}`,
      });

      handleOfferClose();
      navigate(`/requests/${requestId}`);
    } catch (err) {
      toast.error(
        err.response?.data?.error || T('Qabul qilib bo\'lmadi'),
        { toastId: `accept-error-${currentRequest?._id}` }
      );
    }
  };

  const handleOfferView = () => {
    const requestId = currentRequest?._id;
    handleOfferClose();
    if (requestId) navigate(`/requests/${requestId}`);
  };

  /* ============================================================
     MODAL HANDLERS — Client (rating)
     ============================================================ */



  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <IncomingRequestModal
        isOpen={isRequestModalOpen}
        request={incomingRequest}
        onClose={handleRequestClose}
        onReject={handleRequestReject}
        onView={handleRequestView}
      />

      <IncomingOfferModal
        isOpen={isOfferModalOpen}
        offer={incomingOffer}
        request={currentRequest}
        onClose={handleOfferClose}
        onAccept={handleOfferAccept}
        onView={handleOfferView}
      />

    </>
  );
}
