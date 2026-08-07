import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Wallet, Users, Package } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getPnL, getLowStock, getDebtors } from '../../services/business';

function StatCard({ icon: Icon, label, value, badgeClass }) {
  return (
    <div className="bk-stat-card">
      <div className={`bk-stat-icon bk-badge-${badgeClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="bk-stat-label">{label}</div>
        <div className="bk-stat-value">{value}</div>
      </div>
    </div>
  );
}

export default function DashboardTab() {
  const { activeBusiness, myRole } = useBusiness();
  const [pnl, setPnl] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);

  const canSeeFinance = myRole === 'owner' || myRole === 'admin' || myRole === 'director';

  const load = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const calls = [getLowStock(activeBusiness._id)];
      if (canSeeFinance) {
        calls.push(getPnL(activeBusiness._id), getDebtors(activeBusiness._id));
      }
      const results = await Promise.all(calls);
      setLowStock(results[0].data);
      if (canSeeFinance) {
        setPnl(results[1].data);
        setDebtors(results[2].data);
      }
    } catch (err) {
      console.error('Dashboard yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, canSeeFinance]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="bk-empty">Yuklanmoqda...</div>;

  const totalDebt = debtors.reduce((sum, d) => sum + d.totalDebt, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {canSeeFinance && pnl && (
        <div className="bk-stat-grid">
          <StatCard icon={TrendingUp} label="Joriy oy sotuvlari" value={`${pnl.totalRevenue.toLocaleString()} so'm`} badgeClass="cyan" />
          <StatCard
            icon={pnl.netProfit >= 0 ? TrendingUp : TrendingDown}
            label="Sof foyda"
            value={`${pnl.netProfit.toLocaleString()} so'm`}
            badgeClass={pnl.netProfit >= 0 ? 'green' : 'red'}
          />
          <StatCard icon={Wallet} label="Qarzdorlik (nasiya)" value={`${totalDebt.toLocaleString()} so'm`} badgeClass="amber" />
          <StatCard icon={Package} label="Kam qolgan mahsulotlar" value={lowStock.length} badgeClass="red" />
        </div>
      )}

      <div>
        <h4 className="bk-section-title">
          <AlertTriangle size={16} style={{ color: '#ffaa00' }} /> Kam qolgan mahsulotlar
        </h4>
        {lowStock.length === 0 ? (
          <div className="bk-empty">Hammasi yetarli miqdorda</div>
        ) : (
          <div className="bk-table-wrap">
            <table className="bk-table">
              <thead><tr><th>Mahsulot</th><th>Joriy qoldiq</th><th>Minimal chegaraviy</th></tr></thead>
              <tbody>
                {lowStock.map(({ product, totalQty }) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td><span className="bk-badge bk-badge-red">{totalQty}</span></td>
                    <td className="bk-muted">{product.minStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canSeeFinance && (
        <div>
          <h4 className="bk-section-title">
            <Users size={16} /> Eng ko'p qarzdor mijozlar
          </h4>
          {debtors.length === 0 ? (
            <div className="bk-empty">Qarzdorlar yo'q</div>
          ) : (
            <div className="bk-table-wrap">
              <table className="bk-table">
                <thead><tr><th>Mijoz</th><th>Qarz</th></tr></thead>
                <tbody>
                  {debtors.slice(0, 5).map((d) => (
                    <tr key={d._id}>
                      <td>{d.name}</td>
                      <td><span className="bk-badge bk-badge-red">{d.totalDebt.toLocaleString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}