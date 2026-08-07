// src/components/pages/RegisterPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Building2, Users, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { markAccountCreated } from '../../hooks/useGuestMode';
import '../../styles/auth.css';

const DIRECTIONS = [
  { id: 'agro', label: 'Qishloq xo‘jaligi' },
  { id: 'dokonlar', label: 'Do‘konlar' },
  { id: 'klinika', label: 'Klinika' },
  { id: 'kongilochar', label: 'Ko‘ngilochar' },
  { id: 'restoran', label: 'Restoran / Kafe' },
  { id: 'xizmatlar', label: 'Xizmatlar' },
  { id: 'talim', label: 'Taʼlim' },
  { id: 'yangi-biznes', label: 'Yangi biznes' },
];

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [direction, setDirection] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');

    // Validatsiya
    if (password !== confirmPassword) {
      setError('Parollar mos emas');
      toast.error('Parollar mos emas');
      return;
    }
    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      toast.error('Parol kamida 6 ta belgi');
      return;
    }
    if (role === 'company' && !direction) {
      setError('Iltimos, yo‘nalishni tanlang');
      toast.error('Yo‘nalish tanlanmagan');a
      return;
    }

    setLoading(true);
    setDebugInfo('⏳ Ro‘yxatdan o‘tish boshlanmoqda...');

    try {
      console.log('📤 Yuborilayotgan maʼlumotlar:', {
        email,
        fullName,
        role,
        companyName,
        direction,
      });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            company_name: companyName || '',
            direction: direction || '',
          }
        }
      });

      console.log('📥 Supabase javobi:', { data, error });

      if (error) {
        setDebugInfo(`❌ Xatolik: ${error.message}`);
        setError(error.message);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user?.identities?.length === 0) {
        setDebugInfo('⚠️ Bu email allaqachon ro‘yxatdan o‘tgan');
        setError('Bu email allaqachon ro‘yxatdan o‘tgan');
        toast.error('Bu email allaqachon ro‘yxatdan o‘tgan');
        setLoading(false);
        return;
      }

      // 🔥 Bu qurilmada endi "ro'yxatdan o'tgan" deb belgilanadi —
      //    Landing sahifasida bundan keyin faqat "Kirish" tugmasi ko'rinadi,
      //    va guest-mode flag (agar bo'lgan bo'lsa) tozalanadi
      markAccountCreated();

      setDebugInfo('✅ Ro‘yxatdan o‘tdingiz! Login sahifasiga o‘tish...');
      toast.success('✅ Ro‘yxatdan o‘tdingiz! Emailingizni tasdiqlang.');

      // 🔥 1 soniya kutib, login sahifasiga o‘tish
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.error('❌ Kutilmagan xatolik:', err);
      setDebugInfo(`❌ Xatolik: ${err.message}`);
      setError(err.message || 'Nomaʼlum xatolik yuz berdi');
      toast.error(err.message || 'Xatolik yuz berdi');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 🔥 Google orqali ham signup/login bo'lishi mumkin —
      //    shu tugma bosilganda ham "ro'yxatdan o'tgan" deb belgilaymiz,
      //    chunki OAuth qaytib kelganda Landing'da "Kirish"gina chiqishi kerak
      markAccountCreated();

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
    } catch (err) {
      toast.error('Google orqali kirishda xatolik');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">G.R.U</h1>
        <p className="auth-subtitle">Ro‘yxatdan o‘tish</p>

        <button onClick={handleGoogleLogin} className="google-btn">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.48 10.92v3.28h5.3c-.22 1.3-.88 2.4-1.86 3.14l2.97 2.3c1.76-1.62 2.78-4 2.78-6.84 0-.64-.06-1.26-.17-1.88h-9.02z" />
            <path fill="#34A853" d="M7.3 14.47l-.96.74-2.52 1.96c1.51 2.9 4.46 4.83 8.1 4.83 2.45 0 4.5-.8 6.01-2.17l-2.97-2.3c-.83.56-1.9.9-3.04.9-2.34 0-4.32-1.58-5.03-3.7l-2.58 2.04z" />
            <path fill="#FBBC05" d="M5.3 10.92c-.34 1.02-.34 2.1 0 3.12l-2.58 2.04c-.96-1.92-.96-4.2 0-6.12l2.58 2.04z" />
            <path fill="#4285F4" d="M12.48 7.2c1.33 0 2.5.45 3.43 1.33l2.55-2.55c-1.52-1.42-3.5-2.3-5.98-2.3-3.64 0-6.7 1.93-8.24 4.83l2.6 2.03c.7-2.14 2.68-3.7 5.04-3.7z" />
          </svg>
          Google orqali kirish
        </button>

        <div className="divider"><span>yoki email orqali</span></div>

        <form onSubmit={handleRegister}>
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          {/* Debug ma'lumoti – konsol uchun */}
          {debugInfo && (
            <div className="debug-info" style={{
              background: 'rgba(0,212,255,0.06)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '0.5rem',
              padding: '0.3rem 0.8rem',
              marginBottom: '0.75rem',
              fontSize: '0.75rem',
              color: '#8ab0d0',
              wordBreak: 'break-all',
            }}>
              {debugInfo}
            </div>
          )}

          <div className="input-group">
            <div className="input-icon"><User size={18} /></div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ism sharif"
              className="auth-input"
              required
            />
          </div>

          {role === 'company' && (
            <>
              <div className="input-group">
                <div className="input-icon"><Building2 size={18} /></div>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Kompaniya nomi"
                  className="auth-input"
                />
              </div>

              <div className="input-group">
                <div className="input-icon"><Tag size={18} /></div>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="auth-input"
                  required={role === 'company'}
                >
                  <option value="">Yo‘nalishni tanlang *</option>
                  {DIRECTIONS.map((dir) => (
                    <option key={dir.id} value={dir.id}>
                      {dir.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="input-group">
            <div className="input-icon"><Mail size={18} /></div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
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
              placeholder="Parol (kamida 6 belgi)"
              className="auth-input"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="input-group">
            <div className="input-icon"><Lock size={18} /></div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Parolni tasdiqlang"
              className="auth-input"
              required
            />
          </div>

          {/* 2 xil foydalanuvchi */}
          <div className="role-select">
            <label className={`role-option ${role === 'user' ? 'active' : ''}`}>
              <input type="radio" name="role" value="user" checked={role === 'user'} onChange={() => setRole('user')} />
              <Users size={18} />
              <div>
                <span>Jismoniy shaxs</span>
                <small>Oddiy foydalanuvchi</small>
              </div>
            </label>
            <label className={`role-option ${role === 'company' ? 'active' : ''}`}>
              <input type="radio" name="role" value="company" checked={role === 'company'} onChange={() => setRole('company')} />
              <Building2 size={18} />
              <div>
                <span>Kompaniya</span>
                <small>Biznes egasi</small>
              </div>
            </label>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Yuklanmoqda...' : <><UserPlus size={18} /> Ro‘yxatdan o‘tish</>}
          </button>
        </form>

        <p className="signup-link">
          Hisobingiz bormi? <Link to="/login">Kirish</Link>
        </p>
      </div>
    </div>
  );
}