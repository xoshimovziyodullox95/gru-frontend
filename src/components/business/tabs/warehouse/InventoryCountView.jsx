import { useState, useEffect, useCallback } from 'react';
import { PlayCircle, CheckCircle2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import RoleGate from '../../shared/RoleGate';
import {
  getInventoryCounts, startInventoryCount, getInventoryCount,
  updateInventoryCountItem, completeInventoryCount,
} from '../../../services/business';

function CountSession({ count, businessId, onClose, onCompleted }) {
  const [items, setItems] = useState(count.items);
  const [saving, setSaving] = useState({});

  const handleCountChange = async (productId, value) => {
    if (value === '') return;
    setSaving({ ...saving, [productId]: true });
    try {
      const res = await updateInventoryCountItem(businessId, count._id, { productId, countedQuantity: Number(value) });
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving({ ...saving, [productId]: false });
    }
  };

  const handleComplete = async () => {
    const uncounted = items.filter((i) => i.countedQuantity == null).length;
    if (uncounted > 0 && !confirm(`${uncounted} ta mahsulot hali sanalmagan. Baribir yakunlansinmi?`)) return;
    try {
      await completeInventoryCount(businessId, count._id);
      onCompleted();
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  return (
    <div>
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr><th>Mahsulot</th><th>Tizimda</th><th>Sanalgan</th><th>Farq</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId._id || item.productId}>
                <td>{item.productId?.name || '—'}</td>
                <td className="pt-muted">{item.systemQuantity}</td>
                <td>
                  <input
                    type="number"
                    defaultValue={item.countedQuantity ?? ''}
                    onBlur={(e) => handleCountChange(item.productId._id || item.productId, e.target.value)}
                    placeholder="—"
                    style={{ width: 80, padding: '4px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
                  />
                </td>
                <td style={{ color: item.difference > 0 ? '#00c864' : item.difference < 0 ? '#ff5c5c' : 'var(--textMuted)' }}>
                  {item.difference > 0 ? `+${item.difference}` : item.difference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={onClose} className="pt-btn-secondary">Yopish</button>
        <RoleGate roles={['admin']}>
          <button onClick={handleComplete} className="pt-btn-primary"><CheckCircle2 size={16} /> Yakunlash</button>
        </RoleGate>
      </div>
    </div>
  );
}

export default function InventoryCountView() {
  const { activeBusiness, activeWarehouse } = useBusiness();
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  const load = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await getInventoryCounts(activeBusiness._id);
      setCounts(res.data);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => { load(); }, [load]);

  const handleStart = async () => {
    if (!activeWarehouse) return;
    try {
      const res = await startInventoryCount(activeBusiness._id, activeWarehouse._id);
      const full = await getInventoryCount(activeBusiness._id, res.data._id);
      setActiveSession(full.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  const handleOpen = async (count) => {
    const full = await getInventoryCount(activeBusiness._id, count._id);
    setActiveSession(full.data);
  };

  if (activeSession) {
    return (
      <CountSession
        count={activeSession}
        businessId={activeBusiness._id}
        onClose={() => { setActiveSession(null); load(); }}
        onCompleted={() => { setActiveSession(null); load(); }}
      />
    );
  }

  return (
    <>
      <div className="pt-toolbar">
        <span className="pt-muted">Jami: {counts.length} ta sessiya</span>
        <RoleGate roles={['admin', 'warehouse_worker']}>
          <button className="pt-btn-primary" onClick={handleStart}><PlayCircle size={16} /> Yangi sverka boshlash</button>
        </RoleGate>
      </div>

      {loading ? (
        <div className="pt-empty">Yuklanmoqda...</div>
      ) : counts.length === 0 ? (
        <div className="pt-empty">Hali sverka o'tkazilmagan</div>
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Sana</th><th>Holati</th><th></th></tr></thead>
            <tbody>
              {counts.map((c) => (
                <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => handleOpen(c)}>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>{c.status === 'completed' ? 'Yakunlangan' : 'Jarayonda'}</td>
                  <td className="pt-muted">Ochish →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}