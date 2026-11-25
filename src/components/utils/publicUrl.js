// Ulashiladigan havolalar uchun ochiq sayt manzili.
// Ilova ichida window.location.origin "capacitor://localhost" (iPhone) yoki "https://localhost" (Android) —
// bunday havola boshqa odamda ochilmaydi. Shuning uchun ilovada VITE_PUBLIC_WEB_URL ishlatiladi.
import { Capacitor } from '@capacitor/core';

const configured = String(import.meta.env.VITE_PUBLIC_WEB_URL || '').replace(/\/+$/, '');

export function publicOrigin() {
  if (Capacitor.isNativePlatform() && configured) return configured;
  return window.location.origin;
}

export const publicUrl = (path = '') => `${publicOrigin()}${path}`;
