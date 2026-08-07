import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Landmark, Inbox, Loader2 } from 'lucide-react';
import { getBankServices } from '../services/bankServices';
import BankServiceCard from '../marketplace/BankServiceCard';
import '../../styles/marketplace.css';

const SUBCATEGORY_TABS = [
  { slug: null, label: 'Barchasi' },
  { slug: 'credit', label: 'Kredit' },
  { slug: 'qr_payment', label: 'QR to\'lov' },
  { slug: 'pko', label: 'PKO' },
  { slug: 'cards', label: 'Kartalar' },
  { slug: 'deposits', label: 'Depozitlar' },
  { slug: 'money_transfers', label: 'Pul o\'tkazmalari' },
];

export default function BankServicesListPage() {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    getBankServices({ category: 'bank_service' })
      .then((res) => setServices(res.data || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab
    ? services.filter((s) => s.subCategory === activeTab)
    : services;

  return (
    <div className="marketplace-page">
      <div className="marketplace-page-header">
        <Link to="/" className="marketplace-back-btn">
          <ArrowLeft size={20} />
          <span>Bosh sahifa</span>
        </Link>

        <h1 className="marketplace-page-title">
          <Landmark size={24} />
          Bank xizmatlari
        </h1>
      </div>

      <div className="bsl-tabs">
        {SUBCATEGORY_TABS.map((tab) => (
          <button
            key={tab.slug || 'all'}
            type="button"
            className={`bsl-tab ${activeTab === tab.slug ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.slug)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="marketplace-content">
        {loading ? (
          <div className="marketplace-loading">
            <Loader2 size={32} className="marketplace-spinner" />
            <span>Yuklanmoqda...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="marketplace-empty">
            <Inbox size={48} />
            <p>Bu bo'limda hozircha xizmatlar yo'q</p>
          </div>
        ) : (
          <div className="uc-grid">
            {filtered.map((s) => (
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
        )}
      </div>
    </div>
  );
}