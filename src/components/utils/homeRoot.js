// Foydalanuvchi qaysi "bosh sahifa"dan kelganini eslab qolamiz (/home yoki /marketplace),
// toki e'lon sahifasidagi ✕, ZUMO logosi va "Asosiy" tabi aynan o'sha joyga qaytarsin.
const KEY = 'zumo_home_root';

export function rememberHomeRoot(path) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, idx: window.history.state?.idx ?? null }));
  } catch { /* xotira yopiq — standart /marketplace ishlatiladi */ }
}

function readRoot() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function getHomeRoot(fallback = '/marketplace') {
  return readRoot()?.path || fallback;
}

// Bosh sahifa tarixda orqada turgan bo'lsa — yangi yozuv qo'shmasdan o'sha yozuvga qaytamiz
export function goHomeRoot(navigate, path) {
  const saved = readRoot();
  const idx = window.history.state?.idx;
  if (saved?.path === path && Number.isInteger(saved.idx) && Number.isInteger(idx) && idx > saved.idx) {
    navigate(saved.idx - idx);
    return;
  }
  navigate(path, { replace: true });
}
