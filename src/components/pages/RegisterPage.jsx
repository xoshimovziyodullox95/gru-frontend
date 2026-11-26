// src/components/pages/RegisterPage.jsx — ro'yxatdan o'tish (zamonaviy ko'rinish: styles/authModern.css)
import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock, User, Building2, Users, Check, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { markAccountCreated } from '../../hooks/useGuestMode';
import AuthBackButton from '../common/AuthBackButton';
import { signInWithGoogle, authRedirectUrl, APPLE_LOGIN_ENABLED } from '../utils/googleAuth';
import AppleSignInButton from '../common/AppleSignInButton';
import ConsentNote from '../common/ConsentNote';
import AuthBrand from '../common/AuthBrand';
import '../../styles/auth.css';
import '../../styles/authModern.css';
import { T } from '../utils/T';

const DIRECTIONS = [
  { id: 'agro', label: T('Qishloq xo‘jaligi') },
  { id: 'dokonlar', label: T('Do‘konlar') },
  { id: 'klinika', label: T('Klinika') },
  { id: 'kongilochar', label: T('Ko‘ngilochar') },
  { id: 'restoran', label: T('Restoran / Kafe') },
  { id: 'xizmatlar', label: T('Xizmatlar') },
  { id: 'talim', label: T('Ta’lim') },
  { id: 'yangi-biznes', label: T('Yangi biznes') },
];

// 0..4 — uzunlik, katta harf, raqam, belgi
function passwordScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s += 1;
  if (pw.length >= 10) s += 1;
  if (/[A-ZА-Я]/.test(pw) && /[a-zа-я]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-zА-Яа-я0-9]/.test(pw)) s += 1;
  return Math.min(4, s);
}
const STRENGTH = [
  { label: '', tone: '' },
  { label: T('Kuchsiz'), tone: 'weak' },
  { label: T('O‘rtacha'), tone: 'fair' },
  { label: T('Yaxshi'), tone: 'good' },
  { label: T('Kuchli'), tone: 'strong' },
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12.48 10.92v3.28h5.3c-.22 1.3-.88 2.4-1.86 3.14l2.97 2.3c1.76-1.62 2.78-4 2.78-6.84 0-.64-.06-1.26-.17-1.88h-9.02z" />
    <path fill="#34A853" d="M7.3 14.47l-.96.74-2.52 1.96c1.51 2.9 4.46 4.83 8.1 4.83 2.45 0 4.5-.8 6.01-2.17l-2.97-2.3c-.83.56-1.9.9-3.04.9-2.34 0-4.32-1.58-5.03-3.7l-2.58 2.04z" />
    <path fill="#FBBC05" d="M5.3 10.92c-.34 1.02-.34 2.1 0 3.12l-2.58 2.04c-.96-1.92-.96-4.2 0-6.12l2.58 2.04z" />
    <path fill="#4285F4" d="M12.48 7.2c1.33 0 2.5.45 3.43 1.33l2.55-2.55c-1.52-1.42-3.5-2.3-5.98-2.3-3.64 0-6.7 1.93-8.24 4.83l2.6 2.03c.7-2.14 2.68-3.7 5.04-3.7z" />
  </svg>
);

// Belgisi maydon ichida, bosilganda tepaga suriladigan (floating label) maydon
function Field({ icon: Icon, label, type = 'text', value, onChange, autoComplete, minLength, trailing, state }) {
  return (
    <label className={`am-field ${value ? 'has-value' : ''} ${state ? `is-${state}` : ''}`}>
      <Icon className="am-field__icon" size={18} aria-hidden="true" />
      <input
        className="am-field__input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
      <span className="am-field__label">{label}</span>
      {trailing}
    </label>
  );
}

export default function RegisterPage() {
  const [role, setRole] = useState('user');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [direction, setDirection] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeStep, setCodeStep] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const score = useMemo(() => passwordScore(password), [password]);
  const confirmState = !confirmPassword ? null : confirmPassword === password ? 'ok' : 'bad';
  const isCompany = role === 'company';

  const fail = (msg) => {
    setError(msg);
    toast.error(msg);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreed) return fail(T('Davom etish uchun shartlarga rozilik bildiring'));
    if (password.length < 6) return fail(T('Parol kamida 6 ta belgidan iborat bo‘lishi kerak'));
    if (password !== confirmPassword) return fail(T('Parollar mos emas'));
    if (isCompany && !direction) return fail(T('Iltimos, yo‘nalishni tanlang'));

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: {
            full_name: fullName,
            role,
            accepted_terms_at: new Date().toISOString(),
            company_name: isCompany ? companyName : '',
            direction: isCompany ? direction : '',
          },
        },
      });
      if (signUpError) throw signUpError;
      if (data.user?.identities?.length === 0) {
        setLoading(false);
        return fail(T('Bu email allaqachon ro‘yxatdan o‘tgan'));
      }
      // Bu qurilmada endi "ro'yxatdan o'tgan": landingda faqat "Kirish" ko'rinadi, guest-mode tozalanadi
      markAccountCreated();
      // Sessiya darhol berilsa (tasdiqlash o'chiq) — kirib ketadi; aks holda emaildagi kodni so'raymiz
      if (data.session) { navigate('/', { replace: true }); return; }
      setLoading(false);
      setCodeStep(true);
      toast.success(T('Kod emailingizga yuborildi'));
    } catch (err) {
      setLoading(false);
      fail(err?.message || T('Nomaʼlum xatolik yuz berdi'));
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' });
    setLoading(false);
    if (err) return fail(T('Kod noto‘g‘ri yoki eskirgan'));
    toast.success(T('✅ Ro‘yxatdan o‘tdingiz!'));
    navigate('/', { replace: true });
  };

  const resendCode = async () => {
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (err) fail(err.message); else toast.success(T('Kod emailingizga yuborildi'));
  };

  if (codeStep) {
    return (
      <div className="auth-container am-page">
        <div className="am-card">
          <header className="am-head">
            <AuthBrand />
            <h1 className="am-title">{T('Emailni tasdiqlang')}</h1>
            <p className="am-sub">{`${T('Kodni kiriting')}: ${email}`}</p>
          </header>
          <form className="am-form" onSubmit={verifyCode}>
            {error && <div className="am-error" role="alert">{error}</div>}
            <label className={`am-field ${code ? 'has-value' : ''}`}>
              <Mail className="am-field__icon" size={18} />
              <input className="am-field__input am-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder=" " required />
              <span className="am-field__label">{T('Emaildagi kod')}</span>
            </label>
            <button type="submit" className="am-submit" disabled={loading || code.length < 6}>
              {loading ? <Loader2 size={18} className="am-spin" /> : <>{T('Tasdiqlash')} <ArrowRight size={18} /></>}
            </button>
            <button type="button" className="am-link-btn" onClick={resendCode}>{T('Kodni qayta yuborish')}</button>
          </form>
        </div>
      </div>
    );
  }

  const handleGoogle = async () => {
    try {
      markAccountCreated();
      await signInWithGoogle({ access_type: 'offline', prompt: 'consent' });
    } catch {
      toast.error(T('Google orqali kirishda xatolik'));
    }
  };

  return (
    <div className="auth-container am-page">
      <div className="am-glow am-glow--a" aria-hidden="true" />
      <div className="am-glow am-glow--b" aria-hidden="true" />

      <div className="am-card">
        <AuthBackButton />

        <header className="am-head">
          <AuthBrand />
          <h1 className="am-title">{T('Hisob yarating')}</h1>
          <p className="am-sub">{T('ZUMO’da e’lon bering, usta toping va xarid qiling')}</p>
        </header>

        {/* Hisob turi */}
        <div className="am-segment" role="radiogroup" aria-label={T('Hisob turi')}>
          <button type="button" role="radio" aria-checked={!isCompany}
            className={`am-segment__btn ${!isCompany ? 'is-on' : ''}`} onClick={() => setRole('user')}>
            <Users size={17} />
            <span>{T('Jismoniy shaxs')}</span>
          </button>
          <button type="button" role="radio" aria-checked={isCompany}
            className={`am-segment__btn ${isCompany ? 'is-on' : ''}`} onClick={() => setRole('company')}>
            <Building2 size={17} />
            <span>{T('Kompaniya')}</span>
          </button>
          <span className={`am-segment__pill ${isCompany ? 'is-right' : ''}`} aria-hidden="true" />
        </div>

        {/* Tez kirish */}
        <div className={`am-social ${APPLE_LOGIN_ENABLED ? 'is-two' : ''}`}>
          <button type="button" onClick={handleGoogle} className="google-btn am-social__btn">
            <GoogleIcon />
            <span>Google</span>
          </button>
          <AppleSignInButton compact className="am-social__btn" />
        </div>
        <ConsentNote />

        <div className="am-divider"><span>{T('yoki email orqali')}</span></div>

        <form onSubmit={handleRegister} className="am-form" noValidate>
          {error && <div className="am-error" role="alert">{error}</div>}

          <Field icon={User} label={T('Ism sharif')} value={fullName} onChange={setFullName} autoComplete="name" />

          {isCompany && (
            <div className="am-company">
              <Field icon={Building2} label={T('Kompaniya nomi')} value={companyName} onChange={setCompanyName} autoComplete="organization" />
              <p className="am-label">{T('Yo‘nalish')}</p>
              <div className="am-chips">
                {DIRECTIONS.map((d) => (
                  <button key={d.id} type="button"
                    className={`am-chip ${direction === d.id ? 'is-on' : ''}`}
                    onClick={() => setDirection(d.id)}>
                    {direction === d.id && <Check size={14} />}
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field icon={Mail} label={T('Email')} type="email" value={email} onChange={setEmail} autoComplete="email" />

          <Field
            icon={Lock}
            label={T('Parol (kamida 6 belgi)')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={6}
            trailing={(
              <button type="button" className="am-field__eye" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? T('Parolni yashirish') : T('Parolni ko‘rsatish')}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          />
          {password && (
            <div className={`am-strength tone-${STRENGTH[score].tone}`}>
              <div className="am-strength__bars">
                {[1, 2, 3, 4].map((i) => <span key={i} className={i <= score ? 'on' : ''} />)}
              </div>
              <small>{STRENGTH[score].label}</small>
            </div>
          )}

          <Field
            icon={Lock}
            label={T('Parolni tasdiqlang')}
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            state={confirmState}
            trailing={confirmState === 'ok' ? <Check className="am-field__ok" size={18} /> : null}
          />
          {confirmState === 'bad' && <small className="am-hint-bad">{T('Parollar mos emas')}</small>}

          <label className="am-consent">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span className="am-consent__box" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
            <span>
              {T('Men')} <Link to="/terms">{T('Foydalanish shartlari')}</Link> {T('va')}{' '}
              <Link to="/privacy">{T('Maxfiylik siyosati')}</Link>{T('ga roziman')}
            </span>
          </label>

          <button type="submit" className="am-submit" disabled={loading || !agreed}>
            {loading
              ? <><Loader2 size={18} className="am-spin" /> {T('Yuklanmoqda...')}</>
              : <>{T('Ro‘yxatdan o‘tish')} <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="am-foot">
          {T('Hisobingiz bormi?')} <Link to="/login" replace>{T('Kirish')}</Link>
        </p>
      </div>
    </div>
  );
}
