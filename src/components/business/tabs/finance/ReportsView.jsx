import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';
import { useBusiness } from '../../context/BusinessContext';
import { getPnL, getCashflow, getTopProducts } from '../../../services/business';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function ReportsView() {
  const { activeBusiness } = useBusiness();
  const [pnl, setPnl] = useState(null);
  const [cashflow, setCashflow] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const [pnlRes, cfRes, tpRes] = await Promise.all([
        getPnL(activeBusiness._id),
        getCashflow(activeBusiness._id),
        getTopProducts(activeBusiness._id),
      ]);
      setPnl(pnlRes.data);
      setCashflow(cfRes.data);
      setTopProducts(tpRes.data);
    } catch (err) {
      console.error('Hisobotlarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="pt-empty">Yuklanmoqda...</div>;

  const chartData = {
    labels: cashflow.map((d) => new Date(d.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: 'Kirim',
        data: cashflow.map((d) => d.cashIn),
        borderColor: '#00E5FF',
        backgroundColor: 'rgba(0,229,255,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Chiqim',
        data: cashflow.map((d) => d.cashOut),
        borderColor: '#ff5c5c',
        backgroundColor: 'rgba(255,92,92,0.08)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: 'var(--textMuted)' } } },
    scales: {
      x: { ticks: { color: 'var(--textMuted)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: 'var(--textMuted)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  return (
    <div>
      {/* ==================== P&L KARTOCHKALARI ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Sotuvlar" value={pnl?.totalRevenue} color="#00E5FF" />
        <SummaryCard label="Tannarx" value={pnl?.totalCost} color="#ffaa00" />
        <SummaryCard label="Yalpi foyda" value={pnl?.grossProfit} color="#00c864" />
        <SummaryCard label="Xarajatlar" value={pnl?.totalExpenses} color="#ff5c5c" />
        <SummaryCard label="Sof foyda" value={pnl?.netProfit} color={pnl?.netProfit >= 0 ? '#00c864' : '#ff5c5c'} bold />
      </div>

      {/* ==================== CASH FLOW GRAFIGI ==================== */}
      <h4 style={{ marginBottom: 10 }}>Pul oqimi (joriy oy)</h4>
      {cashflow.length === 0 ? (
        <div className="pt-empty">Hali ma'lumot yo'q</div>
      ) : (
        <div style={{ height: 260, marginBottom: 24 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* ==================== TOP MAHSULOTLAR ==================== */}
      <h4 style={{ marginBottom: 10 }}>Eng ko'p sotilgan mahsulotlar</h4>
      {topProducts.length === 0 ? (
        <div className="pt-empty">Hali sotuvlar yo'q</div>
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Mahsulot</th><th>Sotilgan miqdor</th><th>Tushum</th></tr></thead>
            <tbody>
              {topProducts.map((tp) => (
                <tr key={tp.productId}>
                  <td>{tp.name}</td>
                  <td>{tp.totalQuantitySold}</td>
                  <td>{tp.totalRevenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, bold }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: '0.78rem', color: 'var(--textMuted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: bold ? '1.2rem' : '1.05rem', fontWeight: bold ? 700 : 600, color }}>
        {(value || 0).toLocaleString()}
      </div>
    </div>
  );
}