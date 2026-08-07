import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import RoleGate from '../../shared/RoleGate';
import { createWarehouse } from '../../../services/business';

export default function WarehouseManageView() {
  const { activeBusiness, warehouses, activeWarehouse, setActiveWarehouse, refreshBusinesses, selectBusiness, myRole } = useBusiness();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createWarehouse(activeBusiness._id, { name: name.trim(), address });
      await selectBusiness(activeBusiness, myRole); // omborlar ro'yxatini yangilash uchun qayta yuklaydi
      setShowForm(false);
      setName(''); setAddress('');
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="pt-table-wrap" style={{ marginBottom: 16 }}>
        <table className="pt-table">
          <thead><tr><th>Nomi</th><th>Manzil</th><th></th></tr></thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w._id} style={{ background: activeWarehouse?._id === w._id ? 'rgba(0,229,255,0.06)' : 'transparent' }}>
                <td>{w.name} {w.isDefault && <span className="pt-muted">(asosiy)</span>}</td>
                <td className="pt-muted">{w.address || '—'}</td>
                <td>
                  {activeWarehouse?._id !== w._id && (
                    <button className="pt-btn-secondary" onClick={() => setActiveWarehouse(w)}>Tanlash</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RoleGate roles={['admin']}>
        {showForm ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, maxWidth: 460 }}>
            <input placeholder="Ombor nomi" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
            <input placeholder="Manzil" value={address} onChange={(e) => setAddress(e.target.value)} style={{ flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
            <button type="submit" disabled={saving} className="pt-btn-primary">{saving ? '...' : 'Qo\'shish'}</button>
          </form>
        ) : (
          <button className="pt-btn-secondary" onClick={() => setShowForm(true)}><Plus size={14} /> Yangi ombor</button>
        )}
      </RoleGate>
    </div>
  );
}