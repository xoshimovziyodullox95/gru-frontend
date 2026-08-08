const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

export function getImageUrl(path) {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http')) return path;   // allaqachon to'liq manzil
  return `${BACKEND_ORIGIN}${path}`;
}