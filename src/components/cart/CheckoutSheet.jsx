// Tovar buyurtmasini rasmiylashtirish (Uzum uslubi): qabul qilish usuli, manzil, telefon,
// to'lov usuli (tovarni olganda), izoh va xulosa. Faqat jismoniy tovarlar bo'lsa ochiladi.
import { useEffect, useState } from 'react';
import { Banknote, CreditCard, MapPin, Phone, Store, Truck, X } from 'lucide-react';
import LocationMapPicker from '../forms/LocationMapPicker';
import { getUserProfile, updateUserProfile } from '../services/user';
import { resolveMediaUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';
import { T } from '../utils/T';
import '../../styles/checkout.css';

// +998 XX XXX XX XX ko'rinishida yozib boramiz
function formatUzPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^998/, '').slice(0, 9);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

export default function CheckoutSheet({ items, totals, submitting, onClose, onSubmit }) {
  const [method, setMethod] = useState('delivery');
  const [location, setLocation] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [phone, setPhone] = useState('');
  // Profilda raqam bo'lsa — so'ramaymiz, faqat ko'rsatamiz ("O'zgartirish" bilan)
  const [profilePhone, setProfilePhone] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [payment, setPayment] = useState('cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Telefon profildan avtomatik
  useEffect(() => {
    getUserProfile()
      .then((res) => {
        const saved = formatUzPhone(res.data?.phone);
        if (saved.replace(/\D/g, '').length === 9) {
          setProfilePhone(saved);
          setPhone((current) => current || saved);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const phoneDigits = phone.replace(/\D/g, '');
  const submit = () => {
    if (method === 'delivery' && !location) {
      setError(T('Yetkazib berish manzilini xaritadan tanlang'));
      setMapOpen(true);
      return;
    }
    if (phoneDigits.length !== 9) {
      setError(T('Telefon raqamini to‘liq kiriting'));
      return;
    }
    setError('');
    // Keyingi safar so'ramaslik uchun — profilda raqam bo'lmasa saqlab qo'yamiz
    if (!profilePhone) updateUserProfile({ phone: `+998${phoneDigits}` }).catch(() => {});
    onSubmit({
      deliveryMethod: method,
      buyerLocation: method === 'delivery' ? location : null,
      phone: `+998${phoneDigits}`,
      paymentMethod: payment,
      note: note.trim(),
    });
  };

  const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="co-overlay" role="dialog" aria-modal="true" aria-label={T('Rasmiylashtirish')} onClick={onClose}>
      <div className="co-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="co-head">
          <h2>{T('Rasmiylashtirish')}</h2>
          <button type="button" onClick={onClose} aria-label={T('Yopish')}><X size={20} /></button>
        </header>

        <div className="co-body">
          <section className="co-section">
            <h3>{T('Qabul qilish usuli')}</h3>
            <div className="co-options">
              <button type="button" className={`co-option ${method === 'delivery' ? 'is-on' : ''}`} onClick={() => { setMethod('delivery'); setError(''); }}>
                <Truck size={20} />
                <span><strong>{T('Yetkazib berish')}</strong><small>{T('Sotuvchi manzilingizga olib keladi')}</small></span>
              </button>
              <button type="button" className={`co-option ${method === 'pickup' ? 'is-on' : ''}`} onClick={() => { setMethod('pickup'); setError(''); }}>
                <Store size={20} />
                <span><strong>{T('O‘zim olib ketaman')}</strong><small>{T('Manzilni sotuvchi telefonda aytadi')}</small></span>
              </button>
            </div>
          </section>

          {method === 'delivery' && (
            <section className="co-section">
              <h3>{T('Manzil')}</h3>
              <button type="button" className={`co-address ${location ? 'is-set' : ''}`} onClick={() => setMapOpen((v) => !v)}>
                <MapPin size={18} />
                <span>{location?.address || T('Xaritadan tanlang')}</span>
              </button>
              {mapOpen && (
                <div className="co-map">
                  <LocationMapPicker lat={location?.lat} lng={location?.lng} onSelect={(loc) => { setLocation(loc); setError(''); }} />
                </div>
              )}
            </section>
          )}

          <section className="co-section">
            <h3>{T('Aloqa uchun telefon')}</h3>
            {profilePhone && !editingPhone ? (
              <div className="co-phone-saved">
                <Phone size={18} />
                <span><strong>+998 {phone}</strong><small>{T('Sotuvchi buyurtmani tasdiqlash uchun shu raqamga qo‘ng‘iroq qiladi')}</small></span>
                <button type="button" onClick={() => setEditingPhone(true)}>{T('O‘zgartirish')}</button>
              </div>
            ) : (
              <>
                <label className="co-phone">
                  <Phone size={18} />
                  <span className="co-phone__code">+998</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                  />
                </label>
                <p className="co-field-hint">{T('Sotuvchi buyurtmani tasdiqlash va yetkazish vaqtini kelishish uchun qo‘ng‘iroq qiladi. Raqam faqat shu sotuvchiga ko‘rinadi va profilingizga saqlanadi.')}</p>
              </>
            )}
          </section>

          <section className="co-section">
            <h3>{T('To‘lov — tovarni olganda')}</h3>
            <div className="co-options co-options--row">
              <button type="button" className={`co-option ${payment === 'cash' ? 'is-on' : ''}`} onClick={() => setPayment('cash')}>
                <Banknote size={20} /> <strong>{T('Naqd')}</strong>
              </button>
              <button type="button" className={`co-option ${payment === 'card' ? 'is-on' : ''}`} onClick={() => setPayment('card')}>
                <CreditCard size={20} /> <strong>{T('Karta orqali')}</strong>
              </button>
            </div>
          </section>

          <section className="co-section">
            <h3>{T('Izoh (ixtiyoriy)')}</h3>
            <textarea
              className="co-note"
              rows={2}
              maxLength={500}
              placeholder={T('Masalan: 3-podyezd, 5-qavat, kechqurun keling')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>

          <section className="co-section co-summary">
            <h3>{T('Buyurtmangiz')}</h3>
            {items.map((item) => (
              <div key={item.id} className="co-line">
                <img className="co-line__img" src={resolveMediaUrl(item.image)} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/zumo-placeholder.svg'; }} />
                <span className="co-line__title">{item.title} <em>× {item.quantity || 1}</em></span>
                <span>{formatPrice((item.price || 0) * (item.quantity || 1), item.currency)}</span>
              </div>
            ))}
            <div className="co-line co-line--total">
              <span>{T('Jami ({{count}} ta)', { count })}</span>
              <span>{totals}</span>
            </div>
            <p className="co-hint">{T('Har bir sotuvchi buyurtmani o‘zi tasdiqlaydi va yetkazish muddatini aytadi. To‘lov tovarni qo‘lingizga olganingizda.')}</p>
          </section>
        </div>

        <footer className="co-foot">
          {error && <p className="co-error">{error}</p>}
          <button type="button" className="co-submit" onClick={submit} disabled={submitting}>
            {submitting ? T('Yuborilmoqda...') : T('Buyurtmani tasdiqlash')}
          </button>
        </footer>
      </div>
    </div>
  );
}
