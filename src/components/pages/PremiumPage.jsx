import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, BadgeCheck, Check, Crown, Shield, Star, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { safeGoBack } from '../utils/navigation';
import { IS_IOS_APP } from '../utils/platform';
import { T } from '../utils/T';
import '../../styles/premium.css';

// Imkoniyatlar ro'yxati — har kartada bir xil tartibda chiqadi
const FEATURES = [
  { id: 'listings', label: T('E’lon soni') },
  { id: 'video', label: T('Video kontent') },
  { id: 'stats', label: T('Statistika') },
  { id: 'badge', label: T('Premium belgi') },
  { id: 'orders', label: T('Onlayn buyurtma') },
  { id: 'branding', label: T('Reklama va brend') },
  { id: 'support', label: T('Qo‘llab-quvvatlash') },
];

const PAID_FEATURES = {
  listings: T('Cheksiz'),
  video: T('Cheksiz'),
  stats: T('To‘liq'),
  badge: true,
  orders: true,
  branding: true,
  support: T('Tezkor'),
};

// plan — backend'dagi PLAN_AMOUNTS kaliti (routes/payment.js); narxlar u bilan bir xil bo'lishi shart
const PLANS = [
  {
    id: 'free',
    name: T('Bepul'),
    price: 0,
    period: T('so‘m · doimiy'),
    icon: Star,
    tone: 'free',
    for: T('Sinab ko‘rish uchun'),
    features: {
      listings: T('5 tagacha'),
      video: T('Cheklangan'),
      stats: T('Asosiy'),
      badge: false,
      orders: false,
      branding: false,
      support: T('Oddiy'),
    },
  },
  {
    id: 'monthly',
    name: T('Oylik'),
    price: 199000,
    period: T('so‘m / oy'),
    icon: Zap,
    tone: 'blue',
    for: T('Do‘kon, ta’lim, xizmat'),
    features: PAID_FEATURES,
  },
  {
    id: 'yearly',
    name: T('Yillik'),
    price: 999999,
    period: T('so‘m / yil'),
    icon: Crown,
    tone: 'gold',
    badge: T('Eng foydali'),
    for: T('O‘rta va yirik biznes'),
    features: PAID_FEATURES,
  },
];

const YEARLY_SAVING = Math.round((1 - 999999 / (199000 * 12)) * 100);
const formatSum = (n) => n.toLocaleString('ru-RU').replace(/,/g, ' ');

export default function PremiumPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/user/premium/status').then((res) => setStatus(res.data)).catch(() => {});
  }, [user]);

  const activeUntil = status?.isPremium && status.premiumUntil ? new Date(status.premiumUntil) : null;

  const handleSelect = async (planId) => {
    if (planId === 'free') {
      navigate(user ? '/add-listing' : '/register');
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: '/premium' } });
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await api.post('/payment/create-payment', { plan: planId });
      if (!res.data.success) throw new Error(res.data.error || T('Xatolik yuz berdi'));
      if (Capacitor.isNativePlatform()) {
        // Ilova ichida to'lov sahifasi tizim brauzerida ochiladi
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: res.data.paymentUrl });
      } else {
        window.location.assign(res.data.paymentUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || T('Xatolik yuz berdi'));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="premium-page">
      <video className="premium-bg-video" autoPlay muted loop playsInline>
        <source src="/videos/hero-background.mp4" type="video/mp4" />
      </video>
      <div className="premium-overlay" />

      <button type="button" className="premium-back" onClick={() => safeGoBack(navigate)} aria-label={T('Orqaga')}>
        <ArrowLeft size={20} />
      </button>

      <div className="premium-content">
        <header className="premium-header">
          <BadgeCheck size={44} className="premium-header-icon" fill="var(--cyan)" color="#fff" strokeWidth={1.5} />
          <h1>{T('Premium a’zolik')}</h1>
          <p>{T('O‘zingizga mos tarifni tanlang')}</p>
          {activeUntil && (
            <span className="premium-active">
              <BadgeCheck size={15} /> {T('Premium faol')} · {activeUntil.toLocaleDateString('uz-UZ')} {T('gacha')}
            </span>
          )}
        </header>

        <div className="premium-plans">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.id === 'free' ? Boolean(user) && !activeUntil : status?.premiumPlan === plan.id && activeUntil;
            return (
              <article key={plan.id} className={`plan-card plan-card--${plan.tone}`}>
                {plan.badge && <span className="popular-badge">{plan.badge} · −{YEARLY_SAVING}%</span>}

                <div className="plan-header">
                  <span className="plan-icon"><Icon size={26} strokeWidth={1.7} /></span>
                  <h2>{plan.name}</h2>
                  <div className="plan-price">
                    <span className="price">{formatSum(plan.price)}</span>
                    <span className="period">{plan.period}</span>
                  </div>
                  <p className="plan-for">
                    {plan.id === 'yearly' ? `${T('Oyiga atigi')} ${formatSum(Math.round(plan.price / 12 / 1000) * 1000)} ${T('so‘m')}` : plan.for}
                  </p>
                </div>

                <ul className="plan-features">
                  {FEATURES.map((f) => {
                    const val = plan.features[f.id];
                    const on = val !== false;
                    return (
                      <li key={f.id} className={`feature-item ${on ? '' : 'disabled'}`}>
                        <span className="feature-check">{on ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={2.5} />}</span>
                        <span className="feature-label">{f.label}</span>
                        <span className="feature-value">{typeof val === 'string' ? val : on ? T('Bor') : T('Yo‘q')}</span>
                      </li>
                    );
                  })}
                </ul>

                {!IS_IOS_APP && <button
                  type="button"
                  className="plan-btn"
                  onClick={() => handleSelect(plan.id)}
                  disabled={Boolean(loadingPlan) || (plan.id === 'free' && isCurrent)}
                >
                  {loadingPlan === plan.id
                    ? T('Yuklanmoqda...')
                    : isCurrent
                      ? T('Hozirgi tarif')
                      : plan.id === 'free'
                        ? T('Boshlash')
                        : activeUntil ? T('Muddatni uzaytirish') : T('Tanlash')}
                </button>}
              </article>
            );
          })}
        </div>

        {!IS_IOS_APP && (
          <p className="premium-trust">
            <Shield size={16} strokeWidth={1.8} />
            {T('Xavfsiz to‘lov Uzum Bank orqali. Avtomatik yechib olinmaydi.')}
          </p>
        )}
      </div>
    </div>
  );
}
