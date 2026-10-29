// Login / ro'yxatdan o'tish sahifalarida "orqaga" tugmasi (bu sahifalarda yuqori menyu yo'q)
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { T } from '../utils/T';

export default function AuthBackButton() {
  const navigate = useNavigate();
  // To'g'ridan-to'g'ri ochilgan bo'lsa (tarix yo'q) — bosh sahifaga
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/', { replace: true }));

  return (
    <button type="button" className="auth-back-btn" onClick={goBack} aria-label={T('Orqaga')}>
      <ArrowLeft size={20} />
    </button>
  );
}
