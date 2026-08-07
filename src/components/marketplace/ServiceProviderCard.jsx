// src/components/marketplace/ServiceProviderCard.jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Building2, ArrowUpRight } from 'lucide-react';

export default function ServiceProviderCard({
  id,
  name,
  company,
  image,
  price_range,
  description,
}) {
  const [errored, setErrored] = useState(false);

  return (
    <Link to={`/service-provider/${id}`} className="uc-card bsc-chip-card">
      <div className="bsc-chip-pattern" aria-hidden="true" />

      <div className="bsc-chip-top" style={{ justifyContent: 'flex-end' }}>
        <div className="bsc-chip-logo-badge">
          {!errored && image ? (
            <img
              src={image}
              alt={company}
              className="bsc-chip-logo-img"
              onError={() => setErrored(true)}
            />
          ) : (
            <Building2 size={16} />
          )}
        </div>
      </div>

      <span className="bsc-chip-provider">{company}</span>

      <div className="uc-body bsc-chip-body">
        <h3 className="uc-title bsc-chip-title">{name}</h3>
        {description && <p className="uc-desc bsc-chip-desc">{description}</p>}

        <div className="bsc-chip-footer">
          <span className="bsc-chip-details-label">{price_range || 'Narx individual'}</span>
          <span className="bsc-chip-arrow-btn" aria-label="Batafsil">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}