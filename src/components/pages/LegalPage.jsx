// /terms va /privacy — Foydalanish shartlari va Maxfiylik siyosati (ilova tilida)
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LEGAL, LEGAL_INFO } from '../legal/legalContent';
import { safeGoBack } from '../utils/navigation.js';
import { T } from '../utils/T';
import '../../styles/legal.css';

export default function LegalPage({ doc }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.resolvedLanguage || 'uz').split('-')[0];
  const content = LEGAL[doc][lang] || LEGAL[doc].uz;

  return (
    <div className="legal-page">
      <header className="legal-head">
        <button type="button" className="legal-back" onClick={() => safeGoBack(navigate)} aria-label={T('Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <h1>{content.title}</h1>
      </header>
      <p className="legal-updated">{T('Yangilangan sana')}: {LEGAL_INFO.updated}</p>
      {content.sections.map(([heading, paragraphs]) => (
        <section key={heading} className="legal-section">
          <h2>{heading}</h2>
          {paragraphs.map((text) => <p key={text.slice(0, 40)}>{text}</p>)}
        </section>
      ))}
    </div>
  );
}
