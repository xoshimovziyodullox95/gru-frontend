// src/components/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReturnPath, clearReturnPath, markAccountCreated } from '../../hooks/useGuestMode';
import PhoneOtpLoginForm from '../forms/PhoneOtpLoginForm';
import { getUserProfile } from '../services/user';
import AuthBackButton from '../common/AuthBackButton';
import { signInWithGoogle, authRedirectUrl } from '../utils/googleAuth';
import AppleSignInButton from '../common/AppleSignInButton';
import '../../styles/auth.css';

import { T } from '../utils/T';
export default function LoginPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Landing'dan yuborilgan "qaytish manzili" (masalan refresh bo'lgan sahifa)
  //    Ustuvorlik: location.state.from > sessionStorage'dagi return path > default
  const getTarget = (roleBasedFallback) => {
    const fromState = location.state?.from;
    const fromStorage = getReturnPath();
    return fromState || fromStorage || roleBasedFallback;
  };

  // 🔥 Agar user allaqachon login bo'lsa (masalan sahifani to'g'ridan-to'g'ri
  //    ochib qo'ygan bo'lsa) — kerakli manzilga yo'naltiramiz
useEffect(() => {
  let cancelled = false;
  const redirectAuthenticatedUser = async () => {
    if (!user) return;
    let role = user.user_metadata?.role || 'user';

    // SMS bilan kirgan foydalanuvchining import qilingan roli backendda
    // telefon tasdiqlangandan keyin aniqlanadi.
    if (user.user_metadata?.auth_method === 'phone_otp') {
      try {
        const { data } = await getUserProfile();
        role = data?.role || role;
      } catch {
        // Backend vaqtincha javob bermasa, Supabase metadata bo‘yicha davom etamiz.
      }
    }
    if (cancelled) return;

    let fallback = '/home';
    if (role === 'company' || role === 'business') fallback = '/dashboard';
    if (role === 'bank_employee') fallback = '/bank-dashboard';
    if (role === 'admin') fallback = '/admin-dashboard';
    const target = getTarget(fallback);
    clearReturnPath();
    navigate(target, { replace: true });
  };
  void redirectAuthenticatedUser();
  return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, navigate]);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResend(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Xatolikni tahlil qilish
        if (error.message.includes('Invalid login credentials')) {
          setError(T('❌ Email yoki parol noto‘g‘ri. Iltimos, qayta tekshirib ko‘ring.'));
        } else if (error.message.includes('Email not confirmed')) {
          setError(T('📧 Emailingiz tasdiqlanmagan. Iltimos, pochtangizni tekshiring.'));
          setShowResend(true);
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      // Login muvaffaqiyatli
  // Login muvaffaqiyatli
toast.success(T('✅ Xush kelibsiz!'));
const role = data.user?.user_metadata?.role || 'user';
let fallback = '/home';
if (role === 'company' || role === 'business') fallback = '/dashboard';
if (role === 'bank_employee') fallback = '/bank-dashboard';
if (role === 'admin') fallback = '/admin-dashboard';
const target = getTarget(fallback);
clearReturnPath();
navigate(target, { replace: true });
    } catch (err) {
      setError(T('Tizimda xatolik yuz berdi'));
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: { emailRedirectTo: authRedirectUrl() },
      });
      if (error) throw error;
      toast.success(T('✅ Tasdiqlash emaili qayta yuborildi!'));
      setShowResend(false);
    } catch (err) {
      toast.error(err.message || T('Xatolik yuz berdi'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 🔥 Google orqali kirish ham (birinchi marta bo'lsa) signup hisoblanadi —
      //    shu sabab bu qurilmada "ro'yxatdan o'tgan" deb belgilaymiz,
      //    Landing'ga qaytganda faqat "Tizimga kirish" chiqishi uchun
      markAccountCreated();

      await signInWithGoogle();
    } catch (err) {
      toast.error(T('Google orqali kirishda xatolik'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <AuthBackButton />
        <h1 className="auth-title">ZUMO</h1>
        <p className="auth-subtitle">{T('Xush kelibsiz')}</p>

        <button onClick={handleGoogleLogin} className="google-btn">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.48 10.92v3.28h5.3c-.22 1.3-.88 2.4-1.86 3.14l2.97 2.3c1.76-1.62 2.78-4 2.78-6.84 0-.64-.06-1.26-.17-1.88h-9.02z" />
            <path fill="#34A853" d="M7.3 14.47l-.96.74-2.52 1.96c1.51 2.9 4.46 4.83 8.1 4.83 2.45 0 4.5-.8 6.01-2.17l-2.97-2.3c-.83.56-1.9.9-3.04.9-2.34 0-4.32-1.58-5.03-3.7l-2.58 2.04z" />
            <path fill="#FBBC05" d="M5.3 10.92c-.34 1.02-.34 2.1 0 3.12l-2.58 2.04c-.96-1.92-.96-4.2 0-6.12l2.58 2.04z" />
            <path fill="#4285F4" d="M12.48 7.2c1.33 0 2.5.45 3.43 1.33l2.55-2.55c-1.52-1.42-3.5-2.3-5.98-2.3-3.64 0-6.7 1.93-8.24 4.83l2.6 2.03c.7-2.14 2.68-3.7 5.04-3.7z" />
          </svg>
          {T('Google orqali kirish')}
        </button>

        <AppleSignInButton />

        <div className="auth-method-switch" role="tablist" aria-label={T('Kirish usulini tanlang')}>
          <button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'phone'}
            className={loginMethod === 'phone' ? 'active' : ''}
            onClick={() => { setLoginMethod('phone'); setError(''); }}
          >
            <Smartphone size={17} /> {T('Telefon')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'email'}
            className={loginMethod === 'email' ? 'active' : ''}
            onClick={() => { setLoginMethod('email'); setError(''); }}
          >
            <Mail size={17} /> {T('Email')}
          </button>
        </div>

        <div className="divider"><span>{loginMethod === 'phone' ? T('SMS kod bilan kirish') : T('email orqali kirish')}</span></div>

        {loginMethod === 'phone' ? <PhoneOtpLoginForm /> : <form onSubmit={handleLogin}>
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
              {showResend && (
                <button 
                  type="button" 
                  className="resend-btn" 
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                >
                  {resendLoading ? T('Yuborilmoqda...') : T('Qayta yuborish')}
                </button>
              )}
            </div>
          )}

          <div className="input-group">
            <div className="input-icon"><Mail size={18} /></div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={T('Email')}
              className="auth-input"
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon"><Lock size={18} /></div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={T('Parol')}
              className="auth-input"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex-between">
            <label className="checkbox">
              <input type="checkbox" /> {T('Eslab qol')}
            </label>
            <Link to="/forgot-password" replace className="forgot-link">{T('Parolni unutdingizmi?')}</Link>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? T('Yuklanmoqda...') : <><LogIn size={18} /> {T('Kirish')}</>}
          </button>
        </form>}

        <p className="signup-link">
          {loginMethod === 'phone' ? (
            <>{T('Telefon orqali birinchi marta kirsangiz, kod tasdiqlangach hisob ochiladi.')} <Link to="/register" replace className="link">{T('Email bilan ro‘yxatdan o‘tish')}</Link></>
          ) : (
            <>{T('Hisobingiz yo‘qmi?')} <Link to="/register" replace className="link">{T('Ro‘yxatdan o‘tish')}</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
