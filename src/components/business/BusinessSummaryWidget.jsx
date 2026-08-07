import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Receipt, ChevronRight } from 'lucide-react';
import { getMyBusinesses, getPnL, getExpenses } from '../services/business';
import '../../styles/businessSummaryWidget.css';

export default function BusinessSummaryWidget() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasBusiness, setHasBusiness] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const bizRes = await getMyBusinesses();
        const all = [...(bizRes.data.owned || []), ...(bizRes.data.staffed || [])];
        if (all.length === 0) {
          setHasBusiness(false);
          setLoading(false);
          return;
        }
        setHasBusiness(true);
        const business = all[0];

        const [pnlRes, expRes] = await Promise.all([
          getPnL(business._id),
          getExpenses(business._id),
        ]);

        const totalExpenses = (expRes.data || []).reduce((sum, e) => sum + e.amount, 0);

        setData({
          businessName: business.name,
          revenue: pnlRes.data?.totalRevenue || 0,
          profit: pnlRes.data?.netProfit || 0,
          expenses: totalExpenses,
        });
      } catch (err) {
        console.error('Biznes ko\'rsatkichlarini yuklashda xatolik:', err);
        setHasBusiness(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return null;
  if (!hasBusiness) return null;

  return (
    <div className="bsw-card" onClick={() => navigate('/business')}>
      <div className="bsw-header">
        <span className="bsw-title">{data.businessName} — moliyaviy ko'rsatkichlar</span>
        <ChevronRight size={16} />
      </div>
      <div className="bsw-stats">
        <div className="bsw-stat">
          <TrendingUp size={16} className="bsw-icon-green" />
          <div>
            <span className="bsw-stat-value">{data.revenue.toLocaleString()} so'm</span>
            <span className="bsw-stat-label">Sotuvlar</span>
          </div>
        </div>
        <div className="bsw-stat">
          <Receipt size={16} className="bsw-icon-amber" />
          <div>
            <span className="bsw-stat-value">{data.expenses.toLocaleString()} so'm</span>
            <span className="bsw-stat-label">Xarajatlar</span>
          </div>
        </div>
        <div className="bsw-stat">
          {data.profit >= 0 ? (
            <TrendingUp size={16} className="bsw-icon-green" />
          ) : (
            <TrendingDown size={16} className="bsw-icon-red" />
          )}
          <div>
            <span className={`bsw-stat-value ${data.profit >= 0 ? 'bsw-positive' : 'bsw-negative'}`}>
              {data.profit.toLocaleString()} so'm
            </span>
            <span className="bsw-stat-label">Sof foyda</span>
          </div>
        </div>
      </div>
    </div>
  );
}