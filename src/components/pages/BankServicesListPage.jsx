import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Landmark, Inbox, Loader2 } from 'lucide-react';
import { getBankServices } from '../services/bankServices';
import { safeGoBack } from '../utils/navigation.js';
import BankServiceCard from '../marketplace/BankServiceCard';
import '../../styles/marketplace.css';

import { T } from '../utils/T';
const SUBCATEGORY_TABS = [
  { slug: null, label: T('Barchasi') },
  { slug: 'credit', label: T('Kredit') },
  { slug: 'qr_payment', label: T('QR to\'lov') },
  { slug: 'pko', label: 'PKO' },
  { slug: 'cards', label: T('Kartalar') },
  { slug: 'deposits', label: T('Depozitlar') },
  { slug: 'money_transfers', label: 'Pul o\'tkazmalari' },
];

export default function BankServicesListPage() {
  const navigate = useNavigate();
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
        <button type="button" onClick={() => safeGoBack(navigate)} className="marketplace-back-btn">
          <ArrowLeft size={20} />
          <span>{t('common.back', 'Orqaga')}</span>
        </button>

        <h1 className="marketplace-page-title">
          <Landmark size={24} />
          {t('services.bankServices', 'Bank xizmatlari')}
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
            {t(tab.key, tab.label)}
          </button>
        ))}
      </div>

      <div className="marketplace-content">
        {loading ? (
          <div className="marketplace-loading">
            <Loader2 size={32} className="marketplace-spinner" />
            <span>{t('businessDirections.loading', 'Yuklanmoqda...')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="marketplace-empty">
            <Inbox size={48} />
            <p>{t('marketplace.catalog.empty', 'Bu bo‘limda hozircha xizmatlar yo‘q')}</p>
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
