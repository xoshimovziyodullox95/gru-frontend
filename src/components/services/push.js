/* ============================================================
   PUSH SERVICE — Universal
   ============================================================ */

import api from './api';

/* ============================================================
   HELPERS
   ============================================================ */

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/* ============================================================
   PLATFORM DETECTION
   ============================================================ */

function detectPlatform() {
  /*
   * Kelajakda React Native qo'shganda:
   *   import { Platform } from 'react-native';
   *   if (Platform.OS === 'ios') return 'ios';
   *   if (Platform.OS === 'android') return 'android';
   *
   * Hozircha faqat web.
   */
  return 'web';
}

/* ============================================================
   REGISTER — WEB
   ============================================================ */

async function registerWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Bu brauzer push qo'llab-quvvatlamaydi");
    return false;
  }

  try {
    /* 1. Service worker register */
    const registration = await navigator.serviceWorker.register(
      '/service-worker.js'
    );
    await navigator.serviceWorker.ready;

    /* 2. Ruxsat so'rash */
    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('Push ruxsati berilmadi');
      return false;
    }

    /* 3. VAPID public key */
    const { data } = await api.get('/push/vapid-public-key');

    if (!data?.publicKey) {
      console.error('VAPID public key backenddan kelmadi');
      return false;
    }

    /* 4. Subscription */
    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
    }

    /* 5. Backend'ga saqlash — ✅ platform bilan */
    await api.post('/push/subscribe', {
      platform: 'web',
      ...subscription.toJSON(),
    });

    console.log("✅ Web push ro'yxatdan o'tdi");
    return true;
  } catch (err) {
    console.error('Web push registratsiya xatosi:', err);
    return false;
  }
}

/* ============================================================
   REGISTER — MOBILE (kelajakda)
   ============================================================ */

async function registerMobilePush() {
  /*
   * ⚠️ Hozircha o'chirilgan.
   * React Native qo'shganda bu funksiyani to'ldirasiz:
   *
   * import messaging from '@react-native-firebase/messaging';
   *
   * 1. Ruxsat so'rash
   * 2. FCM tokenni olish: await messaging().getToken()
   * 3. Backend'ga yuborish:
   *    await api.post('/push/subscribe', {
   *      platform: Platform.OS,  // 'ios' | 'android'
   *      fcmToken: token,
   *      deviceName: DeviceInfo.getModel(),
   *    });
   */

  console.warn('Mobile push hali qo\'shilmagan');
  return false;
}

/* ============================================================
   ASOSIY FUNKSIYA
   ============================================================ */

export const registerPush = async () => {
  const platform = detectPlatform();

  if (platform === 'web') {
    return registerWebPush();
  }

  return registerMobilePush();
};

/* ============================================================
   UNREGISTER
   ============================================================ */

export const unregisterPush = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        await api.post('/push/unsubscribe', {
          endpoint: subscription.endpoint,
        });

        await subscription.unsubscribe();
      }
    }

    return true;
  } catch (err) {
    console.error('Push o\'chirishda xato:', err);
    return false;
  }
};

/* ============================================================
   TEST
   ============================================================ */

export const sendTestPush = async () => {
  const { data } = await api.post('/push/test');
  return data;
};

/* ============================================================
   DEBUG
   ============================================================ */

export const getMyTokens = async () => {
  const { data } = await api.get('/push/my-tokens');
  return data;
};