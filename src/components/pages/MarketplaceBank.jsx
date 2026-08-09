// src/components/pages/MarketplaceBank.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, User, Building2, CreditCard, Landmark, Wallet, Send, QrCode, PiggyBank } from 'lucide-react';
import { getBankServices } from '../services/bankServices';
import BankServiceCard from '../marketplace/BankServiceCard';
import '../../styles/marketplaceHub.css';

const subCategoryMap = {
  credit: { key: 'credit', icon: CreditCard, label: 'Kreditlar' },
  cards: { key: 'cards', icon: CreditCard, label: 'Kartalar' },
  deposits: { key: 'deposits', icon: PiggyBank, label: 'Depozitlar' },
  pko: { key: 'pko', icon: Wallet, label: 'Naqd pul / PKO' },
  money_transfers: { key: 'moneyTransfers', icon: Send, label: "Pul o'tkazmalari" },
  qr_payment: { key: 'qrPayment', icon: QrCode, label: 'QR to‘lovlar' },
};

const order = ['credit', 'cards', 'deposits', 'pko', 'money_transfers', 'qr_payment'];

export default function MarketplaceBank() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerType, setCustomerType] = useState('individual');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef({});
  const pageRef = useRef(null);

  useEffect(() => {
    getBankServices()
      .then(res => setItems((res.data || []).filter(s => s.category === 'bank_service')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (pageRef.current) {
        const scrollY = window.scrollY;
        setShowScrollTop(scrollY > 400);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) return <div className="mph-loading">Yuklanmoqda...</div>;

  const displayedItems = items.filter(s => (s.customerType || 'individual') === customerType);

  const grouped = displayedItems.reduce((acc, item) => {
    const sub = item.subCategory || 'other';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(item);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  const scrollToSection = (key) => {
    const el = sectionRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mph-page" ref={pageRef}>
      <button className="mph-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Orqaga
      </button>
      <h2 className="mph-subtitle">Bank xizmatlari</h2>

      <div className="mph-customer-tabs">
        <button
          className={customerType === 'individual' ? 'active' : ''}
          onClick={() => setCustomerType('individual')}
        >
          <User size={16} /> Jismoniy shaxs
        </button>
        <button
          className={customerType === 'legal' ? 'active' : ''}
          onClick={() => setCustomerType('legal')}
        >
          <Building2 size={16} /> Yuridik shaxs
        </button>
      </div>

      {sortedKeys.length > 0 && (
        <div className="mph-bank-category-grid">
          {sortedKeys.map(key => {
            const meta = subCategoryMap[key] || { key: 'other', icon: Landmark, label: 'Boshqa' };
            const Icon = meta.icon;
            return (
              <button
                key={key}
                className="mph-bank-category-card"
                onClick={() => scrollToSection(key)}
              >
                <Icon size={28} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {sortedKeys.length === 0 ? (
        <div className="mph-loading">Bu bo'limda hozircha xizmat yo'q</div>
      ) : (
        <div className="mph-bank-groups">
          {sortedKeys.map(key => {
            const groupItems = grouped[key];
            const meta = subCategoryMap[key] || { key: 'other', icon: Landmark, label: 'Boshqa' };
            const Icon = meta.icon;
            return (
              <div
                key={key}
                className="mph-bank-group"
                ref={el => (sectionRefs.current[key] = el)}
              >
                <div className="mph-bank-group-header">
                  <Icon size={20} />
                  <h3>{meta.label}</h3>
                </div>
                <div className="uc-grid">
                  {groupItems.map(s => (
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
            );
          })}
        </div>
      )}

      {showScrollTop && (
        <button className="mph-scroll-top-btn" onClick={scrollToTop} aria-label="Yuqoriga">
          <ArrowUp size={22} />
          <span>Yuqoriga</span>
        </button>
      )}
    </div>
  );
}