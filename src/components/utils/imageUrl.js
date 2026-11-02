// Backend manzili (…/api siz) — rasm, video va chat fayllari shu yerdan olinadi
export const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

export function getImageUrl(path) {
  if (!path) return '/images/zumo-placeholder.svg';
  if (path.startsWith('http')) return path;   // allaqachon to'liq manzil
  return `${BACKEND_ORIGIN}${path}`;
}
// Savat/sevimlilar kabi joylarda saqlangan rasm — kartochkadagi bilan bir xil: server yo'llari
// (/uploads/..., /images/equipment/...) to'liq manzilga aylanadi, faqat ilovaning ZUMO belgisi joyida qoladi
export function resolveMediaUrl(path, fallback = '/images/zumo-placeholder.svg') {
  if (!path || path === fallback) return fallback;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return getImageUrl(path);
}
