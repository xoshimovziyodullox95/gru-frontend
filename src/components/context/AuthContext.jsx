// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { markAccountCreated } from '../../hooks/useGuestMode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session olishda xatolik:', error);
        }
        if (isMounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          setLoading(false);
          // 🔥 Sahifa ochilganda hali amal qiladigan sessiya bo'lsa ham
          // "bu qurilmada hisob mavjud" belgisini qo'yamiz — LandingPage
          // shu orqali 3 ta tugma o'rniga 1 tasini ko'rsatadi.
          if (currentUser) markAccountCreated();
        }
      } catch (err) {
        console.error('Auth xatolik:', err);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        // 🔥 ASOSIY TUZATISH: har qanday muvaffaqiyatli kirish/ro'yxatdan
        // o'tish shu yerga tushadi — avval bu belgi hech qayerda
        // qo'yilmagan edi, shuning uchun ro'yxatdan o'tgan userga ham
        // doim 3 ta tugma chiqib turardi.
        if (currentUser) markAccountCreated();
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // 🔥 Logout qilganda faqat guest-mode flagini tozalaymiz.
      //    'gru_has_account' ni O'CHIRMAYMIZ — bu qurilmada foydalanuvchi
      //    ro'yxatdan o'tganini bildiradi va logoutdan keyin ham
      //    Landing sahifada faqat "Tizimga kirish" tugmasi chiqishi kerak.
    } catch (err) {
      console.error('Chiqishda xatolik:', err);
    }
  };

  const getUserRole = () => {
    return user?.user_metadata?.role || 'user';
  };

const isBusiness = () => {
  const role = getUserRole();
  return role === 'business' || role === 'company';
};

const isBankEmployee = () => {
  return getUserRole() === 'bank_employee';
};

const isAdmin = () => {
  return getUserRole() === 'admin';
};

const isPremium = () => {
  return user?.user_metadata?.isPremium || false;
};

const value = {
  user,
  loading,
  signOut,
  getUserRole,
  isBusiness,
  isBankEmployee,  // Yangi
  isAdmin,         // Yangi
  isPremium,
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};