import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import '../../styles/notFound.css';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="nf-page">
      <Compass size={48} className="nf-icon" />
      <h1 className="nf-title">404</h1>
      <p className="nf-text">{t('notFound.text', 'Bu sahifa topilmadi yoki ko‘chirilgan.')}</p>
      <div className="nf-actions">
        <Link to="/home" className="nf-btn nf-btn--primary">{t('notFound.home', 'Bosh sahifa')}</Link>
        <Link to="/marketplace" className="nf-btn">{t('home.hub.market', 'Bozor')}</Link>
      </div>
    </div>
  );
}
