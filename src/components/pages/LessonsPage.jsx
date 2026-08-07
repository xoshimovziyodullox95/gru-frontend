// src/components/pages/LessonsPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, Lock, Crown, ArrowLeft, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/lessons.css';

export default function LessonsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const isPremium = user?.isPremium || user?.user_metadata?.isPremium || false;

  // Hozircha videolar yo‘q – placeholder
  const lessons = [
    { id: 1, title: 'Biznes reja tuzish', duration: '12:30', comingSoon: true },
    { id: 2, title: 'SMM strategiyasi', duration: '18:45', comingSoon: true },
    { id: 3, title: 'Moliya boshqaruvi', duration: '22:10', comingSoon: true },
    { id: 4, title: 'Xodimlar bilan ishlash', duration: '15:20', comingSoon: true },
    { id: 5, title: 'Marketing asoslari', duration: '20:00', comingSoon: true },
    { id: 6, title: 'Biznesni kengaytirish', duration: '25:30', comingSoon: true },
  ];

  const handleVideoClick = (lesson) => {
    if (lesson.comingSoon) {
      toast.info('📚 Bu darslik tez orada qo‘shiladi!', { duration: 3000 });
      return;
    }
    if (isPremium) {
      // Premium bo‘lsa – videoni ochish
      setSelectedVideo(lesson);
    } else {
      // Premium bo‘lmasa – modal ochish
      setShowPremiumModal(true);
    }
  };

  return (
    <div className="lessons-page">
      <div className="lessons-header">
        <button className="lessons-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Orqaga
        </button>
        <h1>📚 Video darsliklar</h1>
        <p className="lessons-sub">Biznesingizni rivojlantirish uchun eng yaxshi treninglar</p>
      </div>

      {/* 🔥 TEZ ORADA BANNER */}
      <div className="lessons-coming-banner">
        <Clock size={24} />
        <div>
          <h3>Tez orada!</h3>
          <p>Biz yangi video darsliklar ustida ishlayapmiz. Kuzatib turing!</p>
        </div>
      </div>

      <div className="lessons-grid">
        {lessons.map(lesson => (
          <div
            key={lesson.id}
            className={`lesson-card ${lesson.comingSoon ? 'coming-soon' : ''}`}
            onClick={() => handleVideoClick(lesson)}
          >
            <div className="lesson-thumbnail">
              <div className="lesson-play-icon">
                <Play size={24} fill="#fff" color="#fff" />
              </div>
              {lesson.comingSoon && (
                <div className="lesson-badge">Tez orada</div>
              )}
            </div>
            <div className="lesson-info">
              <h3>{lesson.title}</h3>
              <span className="lesson-duration">{lesson.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 PREMIUM MODAL */}
      {showPremiumModal && (
        <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <div className="premium-modal-icon">🔒</div>
            <h3>Premium aʼzolik kerak</h3>
            <p>
              Video darsliklarni ko‘rish uchun <strong>Premium</strong> aʼzo bo‘lishingiz kerak.
              Premium aʼzolik sizga barcha darsliklar, narxlar va qo‘shimcha imkoniyatlarni ochadi.
            </p>
            <div className="premium-modal-actions">
              <button className="premium-modal-btn" onClick={() => navigate('/premium')}>
                <Crown size={16} /> Premium bo‘lish
              </button>
              <button className="premium-modal-btn secondary" onClick={() => setShowPremiumModal(false)}>
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}