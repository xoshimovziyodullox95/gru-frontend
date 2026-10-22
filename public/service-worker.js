/* ============================================================
   SERVICE WORKER — Web Push v5
   Navigate o'rniga openWindow ishlatamiz
   ============================================================ */

const SW_VERSION = 'v6';

self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'ZUMO', body: event.data?.text() || '' };
  }

  const title = data.title || 'ZUMO';

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'gru-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      requestId: data.requestId || null,
      type: data.type || null,
      status: data.status || null,
      dateOfArrival: Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const requestId = event.notification.data?.requestId;
  const type = event.notification.data?.type;
  const status = event.notification.data?.status;

  let url = event.notification.data?.url || '/';

  if (requestId && type === 'service_request') {
    url = `/?open_request=${requestId}`;
  }

  
if (status === 'completed') {
  url = `/?open_request=${requestId}&rate=1`;
} else if (type === 'status_change') {
  url = `/requests/${requestId}`;
}

  /* To'liq URL */
  const fullUrl = new URL(url, self.location.origin).href;

  console.log('[SW] Notification click →', fullUrl);

  event.waitUntil(
    (async () => {
      try {
        /* Ochiq tablarni ko'rish */
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });

        /* Faqat FAOL tab bo'lsa navigate */
        for (const client of clientList) {
          if (
            client.url.includes(self.location.origin) &&
            'focus' in client &&
            client.visibilityState !== 'hidden'
          ) {
            try {
              if (type === 'chat_message' && 'navigate' in client) {
                await client.navigate(fullUrl);
                await client.focus();
                return;
              }
              await client.focus();
              client.postMessage({
                type: 'OPEN_REQUEST',
                requestId,
              });
              return;
            } catch (err) {
              console.warn('[SW] focus xato:', err);
            }
          }
        }

        /* Yangi tab ochish */
        if (self.clients.openWindow) {
          await self.clients.openWindow(fullUrl);
        }
      } catch (err) {
        console.error('[SW] click handler xato:', err);

        /* Fallback */
        if (self.clients.openWindow) {
          await self.clients.openWindow(fullUrl);
        }
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', () => {
  console.log(`[SW] Install ${SW_VERSION}`);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW] Activate ${SW_VERSION}`);
  event.waitUntil(self.clients.claim());
});
