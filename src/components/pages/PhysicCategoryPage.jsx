// src/pages/PhysicCategoryPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock } from 'lucide-react';
import '../../styles/physicPage.css';

const physicCategories = [
  { key: 'otkazmalar', name: "To'lovlar va o'tkazmalar", emoji: '💸', desc: "Pul o'tkazmalari, plastik kartalar, mobil to'lovlar" },
  { key: 'moliya', name: 'Bank va moliya xizmatlari', emoji: '🏦', desc: "Kredit, depozit, investitsiya va moliyaviy maslahat" },
  { key: 'kochmasmulk', name: "Ko'chmas mulk va ta'mirlash", emoji: '🏗️', desc: "Uy-joy sotib olish, ijaraga berish, ta'mirlash xizmatlari" },
  { key: 'talim', name: "Ta'lim va kurslar", emoji: '🎓', desc: "Kurslar, o'quv markazlari, online ta'lim" },
  { key: 'shaxsiyxizmat', name: 'Shaxsiy xizmatlar', emoji: '🔧', desc: "Usta, tozalash, go'zallik xizmatlari" },
  { key: 'ish', name: 'Ish va frilans', emoji: '💼', desc: "Ish topish, frilans loyihalar, masofaviy ish" },
  { key: 'sugurta', name: "Sug'urta xizmatlari", emoji: '🛡️', desc: "Hayot, mulk, avtomobil sug'urtasi" },
  { key: 'ikkilamchi', name: "Ikkilamchi bozor", emoji: '♻️', desc: "Foydalanilgan tovarlar, antikvariat, komissiya do'konlari" },
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

export default function PhysicCategoryPage() {
  const { categoryKey } = useParams();
  const { t } = useTranslation();

  const category = physicCategories.find(c => c.key === categoryKey);
  const idx = physicCategories.findIndex(c => c.key === categoryKey);
  const [colorFrom, colorTo] = COLOR_PALETTE[idx % COLOR_PALETTE.length];

  if (!category) {
    return <div className="physic-not-found">Kategoriya topilmadi</div>;
  }

  return (
    <div className="physic-category-wrapper">
      {/* ===== FON – HARAKATLANUVCHI RANGLI KARTALAR ===== */}
      <div className="physic-bg-cards">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="physic-bg-card"
            style={{
              background: COLOR_PALETTE[i % COLOR_PALETTE.length][0],
              width: `${60 + Math.random() * 100}px`,
              height: `${60 + Math.random() * 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${12 + Math.random() * 25}s`,
              animationDelay: `${Math.random() * 12}s`,
              borderRadius: `${Math.random() * 50 + 20}%`,
              opacity: 0.12 + Math.random() * 0.18,
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
            <h2>Tez orada</h2>
            <p>Bu yo'nalish hozircha ishlab chiqilmoqda</p>
          </div>
        </div>

        {/* ===== TUGMALAR ===== */}
        <div className="physic-actions">
          <Link to="/physic" className="physic-btn physic-btn-back">
            <ArrowLeft size={18} />
            <span>Orqaga</span>
          </Link>
          <button className="physic-btn physic-btn-coming" onClick={() => alert('Tez orada!')}>
            <Clock size={18} />
            <span>Tez kunda</span>
          </button>
        </div>
      </div>
    </div>
  );
}