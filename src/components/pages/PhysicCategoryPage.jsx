// src/pages/PhysicCategoryPage.jsx
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import '../../styles/physicPage.css';

import { T } from '../utils/T';
const physicCategories = [
  { key: 'otkazmalar', name: T('To\'lovlar va o\'tkazmalar'), emoji: '💸', desc: T('Pul o\'tkazmalari, plastik kartalar, mobil to\'lovlar') },
  { key: 'moliya', name: T('Bank va moliya xizmatlari'), emoji: '🏦', desc: T('Kredit, depozit, investitsiya va moliyaviy maslahat') },
  { key: 'kochmasmulk', name: T('Ko\'chmas mulk va ta\'mirlash'), emoji: '🏗️', desc: T('Uy-joy sotib olish, ijaraga berish, ta\'mirlash xizmatlari') },
  { key: 'talim', name: T('Ta\'lim va kurslar'), emoji: '🎓', desc: T('Kurslar, o\'quv markazlari, online ta\'lim') },
  { key: 'shaxsiyxizmat', name: T('Shaxsiy xizmatlar'), emoji: '🔧', desc: T('Usta, tozalash, go\'zallik xizmatlari') },
  { key: 'ish', name: T('Ish va frilans'), emoji: '💼', desc: T('Ish topish, frilans loyihalar, masofaviy ish') },
  { key: 'sugurta', name: T('Sug\'urta xizmatlari'), emoji: '🛡️', desc: T('Hayot, mulk, avtomobil sug\'urtasi') },
  { key: 'ikkilamchi', name: T('Ikkilamchi bozor'), emoji: '♻️', desc: T('Foydalanilgan tovarlar, antikvariat, komissiya do\'konlari') },
];

const COLOR_PALETTE = [
  ['#22c55e', '#0d9c56'],
  ['#f97316', '#c2410c'],
  ['#3b82f6', '#1d4ed8'],
  ['#a855f7', '#7e22ce'],
  ['#ef4444', '#b91c1c'],
  ['#14b8a6', '#0f766e'],
  ['#eab308', '#a16207'],
  ['#ec4899', '#be185d'],
];

const BACKGROUND_CARDS = Array.from({ length: 25 }, (_, index) => ({
  size: 60 + ((index * 37) % 101),
  top: (index * 41) % 100,
  left: (index * 67 + 13) % 100,
  duration: 12 + ((index * 7) % 25),
  delay: (index * 3) % 12,
  radius: 20 + ((index * 13) % 51),
  opacity: 0.12 + ((index % 7) * 0.03),
}));

export default function PhysicCategoryPage() {
  const { categoryKey } = useParams();

  const category = physicCategories.find(c => c.key === categoryKey);
  const idx = physicCategories.findIndex(c => c.key === categoryKey);
  const [colorFrom, colorTo] = COLOR_PALETTE[Math.max(idx, 0) % COLOR_PALETTE.length];

  if (!category) {
    return <div className="physic-not-found">{T('Kategoriya topilmadi')}</div>;
  }

  return (
    <div className="physic-category-wrapper">
      {/* ===== FON – HARAKATLANUVCHI RANGLI KARTALAR ===== */}
      <div className="physic-bg-cards">
        {BACKGROUND_CARDS.map((card, i) => (
          <div
            key={i}
            className="physic-bg-card"
            style={{
              background: COLOR_PALETTE[i % COLOR_PALETTE.length][0],
              width: `${card.size}px`,
              height: `${card.size}px`,
              top: `${card.top}%`,
              left: `${card.left}%`,
              animationDuration: `${card.duration}s`,
              animationDelay: `${card.delay}s`,
              borderRadius: `${card.radius}%`,
              opacity: card.opacity,
            }}
          />
        ))}
      </div>

      {/* ===== MATOVIY QOPLAMA ===== */}
      <div className="physic-overlay"></div>

      {/* ===== ASOSIY KONTENT ===== */}
      <div className="physic-category-content">
        <div className="physic-category-hero">
          <div
            className="physic-category-icon"
            style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}
          >
            <span className="physic-category-emoji">{category.emoji}</span>
          </div>
          <h1 className="physic-category-title">{category.name}</h1>
          <p className="physic-category-desc">{category.desc}</p>
        </div>

        <div className="physic-category-placeholder">
          <div className="physic-category-coming">
            <Clock size={48} />
            <h2>{T('Tez orada')}</h2>
            <p>{T('Bu yo\'nalish hozircha ishlab chiqilmoqda')}</p>
          </div>
        </div>

        {/* ===== TUGMALAR ===== */}
        <div className="physic-actions">
          <Link to="/physic" className="physic-btn physic-btn-back">
            <ArrowLeft size={18} />
            <span>{T('Orqaga')}</span>
          </Link>
          <button className="physic-btn physic-btn-coming" onClick={() => alert(T('Tez orada!'))}>
            <Clock size={18} />
            <span>{T('Tez kunda')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
