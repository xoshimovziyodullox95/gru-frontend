import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import AuthBackButton from '../common/AuthBackButton';
import '../../styles/auth.css';

import { T } from '../utils/T';
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage(T('Parolni tiklash linki emailingizga yuborildi. Iltimos, pochtangizni tekshiring.'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <AuthBackButton />
        <h1 className="auth-title">ZUMO</h1>
        <p className="auth-subtitle">{T('Parolni tiklash')}</p>

        <form onSubmit={handleReset}>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="input-group">
            <div className="input-icon"><Mail size={18} /></div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={T('Email manzilingiz')}
              className="auth-input"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? T('Yuborilmoqda...') : <><Send size={18} /> {T('Yuborish')}</>}
          </button>
        </form>

        <p className="signup-link">
          <Link to="/login" replace>{T('Kirish sahifasiga qaytish')}</Link>
        </p>
      </div>
    </div>
  );
}