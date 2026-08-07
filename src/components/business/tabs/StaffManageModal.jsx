import { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Trash2, Search } from 'lucide-react';
import api from '../../services/api';
import { getStaff, addStaff, updateStaffRole, removeStaff } from '../../services/business';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'director', label: 'Direktor' },
  { value: 'cashier', label: 'Kassir' },
  { value: 'warehouse_worker', label: 'Omborchi' },
];

export default function StaffManageModal({ businessId, onClose }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState('cashier');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getStaff(businessId);
      setStaff(res.data);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get('/users/search', { params: { q: search } });
        setSearchResults(res.data);
      } catch (err) {
        console.error('Foydalanuvchi qidirishda xatolik:', err);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleAdd = async () => {
    if (!selectedUser) return;
    setAdding(true);
    setError('');
    try {
      await addStaff(businessId, { userId: selectedUser._id, role });
      setSelectedUser(null);
      setSearch('');
      setSearchResults([]);
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (staffId, newRole) => {
    await updateStaffRole(businessId, staffId, newRole);
    loadStaff();
  };

  const handleRemove = async (member) => {
    if (!confirm(`${member.userId?.fullName || 'Xodim'}ni ishdan bo'shatasizmi?`)) return;
    await removeStaff(businessId, member._id);
    loadStaff();
  };

  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <div className="bk-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="bk-modal-header">
          <h3>Xodimlar</h3>
          <button className="bk-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="bk-card" style={{ marginBottom: 20, background: 'var(--bg)' }}>
          <div className="bk-search" style={{ maxWidth: '100%', marginBottom: 10 }}>
            <Search size={16} />
            <input
              placeholder="Ism yoki email bo'yicha qidirish..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedUser(null); }}
            />
          </div>

          {searching && <div className="bk-muted" style={{ fontSize: '0.8rem' }}>Qidirilmoqda...</div>}

          {!selectedUser && searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => { setSelectedUser(u); setSearchResults([]); }}
                  className="bk-card"
                  style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {u.fullName || u.email} <span className="bk-muted">({u.email})</span>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem' }}>
                Tanlandi: <strong>{selectedUser.fullName || selectedUser.email}</strong>
              </span>
              <select className="bk-select" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <button className="bk-btn bk-btn-primary" onClick={handleAdd} disabled={adding}>
                <UserPlus size={14} /> {adding ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
              </button>
            </div>
          )}

          {error && <div className="bk-error">{error}</div>}
        </div>

        {loading ? (
          <div className="bk-empty">Yuklanmoqda...</div>
        ) : staff.length === 0 ? (
          <div className="bk-empty">Hali xodim qo'shilmagan</div>
        ) : (
          <div className="bk-table-wrap">
            <table className="bk-table">
              <thead><tr><th>Ism</th><th>Rol</th><th></th></tr></thead>
              <tbody>
                {staff.map((m) => (
                  <tr key={m._id}>
                    <td>{m.userId?.fullName || m.userId?.email || '—'}</td>
                    <td>
                      <select className="bk-select" value={m.role} onChange={(e) => handleRoleChange(m._id, e.target.value)} style={{ fontSize: '0.8rem', padding: '5px 8px' }}>
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="bk-icon-btn bk-danger" onClick={() => handleRemove(m)}><Trash2 size={14} /></button>
                    </td>
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