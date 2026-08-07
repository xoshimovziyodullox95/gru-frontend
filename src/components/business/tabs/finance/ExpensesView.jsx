import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import RoleGate from '../../shared/RoleGate';
import { getExpenses, createExpense, deleteExpense } from '../../../services/business';

const CATEGORIES = ['Ijara', 'Maosh', 'Kommunal', 'Transport', 'Reklama', 'Boshqa'];

function ExpenseModal({ onClose, onSaved, businessId }) {
  const [form, setForm] = useState({ category: CATEGORIES[0], amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Summani to\'g\'ri kiriting');
      return;
    }
    setSaving(true);
    try {
      await createExpense(businessId, { ...form, amount: Number(form.amount) });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-modal-overlay" onClick={onClose}>
      <form className="pt-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <div className="pt-modal-header">
          <h3>Yangi xarajat</h3>
          <button type="button" className="pt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="pt-form-grid">
          <label className="pt-field">
            <span>Kategoriya</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="pt-field">
            <span>Summa *</span>
            <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
          </label>
          <label className="pt-field">
            <span>Sana</span>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="pt-field pt-field-full">
            <span>Izoh</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ixtiyoriy" />
          </label>
        </div>
        {error && <div className="pt-error">{error}</div>}
        <div className="pt-modal-actions">
          <button type="button" onClick={onClose} className="pt-btn-secondary">Bekor qilish</button>
          <button type="submit" disabled={saving} className="pt-btn-primary">{saving ? 'Saqlanmoqda...' : 'Qo\'shish'}</button>
        </div>
      </form>
    </div>
  );
}

export default function ExpensesView() {
  const { activeBusiness } = useBusiness();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await getExpenses(activeBusiness._id);
      setExpenses(res.data);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (exp) => {
    if (!confirm('O\'chirilsinmi?')) return;
    await deleteExpense(activeBusiness._id, exp._id);
    load();
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <div className="pt-toolbar">
        <span className="pt-muted">Jami: {total.toLocaleString()} so'm</span>
        <RoleGate roles={['admin', 'director']}>
          <button className="pt-btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Yangi xarajat</button>
        </RoleGate>
      </div>

      {loading ? (
        <div className="pt-empty">Yuklanmoqda...</div>
      ) : expenses.length === 0 ? (
        <div className="pt-empty">Hali xarajat qo'shilmagan</div>
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead><tr><th>Sana</th><th>Kategoriya</th><th>Izoh</th><th>Summa</th><th></th></tr></thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id}>
                  <td className="pt-muted">{new Date(e.date).toLocaleDateString()}</td>
                  <td>{e.category}</td>
                  <td className="pt-muted">{e.description || '—'}</td>
                  <td>{e.amount.toLocaleString()}</td>
                  <td>
                    <RoleGate roles={['admin', 'director']}>
                      <button className="pt-icon-btn pt-icon-danger" onClick={() => handleDelete(e)}><Trash2 size={14} /></button>
                    </RoleGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ExpenseModal businessId={activeBusiness._id} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />
      )}
    </>
  );
}