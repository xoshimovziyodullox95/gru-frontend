import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { upgradeTariff } from '../services/user';
import { Shield, Star, Zap, Crown, BadgeCheck, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/premium.css';
import axios from 'axios';


// ===== TARIF MA'LUMOTLARI (REAL) =====
const allFeatures = [
  { id: 'listings', label: "E'lon soni" },
  { id: 'stats', label: 'Statistika' },
  { id: 'support', label: "Qo'llab-quvvatlash" },
  { id: 'badge', label: 'Premium belgi' },
  { id: 'video', label: 'Video kontent' },
  { id: 'admin', label: 'Admin panel' },
  { id: 'manager', label: 'Shaxsiy menedjer' },
  { id: 'branding', label: 'Reklama va brendni tanitish' },
  { id: 'orders', label: 'Onlayn zakaz tizimi' },
];

const YEARLY_DISCOUNT = 0.15;
const getYearlyPrice = (monthly) => Math.round((monthly * 12 * (1 - YEARLY_DISCOUNT)) / 1000) * 1000;

const plans = [
  {
    id: 'free',
    name: 'Bepul',
    price: 0,
    icon: Star,
    color: '#90CAF9',
    bg: 'rgba(144, 202, 249, 0.06)',
    border: 'rgba(144, 202, 249, 0.2)',
    for: 'Sinab ko‘rish uchun',
    features: {
      listings: '5 tagacha',
      stats: 'Asosiy',
      support: 'Oddiy',
      badge: false,
      video: 'Cheklangan',
      admin: false,
      manager: false,
      branding: false,
      orders: false,
    },
  },
  {
    id: 'standart',
    name: 'Standart',
    price: 199000,
    icon: Zap,
    color: '#4B9EFF',
    bg: 'rgba(75, 158, 255, 0.08)',
    border: 'rgba(75, 158, 255, 0.25)',
    for: 'Do‘kon, ta’lim, xizmat',
    popular: true,
    features: {
      listings: '15 tagacha',
      stats: 'Kengaytirilgan',
      support: 'Tezkor',
      badge: true,
      video: 'Cheksiz',
      admin: false,
      manager: false,
      branding: false,
      orders: true,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 999999,
    priceYearly: getYearlyPrice(999999),
    icon: Crown,
    color: '#FFD700',
    bg: 'rgba(255, 215, 0, 0.06)',
    border: 'rgba(255, 215, 0, 0.25)',
    for: 'O‘rta va yirik biznes',
    features: {
      listings: 'Cheksiz',
      stats: 'To‘liq',
      support: '24/7 shaxsiy',
      badge: true,
      video: 'Cheksiz',
      admin: true,
      manager: true,
      branding: true,
      orders: true,
    },
  },
];

export default function PremiumPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

// PremiumPage.jsx – handleUpgrade qismi

const handleUpgrade = async (planId) => {
  if (!user) {
    toast.error('Iltimos, avval tizimga kiring');
    return;
  }
  setLoading(true);
  try {
    const res = await axios.post('/api/payment/create-payment', { plan: planId });
    if (res.data.success) {
      // Uzum Bank to'lov sahifasiga o'tish
      window.location.href = res.data.paymentUrl;
    } else {
      toast.error(res.data.error || 'Xatolik yuz berdi');
    }
  } catch (err) {
    toast.error(err.message || 'Xatolik yuz berdi');
  } finally {
    setLoading(false);
  }
};

  const renderFeature = (featureId, plan) => {
    const f = allFeatures.find(x => x.id === featureId);
    const val = plan.features[featureId];
    const isAvailable = val === true || typeof val === 'string' && val !== false;

    return (
      <li key={featureId} className={`feature-item ${!isAvailable ? 'disabled' : ''}`}>
        {isAvailable ? (
          <Check size={16} color="#4B9EFF" strokeWidth={2.5} />
        ) : (
          <X size={16} color="#6b7280" strokeWidth={2} />
        )}
        <span className="feature-label">{f.label}</span>
        <span className="feature-value">
          {typeof val === 'string' ? val : (isAvailable ? '✅' : '❌')}
        </span>
      </li>
    );
  };

  return (
    <div className="premium-page">
      <video className="premium-bg-video" autoPlay muted loop playsInline>
        <source src="/videos/hero-background.mp4" type="video/mp4" />
      </video>
      <div className="premium-overlay"></div>

      <div className="premium-content">
        <div className="premium-header">
          <BadgeCheck size={44} className="premium-header-icon" fill="var(--cyan)" color="#fff" strokeWidth={1.5} />
          <h1>Premium a'zolik</h1>
          <p>O‘zingizga mos tarifni tanlang</p>
        </div>

        <div className="premium-toggle">
          <span className={!isYearly ? 'active' : ''}>Oylik</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={isYearly} onChange={() => setIsYearly(!isYearly)} />
            <span className="slider"></span>
          </label>
          <span className={isYearly ? 'active' : ''}>Yillik <span className="discount">-15%</span></span>
        </div>

        <div className="premium-plans">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = plan.id === 'free' ? 0 : (isYearly && plan.priceYearly ? plan.priceYearly : plan.price);
            const isPremiumPlan = plan.id === 'premium';

            return (
              <div
                key={plan.id}
                className={`plan-card ${plan.popular ? 'popular' : ''}`}
                style={{
                  borderColor: plan.border,
                  boxShadow: `0 8px 32px rgba(0, 50, 150, 0.08)`,
                }}
              >
                {plan.popular && <div className="popular-badge">Eng ommabop</div>}
                <div className="plan-header" style={{ background: plan.bg }}>
                  <Icon size={32} color={plan.color} strokeWidth={1.5} />
                  <h2>{plan.name}</h2>
                  <div className="plan-price">
                    <span className="price">
                      {plan.id === 'free' ? 'Bepul' : price.toLocaleString()}
                    </span>
                    {plan.id !== 'free' && (
                      <span className="period">
                        {isPremiumPlan && isYearly ? "so'm / yil" : "so'm / oy"}
                      </span>
                    )}
                    {plan.id === 'free' && <span className="period">sinov</span>}
                  </div>
                  <div className="plan-for">{plan.for}</div>
                </div>
                <ul className="plan-features">
                  {allFeatures.map((f) => renderFeature(f.id, plan))}
                </ul>
                <button
                  className="plan-btn"
                  style={{
                    background: plan.id === 'free' ? 'transparent' : plan.color,
                    color: plan.id === 'free' ? '#4B9EFF' : '#fff',
                    border: plan.id === 'free' ? '1.5px solid #4B9EFF' : 'none',
                  }}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading}
                >
                  <span className="btn-text">
                    {plan.id === 'free' ? 'Boshlash' : 'Tanlash'}
                  </span>
                  <span className="btn-line"></span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="premium-trust">
          <Shield size={16} strokeWidth={1.8} />
          <span>Xavfsiz to'lov • Istalgan payt bekor qilish mumkin</span>
        </div>
      </div>
    </div>
  );
}