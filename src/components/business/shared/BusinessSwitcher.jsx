import { useState } from 'react';
import { Building2, Plus, ChevronDown } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { createBusiness } from '../../services/business';

import { T } from '../../utils/T';

// Xodim rollari — kodni emas, odam tushunadigan nomni ko'rsatamiz
const ROLE_LABELS = {
  owner: 'Egasi',
  admin: 'Boshqaruvchi',
  director: 'Direktor',
  cashier: 'Kassir',
  warehouse_worker: 'Omborchi',
};

// Bo'sh holatda — ZUMO Biznes nima va nima beradi
const BENEFITS = [
  'Qaysi tovar qancha qolganini ko‘rasiz — ombor daftari',
  'Sotuvni telefondan kiritasiz — kassa o‘rniga',
  'Kunlik tushum, xarajat va foyda o‘zi hisoblanadi',
  'Sotuvchi yoki omborchi qo‘shib, ularga ruxsat berasiz',
];

export default function BusinessSwitcher() {
  const { myBusinesses, activeBusiness, selectBusiness, refreshBusinesses } = useBusiness();
  const [showList, setShowList] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'store', address: '', phone: '' });
  const [creating, setCreating] = useState(false);

  const allBusinesses = [
    ...myBusinesses.owned.map((b) => ({ ...b, role: 'owner' })),
    ...myBusinesses.staffed.map((b) => ({ ...b, role: b.staffRole || null })),
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setCreating(true);
      await createBusiness(form);
      await refreshBusinesses();
      setShowCreateForm(false);
      setForm({ name: '', type: 'store', address: '', phone: '' });
    } catch (err) {
      alert(err.response?.data?.error || T('Xatolik yuz berdi'));
    } finally {
      setCreating(false);
    }
  };

  if (allBusinesses.length === 0 && !showCreateForm) {
    return (
      <div className="bk-empty" style={{ padding: '3rem 1rem' }}>
        <Building2 size={40} style={{ color: 'var(--cyan)', marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--text)', marginBottom: 6 }}>{T('ZUMO Biznes — do‘koningiz daftari')}</h2>
        <p className="bk-muted" style={{ marginBottom: '1rem', maxWidth: 420, marginInline: 'auto' }}>
          {T('Do‘kon, ombor yoki kafe hisobini telefonda yuritish uchun. E’lonlardan alohida — buni faqat siz va xodimlaringiz ko‘radi.')}
        </p>
        <ul className="bk-benefits">
          {BENEFITS.map((b) => <li key={b}>{T(b)}</li>)}
        </ul>
        <button onClick={() => setShowCreateForm(true)} className="bk-btn bk-btn-primary">
          <Plus size={16} /> {T('Biznesimni qo‘shish')}
        </button>
        <p className="bk-muted" style={{ marginTop: 10, fontSize: '0.8rem' }}>{T('Bepul. Faqat nom kifoya, qolganini keyin to‘ldirasiz.')}</p>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <form onSubmit={handleCreate} className="bk-card" style={{ maxWidth: 420, margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ margin: 0 }}>{T('Yangi biznes')}</h3>
        <label className="bk-field">
          <span>{T('Biznes nomi *')}</span>
          <input className="bk-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="bk-field">
          <span>{T('Turi')}</span>
          <select className="bk-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="store">{T('Do\'kon / Chakana savdo')}</option>
            <option value="warehouse">{T('Ombor / Sklad')}</option>
            <option value="restaurant">{T('Restoran / Kafe')}</option>
            <option value="distribution">{T('Distribyutsiya')}</option>
            <option value="other">{T('Boshqa')}</option>
          </select>
        </label>
        <label className="bk-field">
          <span>{T('Manzil')}</span>
          <input className="bk-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <label className="bk-field">
          <span>{T('Telefon')}</span>
          <input className="bk-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="submit" disabled={creating} className="bk-btn bk-btn-primary">
            {creating ? T('Yaratilmoqda...') : T('Yaratish')}
          </button>
          <button type="button" onClick={() => setShowCreateForm(false)} className="bk-btn bk-btn-secondary">{T('Bekor qilish')}</button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowList(!showList)} className="bk-btn bk-btn-secondary">
        <Building2 size={16} />
        <span>{activeBusiness?.name || T('Biznes tanlang')}</span>
        <ChevronDown size={14} />
      </button>

      {showList && (
        <div className="bk-card" style={{ position: 'absolute', top: '110%', right: 0, minWidth: 220, zIndex: 10, padding: 6 }}>
          {allBusinesses.map((b) => (
            <div
              key={b._id}
              onClick={() => { selectBusiness(b, b.role); setShowList(false); }}
              style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {b.name} <span className={`bk-badge ${b.role === 'owner' ? 'bk-badge-cyan' : 'bk-badge-amber'}`}>{T(ROLE_LABELS[b.role] || 'Xodim')}</span>
            </div>
          ))}
          <div
            onClick={() => { setShowCreateForm(true); setShowList(false); }}
            style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cyan)', fontSize: '0.88rem', borderRadius: 8 }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={14} /> {T('Yangi biznes')}
          </div>
        </div>
      )}
    </div>
  );
}
