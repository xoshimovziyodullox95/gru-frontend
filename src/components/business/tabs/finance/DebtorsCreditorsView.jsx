import { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { getDebtors, getCreditors } from '../../../services/business';

export default function DebtorsCreditorsView() {
  const { activeBusiness } = useBusiness();
  const [debtors, setDebtors] = useState([]);
  const [creditors, setCreditors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBusiness) return;
    Promise.all([getDebtors(activeBusiness._id), getCreditors(activeBusiness._id)])
      .then(([d, c]) => { setDebtors(d.data); setCreditors(c.data); })
      .finally(() => setLoading(false));
  }, [activeBusiness]);

  if (loading) return <div className="pt-empty">Yuklanmoqda...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <h4 style={{ marginBottom: 10 }}>Qarzdor mijozlar (nasiya)</h4>
        {debtors.length === 0 ? (
          <div className="pt-empty">Qarzdorlar yo'q</div>
        ) : (
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead><tr><th>Mijoz</th><th>Qarz</th></tr></thead>
              <tbody>
                {debtors.map((d) => (
                  <tr key={d._id}>
                    <td>{d.name}</td>
                    <td style={{ color: '#ff5c5c' }}>{d.totalDebt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h4 style={{ marginBottom: 10 }}>Yetkazib beruvchilarga qarz</h4>
        {creditors.length === 0 ? (
          <div className="pt-empty">Qarzlar yo'q</div>
        ) : (
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead><tr><th>Yetkazib beruvchi</th><th>Qarz</th></tr></thead>
              <tbody>
                {creditors.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td style={{ color: '#ffaa00' }}>{c.totalOwed.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}