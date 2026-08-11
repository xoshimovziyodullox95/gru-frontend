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