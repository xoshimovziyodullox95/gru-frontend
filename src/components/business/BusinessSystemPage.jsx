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

const TABS = [
  { key: 'dashboard', label: 'Umumiy', icon: LayoutDashboard, Component: DashboardTab },
  { key: 'products', label: 'Mahsulotlar', icon: Package, Component: ProductsTab },
  { key: 'warehouse', label: 'Ombor', icon: Warehouse, Component: WarehouseTab },
  { key: 'sales', label: 'Kassa (POS)', icon: ShoppingCart, Component: SalesTab },
  { key: 'finance', label: 'Moliya', icon: Wallet, Component: FinanceTab },
];

function BusinessSystemInner() {
  const navigate = useNavigate();
  const { activeBusiness, loading } = useBusiness();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showStaffModal, setShowStaffModal] = useState(false);

  if (loading) return <div className="bk-empty">Yuklanmoqda...</div>;

  return (
    <div className="bk-page">
      <div className="bk-header">
        <button className="bk-btn bk-btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Orqaga
        </button>
        <div className="bk-header-actions">
          {activeBusiness && (
            <RoleGate roles={['admin']}>
              <button className="bk-btn bk-btn-secondary" onClick={() => setShowStaffModal(true)}>
                <Users size={16} /> Xodimlar
              </button>
            </RoleGate>
          )}
          <BusinessSwitcher />
        </div>
      </div>

      {activeBusiness && (
        <>
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