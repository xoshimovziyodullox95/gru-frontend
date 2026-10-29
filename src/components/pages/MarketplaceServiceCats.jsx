import { safeGoBack } from '../utils/navigation.js';
// src/components/pages/MarketplaceServiceCats.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BriefcaseBusiness, LoaderCircle } from 'lucide-react';
import { getServiceTaxonomy } from '../services/serviceProviders';
import '../../styles/marketplaceHub.css';

const formatSlug = (slug = '') => slug.replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function MarketplaceServiceCats() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [taxonomy, setTaxonomy] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getServiceTaxonomy()
      .then((taxonomyRes) => {
        if (!active) return;
        const nextTaxonomy = taxonomyRes.data?.taxonomy || taxonomyRes.data?.data?.taxonomy || {};
        setTaxonomy(nextTaxonomy);
      })
      .catch(() => {
        if (active) setTaxonomy({});
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const groups = Object.entries(taxonomy).filter(([, categories]) => Array.isArray(categories) && categories.length);

  return (
    <div className="mph-page">
      <button className="mph-back" onClick={() => safeGoBack(navigate)}>
        <ArrowLeft size={18} /> {t('common.back')}
      </button>
      <h2 className="mph-subtitle">{t('marketplace.services.catsTitle', 'Xizmatlar')}</h2>
      {loading ? <div className="mph-loading"><LoaderCircle className="spin" /> Yuklanmoqda...</div> : (
        <div className="mph-service-groups">
          {groups.map(([direction, categories]) => (
            <section className="mph-service-group" key={direction}>
              <h3>{t(`svc.dir.${direction}`, formatSlug(direction))}</h3>
              <div className="mph-service-cats-grid">
                {categories.map((slug) => (
                  <button
                    key={slug}
                    className="mph-service-cat-card"
                    onClick={() => navigate(`/marketplace/services/${slug}`)}
                  >
                    <BriefcaseBusiness size={24} className="mph-service-cat-icon" />
                    <span className="mph-service-cat-name">{t(`svc.cat.${slug}`, formatSlug(slug))}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!groups.length && <p>{t('marketplace.services.empty', 'Xizmat kategoriyalari yuklanmadi.')}</p>}
        </div>
      )}
    </div>
  );
}
