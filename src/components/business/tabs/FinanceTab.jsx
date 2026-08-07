import { useState } from 'react';
import { Receipt, Users, BarChart3 } from 'lucide-react';
import ExpensesView from './finance/ExpensesView';
import DebtorsCreditorsView from './finance/DebtorsCreditorsView';
import ReportsView from './finance/ReportsView';
import '../../../styles/productsTab.css';

const SECTIONS = [
  { key: 'expenses', label: 'Xarajatlar', icon: Receipt, Component: ExpensesView },
  { key: 'debts', label: 'Qarzdorlar', icon: Users, Component: DebtorsCreditorsView },
  { key: 'reports', label: 'Hisobotlar', icon: BarChart3, Component: ReportsView },
];

export default function FinanceTab() {
  const [section, setSection] = useState('reports');
  const ActiveComponent = SECTIONS.find((s) => s.key === section)?.Component;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
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

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}