import { useState, useEffect, useCallback } from 'react';

const GUEST_KEY = 'gru_guest_mode';
const ACCOUNT_KEY = 'gru_has_account';
const RETURN_PATH_KEY = 'gru_return_path';

// 🔥 Guest holatini boshqaruvchi hook
export function useGuestMode() {
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');

  useEffect(() => {
    const onStorage = () => setIsGuest(localStorage.getItem(GUEST_KEY) === 'true');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Guest sifatida kirish (Tizimga kirish — ro'yxatdan o'tmasdan)
  const enterAsGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, 'true');
    setIsGuest(true);
  }, []);

  // Guest holatidan chiqish (logout qilinganda yoki signup bo'lganda)
  const exitGuest = useCallback(() => {
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
  }, []);

  return { isGuest, enterAsGuest, exitGuest };
}

// 🔥 Ro'yxatdan muvaffaqiyatli o'tgandan keyin RegisterPage.jsx da chaqiriladi
export function markAccountCreated() {
  localStorage.setItem(ACCOUNT_KEY, 'true');
  localStorage.removeItem(GUEST_KEY);
}

// 🔥 Bu qurilmada avval ro'yxatdan o'tilganmi — logout qilinsa ham TRUE bo'lib qoladi
export function hasAccountBefore() {
  return localStorage.getItem(ACCOUNT_KEY) === 'true';
}

// ============================================================
// 🔥 QAYTISH MANZILI (refresh bo'lganda foydalanuvchi qayerda
//    turgan bo'lsa — "Tizimga kirish"ni bosgach o'sha yerga qaytishi uchun)
// ============================================================

// Manzilni saqlash (EntryGate refresh payti chaqiradi)
export function setReturnPath(path) {
  if (path && path !== '/') {
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  }
}

// Manzilni o'qish (o'chirmasdan)
export function getReturnPath() {
  return sessionStorage.getItem(RETURN_PATH_KEY) || '';
}

// Manzilni tozalash (ishlatilgandan keyin)
export function clearReturnPath() {
  sessionStorage.removeItem(RETURN_PATH_KEY);
}