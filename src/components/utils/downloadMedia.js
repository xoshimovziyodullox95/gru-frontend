// Chatdagi rasm/videoni telefonga saqlash.
// Android ilovada — DownloadPlugin (DownloadManager → galereya), brauzerda — oddiy yuklab olish.
import { Capacitor, registerPlugin } from '@capacitor/core';
import toast from 'react-hot-toast';
import { T } from './T';

const Download = registerPlugin('Download');

const EXT = { image: 'jpg', video: 'mp4' };

function fileNameFor(url, type) {
  let name = '';
  try {
    name = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
  } catch { /* noto'g'ri manzil — nom o'zimiz beramiz */ }
  if (!name || !/\.[a-z0-9]{2,5}$/i.test(name)) name = `zumo_${Date.now()}.${EXT[type] || 'bin'}`;
  return name;
}

function mimeFor(name, type) {
  const ext = name.split('.').pop().toLowerCase();
  if (type === 'video') return ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

export async function downloadMedia(url, type = 'image') {
  if (!url) return;
  const fileName = fileNameFor(url, type);
  const mimeType = mimeFor(fileName, type);

  if (Capacitor.getPlatform() === 'android') {
    try {
      await Download.save({ url, fileName, mimeType });
      toast.success(T('Yuklab olinmoqda — galereyada paydo bo‘ladi'));
    } catch {
      toast.error(T('Yuklab bo‘lmadi'));
    }
    return;
  }

  if (Capacitor.isNativePlatform()) {
    // iOS: tizim oynasida ochamiz — u yerdan "Saqlash" mumkin
    const { Browser } = await import('@capacitor/browser');
    Browser.open({ url }).catch(() => toast.error(T('Yuklab bo‘lmadi')));
    return;
  }

  const id = toast.loading(T('Yuklab olinmoqda...'));
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    toast.success(T('Yuklab olindi'), { id });
  } catch {
    toast.dismiss(id);
    window.open(url, '_blank', 'noopener');
  }
}
