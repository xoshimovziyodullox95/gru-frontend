import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Lock, Save } from 'lucide-react';
import '../../styles/auth.css';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // TUZATILDI: hash tekshiruvi olib tashlandi — Supabase token boshqaruvini
    // o'zi amalga oshiradi (ba'zan ?code= parametri, ba'zan #access_token orqali).
    // Foydalanuvchi to'g'ri link orqali kelgan bo'lsa, updateUser ishlaydi;
    // aks holda server xatosi qaytadi va foydalanuvchiga ko'rsatiladi.
  }, [location]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Parollar mos kelmadi');
      return;
    }
    if (newPassword.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Parol muvaffaqiyatli o\'zgartirildi!');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">G.R.U</h1>
        <p className="auth-subtitle">Yangi parol o'rnatish</p>
        <form onSubmit={handleReset}>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="input-group">
            <div className="input-icon"><Lock size={18} /></div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yangi parol"
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

          <div className="input-group">
            <div className="input-icon"><Lock size={18} /></div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yangi parolni takrorlang"
              className="auth-input"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Saqlanmoqda...' : <><Save size={18} /> Saqlash</>}
          </button>
        </form>
      </div>
    </div>
  );
}