// src/components/pages/ComingSoonPage.jsx
// Hali ishga tushmagan bo'limlar uchun vaqtinchalik sahifa.
// App.jsx'da COMING_SOON ro'yxatidan olib tashlansa, asl sahifa qaytadi.
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock } from 'lucide-react';
import { safeGoBack } from '../utils/navigation.js';
import '../../styles/comingSoon.css';

export default function ComingSoonPage({ section, title, description, icon: Icon = Clock }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="cs-page">
      <button type="button" className="cs-back" onClick={() => safeGoBack(navigate)}>
        <ArrowLeft size={18} /> {t('common.back', 'Orqaga')}
      </button>

      <div className="cs-card">
        <span className="cs-icon"><Icon size={34} strokeWidth={1.8} /></span>
        <span className="cs-badge">{t('comingSoon.badge', 'Tez kunda')}</span>
        <h1 className="cs-title">{section ? t(`comingSoon.${section}.title`, title) : title}</h1>
        <p className="cs-text">
          {(section && description ? t(`comingSoon.${section}.text`, description) : description)
            || t('comingSoon.text', 'Bu bo‘lim ustida ishlayapmiz. Ishga tushganda sizga xabar beramiz.')}
        </p>
        <button type="button" className="cs-btn" onClick={() => navigate('/marketplace')}>
          {t('comingSoon.toMarket', 'Hozircha bozorni ko‘ring')}
        </button>
      </div>
    </div>
  );
}
