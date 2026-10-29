import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, MessageCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { markAccountCreated } from '../../hooks/useGuestMode';
import { sendPhoneLoginCode, verifyPhoneLoginCode } from '../services/auth';
import { getUserProfile } from '../services/user';
import { supabase } from '../lib/supabase';
import '../../styles/phoneOtpLogin.css';

import { T } from '../utils/T';
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function getPhoneError(error) {
  const message = String(error?.message || '').toLowerCase();
  if (/sms provider|sms provider is not configured|unable to get sms provider|phone provider/i.test(message)) {
    return T('SMS orqali kirish hozircha ishlamayapti. Iltimos, email yoki Google orqali kiring.');
  }
  if (/rate limit|too many|429|frequency/i.test(message)) {
    return T('Kod juda ko‘p so‘raldi. Biroz kutib, qayta urinib ko‘ring.');
  }
  if (/invalid.*phone|phone.*invalid|valid phone/i.test(message)) {
    return T('Telefon raqamini +998 bilan to‘g‘ri kiriting.');
  }
  if (/invalid.*otp|otp.*invalid|token.*invalid|expired/i.test(message)) {
    return T('Kod noto‘g‘ri yoki muddati tugagan. Kodni tekshirib qayta kiriting.');
  }
  return T('Kod yuborilmadi. Telefon raqamini tekshirib, keyinroq qayta urinib ko‘ring.');
}

export default function PhoneOtpLoginForm() {
  const [digits, setDigits] = useState('');
  const [step, setStep] = useState('phone');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const requestInFlight = useRef(false);

  const phone = `+998${digits}`;
  const completePhone = digits.length === 9;
  const enteredCode = otp.join('');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async (isResend = false) => {
    if (!completePhone || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true);
    setError('');

    try {
      const { error: requestError } = await sendPhoneLoginCode(phone);
      if (requestError) throw requestError;
      setStep('code');
      setOtp(Array(OTP_LENGTH).fill(''));
      setCooldown(RESEND_SECONDS);
      toast.success(isResend ? T('Yangi kod so‘rovi yuborildi') : T('Tasdiqlash kodi yuborildi'));
      window.setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (requestError) {
      setError(getPhoneError(requestError));
    } finally {
      setLoading(false);
      requestInFlight.current = false;
    }
  };

  const verifyCode = async (code) => {
    if (code.length !== OTP_LENGTH || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true);
    setError('');

    try {
      const { data, error: verifyError } = await verifyPhoneLoginCode(phone, code);
      if (verifyError) throw verifyError;
      if (!data?.session) throw new Error(T('Tasdiqlash yakunlanmadi'));

      // Backend tasdiqlangan telefonni tayyor profilga ulaydi; frontend rolini
      // ham shu backend profilidan olib yangilaymiz.
      try {
        const { data: profileResponse } = await getUserProfile();
        const role = profileResponse?.role;
        if (['user', 'business', 'company'].includes(role)) {
          const { error: metadataError } = await supabase.auth.updateUser({ data: { role } });
          if (metadataError) console.warn('[phone-login] Sessiya roli yangilanmadi:', metadataError.message);
        }
      } catch (profileError) {
        console.warn('[phone-login] Profilni bog‘lash hozircha yakunlanmadi:', profileError?.message);
      }

      markAccountCreated();
      toast.success(T('Telefon tasdiqlandi. ZUMO’ga xush kelibsiz!'));
      // AuthContext Supabase session eventini olib, LoginPage foydalanuvchini yo‘naltiradi.
    } catch (verifyError) {
      setError(getPhoneError(verifyError));
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      requestInFlight.current = false;
    }
  };

  const updateCode = (index, value) => {
    const onlyDigits = value.replace(/\D/g, '');
    if (!onlyDigits) {
      setOtp((previous) => previous.map((digit, position) => position === index ? '' : digit));
      return;
    }

    const chars = onlyDigits.slice(0, OTP_LENGTH).split('');
    const next = [...otp];
    chars.forEach((digit, offset) => {
      if (index + offset < OTP_LENGTH) next[index + offset] = digit;
    });
    setOtp(next);

    const nextCode = next.join('');
    if (nextCode.length === OTP_LENGTH) {
      void verifyCode(nextCode);
    } else {
      inputRefs.current[Math.min(index + chars.length, OTP_LENGTH - 1)]?.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePasteCode = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] || '');
    setOtp(next);
    if (pasted.length === OTP_LENGTH) void verifyCode(pasted);
    else inputRefs.current[pasted.length]?.focus();
  };

  const editPhone = () => {
    setStep('phone');
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setCooldown(0);
  };

  return (
    <section className="phone-otp" aria-live="polite">
      {step === 'phone' ? (
        <>
          <div className="phone-otp-heading">
            <span className="phone-otp-icon"><Phone size={20} /></span>
            <div>
              <h2>{T('Telefon raqamingiz')}</h2>
              <p>{T('Kirish uchun SMS kod yuboramiz')}</p>
            </div>
          </div>

          <label className="phone-number-label" htmlFor="zumo-phone-number">{T('Telefon raqami')}</label>
          <div className="phone-number-field">
            <span className="phone-country-code" aria-label={T('O‘zbekiston kodi')}>🇺🇿 +998</span>
            <input
              id="zumo-phone-number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="90 123 45 67"
              value={digits.replace(/(\d{2})(\d{3})(\d{2})(\d{0,2})/, (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join(' '))}
              onChange={(event) => {
                setDigits(event.target.value.replace(/\D/g, '').slice(0, 9));
                setError('');
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'phone-otp-error' : undefined}
            />
          </div>

          <p className="phone-otp-hint">{T('6 xonali tasdiqlash kodi shu raqamga keladi.')}</p>
          {error && <p className="phone-otp-error" id="phone-otp-error" role="alert">{error}</p>}

          <button className="auth-button phone-otp-primary" type="button" onClick={() => requestCode()} disabled={!completePhone || loading}>
            {loading ? <><LoaderCircle size={18} className="phone-otp-spinner" /> {T('Yuborilmoqda...')}</> : <>{T('Kod yuborish')} <ArrowRight size={18} /></>}
          </button>
          <p className="phone-otp-privacy">{T('Kodni hech kimga bermang. Yangi raqam uchun tasdiqlangan alohida akkaunt yaratiladi.')}</p>
        </>
      ) : (
        <>
          <button className="phone-otp-back" type="button" onClick={editPhone} disabled={loading}>
            <ArrowLeft size={17} /> {T('Raqamni o‘zgartirish')}
          </button>

          <div className="phone-otp-heading phone-otp-code-heading">
            <span className="phone-otp-icon"><MessageCircle size={20} /></span>
            <div>
              <h2>{T('Kodni kiriting')}</h2>
              <p><strong>+998 {digits}</strong> {T('raqamiga yuborilgan 6 xonali kod')}</p>
            </div>
          </div>

          <div className="phone-otp-code" role="group" aria-label={T('Olti xonali SMS kodi')} onPaste={handlePasteCode}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`${index + 1}-raqam`}
                maxLength={OTP_LENGTH}
                value={digit}
                disabled={loading}
                onChange={(event) => updateCode(index, event.target.value)}
                onKeyDown={(event) => handleCodeKeyDown(index, event)}
                onFocus={(event) => event.target.select()}
              />
            ))}
          </div>

          <p className="phone-otp-hint">{T('SMS kelishi biroz vaqt olishi mumkin.')}</p>
          {error && <p className="phone-otp-error" role="alert">{error}</p>}

          <button className="auth-button phone-otp-primary" type="button" onClick={() => verifyCode(enteredCode)} disabled={enteredCode.length !== OTP_LENGTH || loading}>
            {loading ? <><LoaderCircle size={18} className="phone-otp-spinner" /> {T('Tekshirilmoqda...')}</> : <><CheckCircle2 size={18} /> {T('Tasdiqlash')}</>}
          </button>

          <div className="phone-otp-resend-row">
            {cooldown > 0 ? (
              <span>{T('Kodni qayta yuborish')} {cooldown} {T('soniyadan keyin mumkin')}</span>
            ) : (
              <button type="button" onClick={() => requestCode(true)} disabled={loading}>{T('Kodni qayta yuborish')}</button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
