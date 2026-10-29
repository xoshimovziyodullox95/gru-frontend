/* ============================================================
   PUSH SERVICE — Universal
   ============================================================ */

import { Capacitor } from '@capacitor/core';
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
  // Ilova ichida (Capacitor) — 'ios' | 'android', brauzerda — 'web'
  return Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
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
   REGISTER — MOBILE (Firebase Cloud Messaging, Android va iOS)
   ============================================================ */

let mobileToken = null;
let mobileListenersAdded = false;

// Bildirishnoma bosilganda ilova ichida kerakli sahifani ochadi (BrowserRouter popstate'ni tinglaydi)
function openFromPush(url) {
  if (!url || !url.startsWith('/')) return;
  window.history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

async function registerMobilePush(platform) {
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

    let { receive } = await FirebaseMessaging.checkPermissions();
    if (receive === 'prompt' || receive === 'prompt-with-rationale') {
      ({ receive } = await FirebaseMessaging.requestPermissions());
    }
    if (receive !== 'granted') return false;

    if (!mobileListenersAdded) {
      mobileListenersAdded = true;
      await FirebaseMessaging.addListener('tokenReceived', ({ token }) => {
        if (token && token !== mobileToken) {
          mobileToken = token;
          api.post('/push/subscribe', { platform, fcmToken: token }).catch(() => {});
        }
      });
      await FirebaseMessaging.addListener('notificationActionPerformed', ({ notification }) => {
        openFromPush(notification?.data?.url);
      });
    }

    const { token } = await FirebaseMessaging.getToken();
    if (!token) return false;
    mobileToken = token;
    await api.post('/push/subscribe', { platform, fcmToken: token });
    return true;
  } catch (err) {
    // Firebase sozlanmagan bo'lsa (google-services.json yo'q) — ilova ishlashda davom etadi
    console.warn('Mobile push registratsiya xatosi:', err?.message || err);
    return false;
  }
}

/* ============================================================
   ASOSIY FUNKSIYA
   ============================================================ */

export const registerPush = async () => {
  const platform = detectPlatform();

  if (platform === 'web') {
    return registerWebPush();
  }

  return registerMobilePush(platform);
};

/* ============================================================
   UNREGISTER
   ============================================================ */

export const unregisterPush = async () => {
  try {
    if (detectPlatform() !== 'web') {
      if (mobileToken) await api.post('/push/unsubscribe', { fcmToken: mobileToken });
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      await FirebaseMessaging.deleteToken().catch(() => {});
      mobileToken = null;
      return true;
    }

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