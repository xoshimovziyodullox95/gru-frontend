import { useState } from 'react';
import { Package, Truck, ArrowLeftRight, ClipboardCheck, Settings } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import StockView from './warehouse/StockView';
import PurchaseOrdersView from './warehouse/PurchaseOrdersView';
import TransfersView from './warehouse/TransfersView';
import InventoryCountView from './warehouse/InventoryCountView';
import WarehouseManageView from './warehouse/WarehouseManageView';
import '../../../styles/productsTab.css';

const SECTIONS = [
  { key: 'stock', label: 'Qoldiqlar', icon: Package, Component: StockView },
  { key: 'purchase', label: 'Kirim', icon: Truck, Component: PurchaseOrdersView },
  { key: 'transfer', label: "Ko'chirish", icon: ArrowLeftRight, Component: TransfersView },
  { key: 'count', label: 'Sverka', icon: ClipboardCheck, Component: InventoryCountView },
  { key: 'manage', label: 'Omborlar', icon: Settings, Component: WarehouseManageView },
];

export default function WarehouseTab() {
  const { activeWarehouse, warehouses, setActiveWarehouse } = useBusiness();
  const [section, setSection] = useState('stock');

  const ActiveComponent = SECTIONS.find((s) => s.key === section)?.Component;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={section === key ? 'pt-btn-primary' : 'pt-btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {warehouses.length > 1 && section !== 'manage' && (
          <select
            value={activeWarehouse?._id || ''}
            onChange={(e) => setActiveWarehouse(warehouses.find((w) => w._id === e.target.value))}
            style={{ padding: '6px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
          >
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        )}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}