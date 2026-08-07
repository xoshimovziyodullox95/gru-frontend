// src/components/business/SupplierStatsWidget.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, ChevronRight, Truck } from 'lucide-react';
import { getSupplierStats } from '../services/user';
import '../../styles/businessSummaryWidget.css';

export default function SupplierStatsWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupplierStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats({ totalOrders: 0, totalIncome: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="bsw-card" onClick={() => navigate('/supplier-stats')}>
      <div className="bsw-header">
        <span className="bsw-title"><Truck size={14} style={{ marginRight: 6 }} />Postavshik ko'rsatkichlari</span>
        <ChevronRight size={16} />
      </div>
      <div className="bsw-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="bsw-stat">
          <Package size={16} className="bsw-icon-green" />
          <div>
            <span className="bsw-stat-value">{stats.totalOrders}</span>
            <span className="bsw-stat-label">Jami buyurtmalar</span>
          </div>
        </div>
        <div className="bsw-stat">
          <DollarSign size={16} className="bsw-icon-amber" />
          <div>
            <span className="bsw-stat-value">${stats.totalIncome.toLocaleString()}</span>
            <span className="bsw-stat-label">Taxminiy kirim</span>
          </div>
        </div>
      </div>
    </div>
  );
}