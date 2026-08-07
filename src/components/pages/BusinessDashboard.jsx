// src/components/pages/BusinessDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getUserProfile } from '../services/user';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale,
  LinearScale, Tooltip, Legend
} from 'chart.js';
import {
  ArrowLeft, MapPin, Wrench, Briefcase, Eye,
  TrendingUp, Calendar, Package, BarChart3,
  Users, ShoppingBag, Star, Zap, PlusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/dashboard.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const load = async () => {
      try {
        // 🔥 Rolni Supabase user_metadata'dan emas, MongoDB profilidan
        // olamiz — bu ProfilePage.jsx bilan bir xil manba, shuning uchun
        // ikkalasi mos keladi. Ikkala rol ("business" va "company") ham
        // biznes egasi hisoblanadi (ProfilePage'dagi shart bilan bir xil).
        const profRes = await getUserProfile();
        setProfile(profRes.data);

        const role = profRes.data?.role || 'user';
        if (role !== 'business' && role !== 'company') {
          navigate('/');
          return;
        }

        const statsRes = await getDashboardStats();
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Statistika yuklanmadi');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <span>Yuklanmoqda...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-empty">
        <Package size={48} className="empty-icon" />
        <h3>Ma'lumot yo'q</h3>
        <p>Hozircha statistik ma'lumotlar mavjud emas</p>
        <button onClick={() => navigate('/add-listing')} className="empty-btn">
          + Birinchi e'lonni qo'shing
        </button>
      </div>
    );
  }

  const avgViews = stats.listings > 0 ? Math.round(stats.views / stats.listings) : 0;
  const isPremium = profile?.isPremium || false;

  const isDark = document.documentElement.classList.contains('dark');
  const chartTextColor = isDark ? '#9aa5b1' : '#5a6472';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const doughnutData = {
    labels: ['Joylar', 'Texnikalar', 'Xizmatlar'],
    datasets: [{
      data: [stats.locations, stats.equipment, stats.services],
      backgroundColor: ['#4B9EFF', '#fb923c', '#8B5CF6'],
      borderColor: 'transparent',
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: chartTextColor, padding: 16, usePointStyle: true, boxWidth: 8 },
      },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} ta` } },
    },
    cutout: '68%',
  };

  const barData = {
    labels: ['Jami ko\'rishlar', 'O\'rtacha (1 e\'longa)'],
    datasets: [{
      label: "Ko'rishlar",
      data: [stats.views, avgViews],
      backgroundColor: ['#4B9EFF', '#8B5CF6'],
      borderRadius: 8,
      maxBarThickness: 70,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.raw} ko'rish` } },
    },
    scales: {
      x: { ticks: { color: chartTextColor }, grid: { display: false } },
      y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor }, beginAtZero: true },
    },
  };

  return (
    <div className="dashboard-page">
      <button className="dashboard-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Orqaga
      </button>

      <div className="dashboard-header">
        <div>
          <h1>Mening biznesim</h1>
          <p>Barcha statistikalar va tahlillar</p>
        </div>
        <button className="dashboard-add-btn" onClick={() => navigate('/add-listing')}>
          <PlusCircle size={18} /> E'lon qo'shish
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon blue"><Package size={24} /></div>
          <div className="stat-info">
            <span>Jami e'lonlar</span>
            <strong>{stats.listings}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Eye size={24} /></div>
          <div className="stat-info">
            <span>Jami ko'rishlar</span>
            <strong>{stats.views}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <span>O'rtacha ko'rish</span>
            <strong>{avgViews}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold"><Star size={24} /></div>
          <div className="stat-info">
            <span>Premium holati</span>
            <strong>{isPremium ? 'Faol' : 'Faol emas'}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        <div className="chart-card">
          <h3><BarChart3 size={18} /> E'lonlar taqsimoti</h3>
          {stats.listings === 0 ? (
            <div className="chart-empty">Hali e'lon qo'shilmagan</div>
          ) : (
            <div className="chart-wrap chart-wrap-doughnut">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="chart-center-label">
                <strong>{stats.listings}</strong>
                <span>jami</span>
              </div>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3><Eye size={18} /> Ko'rishlar umumiy holati</h3>
          {stats.views === 0 ? (
            <div className="chart-empty">Hali ko'rishlar yo'q</div>
          ) : (
            <div className="chart-wrap chart-wrap-bar">
              <Bar data={barData} options={barOptions} />
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-breakdown">
        <h3>E'lon turlari bo'yicha</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <div className="breakdown-icon blue"><MapPin size={20} /></div>
            <div className="breakdown-info">
              <span>Joylar</span>
              <strong>{stats.locations}</strong>
            </div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-icon orange"><Wrench size={20} /></div>
            <div className="breakdown-info">
              <span>Texnikalar</span>
              <strong>{stats.equipment}</strong>
            </div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-icon purple"><Briefcase size={20} /></div>
            <div className="breakdown-info">
              <span>Xizmatlar</span>
              <strong>{stats.services}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-activity">
        <h3>So'nggi faoliyat</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-dot green"></span>
            <span className="activity-text">Sizning profilingiz ko'rildi</span>
            <span className="activity-date">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="activity-item">
            <span className="activity-dot blue"></span>
            <span className="activity-text">Jami {stats.listings} ta e'lon joyladingiz</span>
            <span className="activity-date">{new Date().toLocaleDateString()}</span>
          </div>
          {stats.views > 0 && (
            <div className="activity-item">
              <span className="activity-dot purple"></span>
              <span className="activity-text">E'lonlaringiz {stats.views} marta ko'rildi</span>
              <span className="activity-date">{new Date().toLocaleDateString()}</span>
            </div>
          )}
          <div className="activity-item">
            <span className="activity-dot gold"></span>
            <span className="activity-text">Premium holati: {isPremium ? 'Faol' : 'Faol emas'}</span>
            <span className="activity-date">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="dashboard-premium-offer">
          <Zap size={24} className="premium-icon" />
          <div className="premium-info">
            <h4>Premium bo'ling!</h4>
            <p>Cheksiz e'lonlar, statistika va shaxsiy menedjer</p>
          </div>
          <button className="premium-offer-btn" onClick={() => navigate('/premium')}>
            Premium bo'lish
          </button>
        </div>
      )}
    </div>
  );
}