import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Service worker'ni ro'yxatdan o'tkazadi, foydalanuvchidan ruxsat so'raydi,
 * va push subscription'ni backendga saqlaydi. Bir marta chaqirilishi kifoya
 * (masalan login bo'lganda) — keyingi safar avvalgi subscription qayta
 * ishlatiladi.
 */
export const registerPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Bu brauzer push notification\'ni qo\'llab-quvvatlamaydi');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Foydalanuvchi push ruxsatini bermadi');
      return false;
    }

    const { data } = await api.get('/push/vapid-public-key');
    if (!data.publicKey) {
      console.error('VAPID public key backenddan kelmadi');
      return false;
    }
    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    await api.post('/push/subscribe', subscription.toJSON());
    return true;
  } catch (err) {
    console.error('Push registratsiya xatosi:', err);
    return false;
  }
};