// src/components/forms/AddLocationForm.jsx
// "Joy: ijara yoki sotuv" — OLX uslubidagi qisqa forma.
// Avvalgi murakkab maydonlar (odamlar oqimi, yaqin obyektlar, ventilyatsiya, raqobat, UVP) olib tashlandi —
// oddiy foydalanuvchi ularni to'ldira olmasdi.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Building2, Warehouse, Home, LandPlot, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createLocation, uploadLocationMedia } from '../services/locations';
import { getUserProfile } from '../services/user';
import LocationMapPicker from './LocationMapPicker';
import SuccessModal from '../common/SuccessModal';
import AITextEnhanceButton from '../common/AITextEnhanceButton';
import { safeGoBack } from '../utils/navigation.js';
import { T } from '../utils/T';
import { Field, FormSection, PhotoPicker, Segmented } from './listingKit';
import { REGIONS } from './listingConstants';
import '../../styles/aienhance.css';

// Joy turi — Location.category da saqlanadi
const PLACE_TYPES = [
  { id: 'dokon', icon: Store, label: 'Do‘kon / savdo joyi' },
  { id: 'ofis', icon: Building2, label: 'Ofis' },
  { id: 'ombor', icon: Warehouse, label: 'Ombor / sex' },
  { id: 'xonadon', icon: Home, label: 'Uy / xonadon' },
  { id: 'yer', icon: LandPlot, label: 'Yer uchastkasi' },
];

const TITLE_MAX = 70;
const DESC_MAX = 3000;

export default function AddLocationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    dealType: 'rent',
    placeType: '',
    title: '',
    price: '',
    currency: 'UZS',
    sqm: '',
    rooms: '',
    floor: '',
    description: '',
    region: '',
    address: '',
    phone: '',
  });
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doneId, setDoneId] = useState(null);

  useEffect(() => {
    getUserProfile()
      .then((res) => setForm((f) => (f.phone ? f : { ...f, phone: res.data?.phone || '' })))
      .catch(() => {});
  }, []);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const onMap = ({ lat, lng, address }) => {
    setCoords({ lat, lng });
    setErrors((e) => ({ ...e, map: undefined, address: undefined }));
    if (address) setForm((f) => ({ ...f, address }));
  };

  const validate = () => {
    const e = {};
    if (!photos.length) e.photos = T('Kamida bitta rasm qo‘shing');
    if (!form.placeType) e.placeType = T('Joy turini tanlang');
    if (form.title.trim().length < 3) e.title = T('Sarlavhani yozing (kamida 3 ta belgi)');
    if (!(Number(form.price) > 0)) e.price = T('Narxni kiriting');
    if (!form.region) e.region = T('Viloyatni tanlang');
    if (!coords.lat || !coords.lng) e.map = T('Xaritada joyni belgilang');
    if (form.address.trim().length < 3) e.address = T('Manzilni yozing');
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = T('Telefon raqamini kiriting');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!user) return navigate('/login');
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    setProgress(0);
    try {
      const price = Number(form.price);
      const res = await createLocation({
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        region: form.region,
        phone: form.phone.trim(),
        dealType: form.dealType,
        price_range: String(price),
        price_per_month: form.dealType === 'rent' ? price : 0,
        currency: form.currency,
        level1: 'marketplace',
        category: form.placeType,
        lat: coords.lat,
        lng: coords.lng,
        details: {
          sqm: Number(form.sqm) || 0,
          rooms: Number(form.rooms) || 0,
          floor: Number(form.floor) || 0,
        },
      });
      const id = res.data._id;
      const fd = new FormData();
      photos.forEach((p) => fd.append('media', p.file));
      await uploadLocationMedia(id, fd, (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))));
      setDoneId(id);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || T('E’lonni joylab bo‘lmadi. Qayta urinib ko‘ring.') });
    } finally {
      setSaving(false);
    }
  };

  const showRooms = form.placeType === 'xonadon' || form.placeType === 'ofis';

  return (
    <form className="lf-page" onSubmit={submit} noValidate>
      <header className="lf-head">
        <button type="button" className="lf-back" onClick={() => safeGoBack(navigate)} aria-label={T('Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>{T('Joy e’loni')}</h1>
          <p>{T('Ijaraga berish yoki sotish')}</p>
        </div>
      </header>

      <FormSection>
        <Segmented
          ariaLabel={T('E’lon turi')}
          value={form.dealType}
          onChange={(v) => set('dealType', v)}
          options={[{ value: 'rent', label: T('Ijaraga beraman') }, { value: 'sale', label: T('Sotaman') }]}
        />
      </FormSection>

      <FormSection title={T('Rasmlar')}>
        <PhotoPicker photos={photos} setPhotos={(p) => { setPhotos(p); setErrors((e) => ({ ...e, photos: undefined })); }} error={errors.photos} />
      </FormSection>

      <FormSection title={T('Asosiy ma’lumot')}>
        <div className="lf-field">
          <span className="lf-field__label">{T('Joy turi')}</span>
          <div className="lf-cats">
            {PLACE_TYPES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`lf-cat ${form.placeType === c.id ? 'is-on' : ''}`}
                onClick={() => set('placeType', c.id)}
              >
                <span className="lf-cat__icon"><c.icon size={18} /></span>
                <span>{T(c.label)}</span>
              </button>
            ))}
          </div>
          {errors.placeType && <span className="lf-field__error">{errors.placeType}</span>}
        </div>

        <Field label={T('Sarlavha')} counter={`${form.title.length}/${TITLE_MAX}`} error={errors.title}>
          <input
            value={form.title}
            maxLength={TITLE_MAX}
            onChange={(e) => set('title', e.target.value)}
            placeholder={T('Masalan: Chilonzorda 40 m² do‘kon')}
          />
        </Field>

        <div className="lf-row">
          <Field label={T('Maydoni (m²)')}>
            <input type="number" inputMode="decimal" min="0" value={form.sqm} onChange={(e) => set('sqm', e.target.value)} placeholder="0" />
          </Field>
          {showRooms ? (
            <Field label={T('Xonalar soni')}>
              <input type="number" inputMode="numeric" min="0" value={form.rooms} onChange={(e) => set('rooms', e.target.value)} placeholder="0" />
            </Field>
          ) : (
            <Field label={T('Qavat')}>
              <input type="number" inputMode="numeric" value={form.floor} onChange={(e) => set('floor', e.target.value)} placeholder="1" />
            </Field>
          )}
        </div>
      </FormSection>

      <FormSection title={form.dealType === 'rent' ? T('Ijara narxi (oyiga)') : T('Narx')}>
        <div className="lf-row lf-row--price">
          <Field label={T('Narxi')} error={errors.price}>
            <input type="number" inputMode="numeric" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" />
          </Field>
          <Segmented
            ariaLabel={T('Valyuta')}
            value={form.currency}
            onChange={(v) => set('currency', v)}
            options={[{ value: 'UZS', label: T('so‘m') }, { value: 'USD', label: '$' }]}
          />
        </div>
      </FormSection>

      <FormSection title={T('Tavsif')}>
        <Field label={T('Joy haqida')} counter={`${form.description.length}/${DESC_MAX}`} hint={T('Holati, kommunal xizmatlar, kirish yo‘li, nimaga mos — mijoz nimani bilishi kerak bo‘lsa')}>
          <AITextEnhanceButton value={form.description} onChange={(text) => set('description', text.slice(0, DESC_MAX))} />
          <textarea
            rows={5}
            maxLength={DESC_MAX}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={T('Masalan: yangi ta’mirlangan, suv va gaz bor, avtobus bekatiga 2 daqiqa.')}
          />
        </Field>
      </FormSection>

      <FormSection title={T('Manzil')}>
        <Field label={T('Viloyat')} error={errors.region}>
          <select value={form.region} onChange={(e) => set('region', e.target.value)}>
            <option value="">{T('Viloyatni tanlang')}</option>
            {REGIONS.map((r) => <option key={r} value={r}>{T(r)}</option>)}
          </select>
        </Field>
        <div className={`lf-field ${errors.map ? 'has-error' : ''}`}>
          <span className="lf-field__label">{T('Xaritada belgilang')}</span>
          <LocationMapPicker lat={coords.lat} lng={coords.lng} onSelect={onMap} />
          {errors.map && <span className="lf-field__error">{errors.map}</span>}
        </div>
        <Field label={T('Manzil')} error={errors.address} hint={T('Xaritadan tanlasangiz avtomatik to‘ladi')}>
          <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder={T('Tuman, ko‘cha, uy raqami')} />
        </Field>
        <Field label={T('Telefon')} error={errors.phone}>
          <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+998 90 000 00 00" />
        </Field>
      </FormSection>

      {errors.submit && <p className="lf-field__error" role="alert" style={{ marginTop: 14 }}>{errors.submit}</p>}

      <div className="lf-submit">
        <button type="submit" disabled={saving}>
          {saving && <Loader2 size={18} className="lf-spin" />}
          {saving ? T('Joylanmoqda...') : T('E’lonni joylash')}
        </button>
        {saving && progress > 0 && <div className="lf-progress"><span style={{ width: `${progress}%` }} /></div>}
      </div>

      {doneId && (
        <SuccessModal message={T('E’loningiz joylandi!')} onDone={() => navigate(`/location/${doneId}`)} />
      )}
    </form>
  );
}
