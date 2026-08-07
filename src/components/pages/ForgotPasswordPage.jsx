import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import '../../styles/auth.css';

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
      setMessage('Parolni tiklash linki emailingizga yuborildi. Iltimos, pochtangizni tekshiring.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">G.R.U</h1>
        <p className="auth-subtitle">Parolni tiklash</p>

        <form onSubmit={handleReset}>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="input-group">
            <div className="input-icon"><Mail size={18} /></div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email manzilingiz"
              className="auth-input"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Yuborilmoqda...' : <><Send size={18} /> Yuborish</>}
          </button>
        </form>

        <p className="signup-link">
          <Link to="/login">Kirish sahifasiga qaytish</Link>
        </p>
      </div>
    </div>
  );
}