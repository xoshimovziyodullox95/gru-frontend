import { safeGoBack } from '../utils/navigation.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, Package, Warehouse, ShoppingCart, Wallet, Users } from 'lucide-react';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import BusinessSwitcher from './shared/BusinessSwitcher';
import RoleGate from './shared/RoleGate';
import StaffManageModal from './tabs/StaffManageModal';
import DashboardTab from './tabs/DashboardTab';
import ProductsTab from './tabs/ProductsTab';
import WarehouseTab from './tabs/WarehouseTab';
import SalesTab from './tabs/SalesTab';
import FinanceTab from './tabs/FinanceTab';
import '../../styles/businessKit.css';

import { T } from '../utils/T';
// hint — bo'lim nima uchunligini bir gapda tushuntiradi
const TABS = [
  { key: 'dashboard', label: T('Ko‘rsatkichlar'), hint: T('Sotuv, foyda, qarz va kam qolgan tovarlarni ko‘ring.'), icon: LayoutDashboard, Component: DashboardTab },
  { key: 'products', label: T('Tovarlar'), hint: T('Sotadigan mahsulotingiz nomi va narxini kiriting.'), icon: Package, Component: ProductsTab },
  { key: 'warehouse', label: T('Ombor'), hint: T('Kelgan tovarlarni “Kirim” bo‘limida qoldiqqa qo‘shing.'), icon: Warehouse, Component: WarehouseTab },
  { key: 'sales', label: T('Kassa'), hint: T('Sotuvni shu yerda kiriting — mahsulot miqdori ombordan ayriladi.'), icon: ShoppingCart, Component: SalesTab },
  { key: 'finance', label: T('Moliya'), hint: T('Xarajatlar, qarzdorlar va moliyaviy hisobotlarni ko‘ring.'), icon: Wallet, Component: FinanceTab },
];

const BUSINESS_STEPS = [
  { key: 'products', title: T('1. Tovar qo‘shing'), text: T('Nomi va sotuv narxini kiriting.'), icon: Package },
  { key: 'warehouse', title: T('2. Omborga kirim qiling'), text: T('Kelgan mahsulot sonini qoldiqqa qo‘shing.'), icon: Warehouse },
  { key: 'sales', title: T('3. Kassada soting'), text: T('Sotuvni kiriting — qoldiq avtomatik kamayadi.'), icon: ShoppingCart },
  { key: 'dashboard', title: T('4. Natijani ko‘ring'), text: T('Tushum, foyda va kam qolgan tovarlarni kuzating.'), icon: LayoutDashboard },
];

function BusinessSystemInner() {
  const navigate = useNavigate();
  const { activeBusiness, loading } = useBusiness();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showStaffModal, setShowStaffModal] = useState(false);

  if (loading) return <div className="bk-empty">{T('Yuklanmoqda...')}</div>;

  return (
    <div className="bk-page">
      <div className="bk-header">
        <button className="bk-btn bk-btn-secondary" onClick={() => safeGoBack(navigate)}>
          <ArrowLeft size={16} /> {T('Orqaga')}
        </button>
        <div className="bk-header-actions">
          {activeBusiness && (
            <RoleGate roles={['admin']}>
              <button className="bk-btn bk-btn-secondary" onClick={() => setShowStaffModal(true)}>
                <Users size={16} /> {T('Xodimlar')}
              </button>
            </RoleGate>
          )}
          <BusinessSwitcher />
        </div>
      </div>

      {activeBusiness && (
        <>
          <section className="bk-start-guide" aria-labelledby="bk-start-title">
            <div className="bk-start-guide__heading">
              <div>
                <h2 id="bk-start-title">{T('ZUMO Biznes qanday ishlaydi?')}</h2>
                <p>{T('Do‘kon hisobini yuritish uchun shu 4 qadamdan boshlang.')}</p>
              </div>
            </div>
            <div className="bk-start-guide__steps">
              {BUSINESS_STEPS.map(({ key, title, text, icon: Icon }) => (
                <button key={key} type="button" className="bk-start-step" onClick={() => setActiveTab(key)}>
                  <span className="bk-start-step__icon"><Icon size={18} /></span>
                  <span className="bk-start-step__copy"><strong>{title}</strong><small>{text}</small></span>
                  <span className="bk-start-step__arrow" aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </section>
          <div className="bk-tabs">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`bk-tab ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <p className="bk-tab-hint">{TABS.find((tab) => tab.key === activeTab)?.hint}</p>

          <div className="bk-content">
            {TABS.map(({ key, Component }) =>
              activeTab === key ? <Component key={key} /> : null
            )}
          </div>
        </>
      )}

      {showStaffModal && activeBusiness && (
        <StaffManageModal businessId={activeBusiness._id} onClose={() => setShowStaffModal(false)} />
      )}
    </div>
  );
}

export default function BusinessSystemPage() {
  return (
    <BusinessProvider>
      <BusinessSystemInner />
    </BusinessProvider>
  );
}
