// Parolni tiklash — Google kabi: email → 6 xonali kod → yangi parol (havola yo'q, hammasi ilova ichida)
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, KeyRound, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthBackButton from '../common/AuthBackButton';
import AuthBrand from '../common/AuthBrand';
import '../../styles/auth.css';
import '../../styles/authModern.css';
import { T } from '../utils/T';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(0); // 0 email, 1 kod, 2 yangi parol
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const run = async (fn) => {
    setError('');
    setLoading(true);
    try { await fn(); } catch (e) { setError(e?.message || T('Nomaʼlum xatolik yuz berdi')); } finally { setLoading(false); }
  };

  const sendCode = (e) => {
    e?.preventDefault();
    run(async () => {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (err) throw err;
      setStep(1);
      toast.success(T('Kod emailingizga yuborildi'));
    });
  };

  const verify = (e) => {
    e.preventDefault();
    run(async () => {
      const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
      if (err) throw new Error(T('Kod noto‘g‘ri yoki eskirgan'));
      setStep(2);
    });
  };

  const save = (e) => {
    e.preventDefault();
    if (password.length < 6) return setError(T('Parol kamida 6 ta belgidan iborat bo‘lishi kerak'));
    return run(async () => {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      toast.success(T('Parol yangilandi ✅'));
      navigate('/', { replace: true });
    });
  };

  return (
    <div className="auth-container am-page">
      <div className="am-card">
        <AuthBackButton />
        <header className="am-head">
          <AuthBrand />
          <h1 className="am-title">{T('Parolni tiklash')}</h1>
          <p className="am-sub">
            {step === 0 && T('Emailingizni kiriting — 6 xonali kod yuboramiz')}
            {step === 1 && `${T('Kodni kiriting')}: ${email}`}
            {step === 2 && T('Yangi parol o‘ylab toping')}
          </p>
        </header>

        {error && <div className="am-error" role="alert">{error}</div>}

        {step === 0 && (
          <form className="am-form" onSubmit={sendCode}>
            <label className={`am-field ${email ? 'has-value' : ''}`}>
              <Mail className="am-field__icon" size={18} />
              <input className="am-field__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " autoComplete="email" required />
              <span className="am-field__label">{T('Email')}</span>
            </label>
            <button type="submit" className="am-submit" disabled={loading || !email}>
              {loading ? <Loader2 size={18} className="am-spin" /> : <>{T('Kod yuborish')} <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {step === 1 && (
          <form className="am-form" onSubmit={verify}>
            <label className={`am-field ${code ? 'has-value' : ''}`}>
              <KeyRound className="am-field__icon" size={18} />
              <input className="am-field__input am-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder=" " required />
              <span className="am-field__label">{T('Emaildagi kod')}</span>
            </label>
            <button type="submit" className="am-submit" disabled={loading || code.length < 6}>
              {loading ? <Loader2 size={18} className="am-spin" /> : <>{T('Tasdiqlash')} <ArrowRight size={18} /></>}
            </button>
            <button type="button" className="am-link-btn" onClick={sendCode} disabled={loading}>{T('Kodni qayta yuborish')}</button>
          </form>
        )}

        {step === 2 && (
          <form className="am-form" onSubmit={save}>
            <label className={`am-field ${password ? 'has-value' : ''}`}>
              <Lock className="am-field__icon" size={18} />
              <input className="am-field__input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " autoComplete="new-password" minLength={6} required />
              <span className="am-field__label">{T('Yangi parol (kamida 6 belgi)')}</span>
              <button type="button" className="am-field__eye" onClick={() => setShow((v) => !v)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </label>
            <button type="submit" className="am-submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="am-spin" /> : <>{T('Saqlash va kirish')} <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        <p className="am-foot"><Link to="/login" replace>{T('Kirish sahifasiga qaytish')}</Link></p>
      </div>
    </div>
  );
}
