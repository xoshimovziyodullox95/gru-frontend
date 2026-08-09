// src/components/pages/BankServiceDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Landmark, CheckCircle2, ShoppingCart, Check,
  FileText, ClipboardList, AlertTriangle, Building2, Percent, Sparkles, ShieldCheck
} from 'lucide-react';
import { getBankServiceById, getBankServices } from '../services/bankServices';
import { useCart } from '../hooks/useCart';
import BankServiceCard from '../marketplace/BankServiceCard';
import '../../styles/bankServiceDetail.css';

export default function BankServiceDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const { getQuantity, increment, removeItem } = useCart();

  useEffect(() => {
    setLoading(true);
    setErrored(false);
    getBankServiceById(id)
      .then((res) => setService(res.data))
      .catch(() => setService(null))
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    if (!service) return;
    getBankServices({ category: 'bank_service' })
      .then((res) => {
        const others = res.data
          .filter((s) => s._id !== service._id && s.provider === service.provider)
          .slice(0, 6);
        setRelatedServices(others);
      })
      .catch(() => setRelatedServices([]));
  }, [service]);

  if (loading) {
    return <div className="StatusScreen">{t('marketplacePage.loading')}</div>;
  }

  if (!service) {
    return (
      <div className="StatusScreen Error">
        <h2>{t('bankService.notFound', 'Xizmat topilmadi')}</h2>
        <Link to="/marketplace" className="BackActionBtn">
          <ArrowLeft size={16} /> {t('marketplacePage.back')}
        </Link>
      </div>
    );
  }

  const inCart = getQuantity(service._id) > 0;

  const handleCartClick = () => {
    if (inCart) {
      removeItem(service._id);
    } else {
      increment({
        id: service._id,
        title: service.serviceName,
        price: 0,
        image: service.providerLogo,
        itemType: 'bank_service',
        type: 'bank_service',
        provider: service.provider,
        subCategory: service.subCategory,
      });
    }
  };

  return (
    <div className="BsdPageWrapper">
      <div className="BsdViewport">
        <Link to="/marketplace" className="BackActionBtn">
          <ArrowLeft size={16} /> {t('marketplacePage.back')}
        </Link>

        {/* HERO */}
        <div className="bsd-hero-card">
          <div className="bsd-hero-top">
            <div className="bsd-hero-logo">
              {!errored && service.providerLogo ? (
                <img
                  src={service.providerLogo}
                  alt={service.provider}
                  onError={() => setErrored(true)}
                />
              ) : (
                <Landmark size={26} />
              )}
            </div>
            <div className="bsd-hero-titles">
              <span className="bsd-hero-provider">
                <ShieldCheck size={12} /> {service.provider}
              </span>
              <h1 className="bsd-hero-name">{service.serviceName}</h1>
            </div>
          </div>

          <div className="bsd-hero-stats">
            <div className="bsd-hero-stat">
              <Percent size={16} />
              <div>
                <span>{t('bankService.commission', 'Komissiya')}</span>
                <strong>{service.commission || '—'}</strong>
              </div>
            </div>
            <div className="bsd-hero-stat">
              <Building2 size={16} />
              <div>
                <span>{t('bankService.setupFee', "O'rnatish")}</span>
                <strong>{service.setupFee || t('bankService.free', 'Bepul')}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`chat-owner-btn bsd-cart-btn-inline ${inCart ? 'bsd-in-cart' : ''}`}
            onClick={handleCartClick}
          >
            {inCart ? (
              <><Check size={18} /> {t('bankService.inCart', 'Savatda')}</>
            ) : (
              <><ShoppingCart size={18} /> {t('bankService.addToCart', "Savatga qo'shish va ariza berish")}</>
            )}
          </button>
        </div>

        <div className="LayoutGrid">
          {/* CHAP USTUN */}
          <div className="InformationContent">
            {service.description && (
              <div className="DetailsModule">
                <h3 className="ModuleHeading"><FileText size={18} /> {t('bankService.about', 'Xizmat haqida')}</h3>
                <p className="ModuleText" style={{ margin: 0 }}>{service.description}</p>
              </div>
            )}

            {service.howItWorks && (
              <div className="SpecsModule">
                <h3 className="ModuleHeading"><Sparkles size={18} /> {t('bankService.howItWorks', 'Qanday ishlaydi')}</h3>
                <p className="ModuleText" style={{ margin: 0 }}>{service.howItWorks}</p>
              </div>
            )}

            {service.advantages?.length > 0 && (
              <div className="CertificatesModule">
                <h3 className="ModuleHeading">
                  <CheckCircle2 size={18} /> {t('bankService.advantages', 'Afzalliklari')}
                </h3>
                <div className="BadgeCloud">
                  {service.advantages.map((a, i) => (
                    <span key={i} className="VerificationBadge">
                      <CheckCircle2 size={13} /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {service.requiredDocuments?.length > 0 && (
              <div className="CertificatesModule">
                <h3 className="ModuleHeading">
                  <ClipboardList size={18} /> {t('bankService.requiredDocuments', 'Talab etiladigan hujjatlar')}
                </h3>
                <div className="bsd-doc-list">
                  {service.requiredDocuments.map((doc, i) => (
                    <div key={i} className="bsd-doc-row">
                      <span className="bsd-doc-num">{i + 1}</span>
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.additionalConditions?.length > 0 && (
              <div className="CertificatesModule bsd-conditions-module">
                <h3 className="ModuleHeading">
                  <AlertTriangle size={18} /> {t('bankService.additionalConditions', "Qo'shimcha shartlar")}
                </h3>
                <div className="bsd-doc-list">
                  {service.additionalConditions.map((c, i) => (
                    <div key={i} className="bsd-doc-row">
                      <span className="bsd-condition-dot" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* O'NG USTUN */}
          <div className="ActionSidebar">
            <div className="ContactSurface">
              <h3 className="CardSmallTitle"><Building2 size={15} /> {t('bankService.bank', 'Bank')}</h3>
              <p className="supplier-name">{service.bankName}</p>
              {service.requiresBusinessAccount && (
                <p className="supplier-contact">{t('bankService.requiresAccount', 'Biznes hisob raqami talab qilinadi')}</p>
              )}
            </div>

            {relatedServices.length > 0 && (
              <div className="ContactSurface">
                <h3 className="CardSmallTitle"><FileText size={15} /> {t('bankService.otherServicesShort', 'Boshqa xizmatlar')}</h3>
                <div className="bsd-sidebar-links">
                  {relatedServices.slice(0, 4).map((s) => (
                    <Link key={s._id} to={`/bank-service/${s._id}`} className="bsd-sidebar-link">
                      {s.serviceName}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOSHQA XIZMATLAR */}
        {relatedServices.length > 0 && (
          <div className="bsd-related-carousel">
            <h3 className="ModuleHeading">
              {t('bankService.otherServices', { bank: service.provider })}
            </h3>
            <div className="bsd-related-grid">
              {relatedServices.map((s) => (
                <BankServiceCard
                  key={s._id}
                  id={s._id}
                  serviceName={s.serviceName}
                  provider={s.provider}
                  providerLogo={s.providerLogo}
                  description={s.description}
                  commission={s.commission}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}