// src/components/marketplace/BankServiceCard.jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Landmark, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BankServiceCard({
  id,
  serviceName,
  provider,
  providerLogo,
  description,
}) {
  const { t } = useTranslation();
  const [errored, setErrored] = useState(false);

  return (
    <Link to={`/bank-service/${id}`} className="uc-card bsc-chip-card">
      {/* Dekorativ fon naqshi */}
      <div className="bsc-chip-pattern" aria-hidden="true" />

      {/* Yuqori qator: chip belgisi + logo nishon */}
      <div className="bsc-chip-top">
        <div className="bsc-chip-icon">
          <span />
          <span />
          <span />
        </div>

        <div className="bsc-chip-logo-badge">
          {!errored && providerLogo ? (
            <img
              src={providerLogo}
              alt={provider}
              className="bsc-chip-logo-img"
              onError={() => setErrored(true)}
            />
          ) : (
            <Landmark size={16} />
          )}
        </div>
      </div>

      <span className="bsc-chip-provider">{provider}</span>

      <div className="uc-body bsc-chip-body">
        <h3 className="uc-title bsc-chip-title">{serviceName}</h3>

        {description && <p className="uc-desc bsc-chip-desc">{description}</p>}

        <div className="bsc-chip-footer">
          <span className="bsc-chip-details-label">{t('universalCard.details')}</span>

          <span className="bsc-chip-arrow-btn" aria-label={t('universalCard.details')}>
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}