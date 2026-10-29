// src/components/forms/AddEquipmentForm.jsx
// "Narsa sotaman" — OLX uslubidagi qisqa forma: rasm, sarlavha, kategoriya, holat, narx, tavsif, joy, telefon.
// Kategoriya = marketplace tovar kategoriyasi (level1) + ichki bo'lim (category), ro'yxat backend'dan.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createEquipment, uploadEquipmentMedia } from '../services/equipment';
import { getUserProfile } from '../services/user';
import SuccessModal from '../common/SuccessModal';
import AITextEnhanceButton from '../common/AITextEnhanceButton';
import { safeGoBack } from '../utils/navigation.js';
import { T } from '../utils/T';
import { Field, FormSection, PhotoPicker, Segmented } from './listingKit';
import { REGIONS } from './listingConstants';
import { useProductCategories } from '../utils/productCategories';
import '../../styles/aienhance.css';

const TITLE_MAX = 70;
const DESC_MAX = 3000;

export default function AddEquipmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useProductCategories();

  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    title: '',
    level1: '',
    sub: '',
    condition: 'used',
    saleMode: 'classified',
    price: '',
    currency: 'UZS',
    negotiable: false,
    description: '',
    stockQuantity: '1',
    region: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doneId, setDoneId] = useState(null);

  // Telefonni profildan oldindan to'ldiramiz
  useEffect(() => {
    getUserProfile()
      .then((res) => setForm((f) => (f.phone ? f : { ...f, phone: res.data?.phone || '' })))
      .catch(() => {});
  }, []);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!photos.length) e.photos = T('Kamida bitta rasm qo‘shing');
    if (form.title.trim().length < 3) e.title = T('Sarlavhani yozing (kamida 3 ta belgi)');
    if (!form.level1) e.level1 = T('Kategoriyani tanlang');
    else if (!form.sub) e.level1 = T('Ichki bo‘limni tanlang');
    if (!(Number(form.price) > 0)) e.price = T('Narxni kiriting');
    if (!form.region) e.region = T('Viloyatni tanlang');
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = T('Telefon raqamini kiriting');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const activeCategory = categories.find((c) => c.id === form.level1) || null;
  const isFood = form.level1 === 'oziqovqat';

  const chooseCategory = (id) => {
    setForm((f) => ({ ...f, level1: id, sub: f.level1 === id ? f.sub : '' }));
    setErrors((e) => ({ ...e, level1: undefined }));
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
      const res = await createEquipment({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        currency: form.currency,
        condition: isFood ? 'new' : form.condition,
        saleMode: form.saleMode,
        phone: form.phone.trim(),
        stockQuantity: form.saleMode === 'store' ? Math.max(1, parseInt(form.stockQuantity, 10) || 1) : 1,
        level1: form.level1,
        category: form.sub,
        attributes: { region: form.region, negotiable: form.negotiable },
      });
      const id = res.data._id;
      const fd = new FormData();
      photos.forEach((p) => fd.append('media', p.file));
      await uploadEquipmentMedia(id, fd, (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))));
      setDoneId(id);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || T('E’lonni joylab bo‘lmadi. Qayta urinib ko‘ring.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="lf-page" onSubmit={submit} noValidate>
      <header className="lf-head">
        <button type="button" className="lf-back" onClick={() => safeGoBack(navigate)} aria-label={T('Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>{T('Narsa sotish')}</h1>
          <p>{T('Yangi yoki ishlatilgan tovar e’loni')}</p>
        </div>
      </header>

      <FormSection title={T('Rasmlar')}>
        <PhotoPicker photos={photos} setPhotos={(p) => { setPhotos(p); setErrors((e) => ({ ...e, photos: undefined })); }} error={errors.photos} />
      </FormSection>

      <FormSection title={T('Asosiy ma’lumot')}>
        <div className="lf-field">
          <span className="lf-field__label">{T('Sotuv turi')}</span>
          <Segmented
            ariaLabel={T('Sotuv turi')}
            value={form.saleMode}
            onChange={(value) => set('saleMode', value)}
            options={[
              { value: 'classified', label: T('Oddiy e’lon') },
              { value: 'store', label: T('Do‘kon mahsuloti') },
            ]}
          />
          <span className="lf-field__hint">{form.saleMode === 'store'
            ? T('Xaridor savatga qo‘shib buyurtma beradi; narx va qoldiq ko‘rinadi.')
            : T('Narx e’londa ko‘rinadi. Xaridor sotuvchi bilan chat yoki telefon orqali kelishadi.')}</span>
        </div>
        <Field label={T('Sarlavha')} counter={`${form.title.length}/${TITLE_MAX}`} error={errors.title}>
          <input
            value={form.title}
            maxLength={TITLE_MAX}
            onChange={(e) => set('title', e.target.value)}
            placeholder={T('Masalan: Samsung muzlatgich, 2 kamerali')}
          />
        </Field>

        <div className="lf-field">
          <span className="lf-field__label">{T('Kategoriya')}</span>
          <div className="lf-cats lf-cats--grid">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`lf-cat ${form.level1 === c.id ? 'is-on' : ''}`}
                onClick={() => chooseCategory(c.id)}
              >
                <span className="lf-cat__icon"><c.icon size={18} /></span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
          {!activeCategory && errors.level1 && <span className="lf-field__error">{errors.level1}</span>}
        </div>

        {activeCategory && (
          <div className="lf-field">
            <span className="lf-field__label">{T('Ichki bo‘lim')}</span>
            <div className="lf-subs" role="radiogroup" aria-label={T('Ichki bo‘lim')}>
              {activeCategory.subs.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  role="radio"
                  aria-checked={form.sub === sub.id}
                  className={`lf-sub ${form.sub === sub.id ? 'is-on' : ''}`}
                  onClick={() => set('sub', sub.id)}
                >
                  {sub.name}
                </button>
              ))}
            </div>
            {errors.level1 && <span className="lf-field__error">{errors.level1}</span>}
          </div>
        )}

        {form.level1 && !isFood && (
          <div className="lf-field">
            <span className="lf-field__label">{T('Holati')}</span>
            <Segmented
              ariaLabel={T('Holati')}
              value={form.condition}
              onChange={(v) => set('condition', v)}
              options={[{ value: 'new', label: T('Yangi') }, { value: 'used', label: T('Ishlatilgan') }]}
            />
          </div>
        )}
      </FormSection>

      <FormSection title={T('Narx')}>
        <div className="lf-row lf-row--price">
          <Field label={T('Narxi')} error={errors.price}>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0"
            />
          </Field>
          <Segmented
            ariaLabel={T('Valyuta')}
            value={form.currency}
            onChange={(v) => set('currency', v)}
            options={[{ value: 'UZS', label: T('so‘m') }, { value: 'USD', label: '$' }]}
          />
        </div>
        <label className="lf-check">
          <input type="checkbox" checked={form.negotiable} onChange={(e) => set('negotiable', e.target.checked)} />
          {T('Kelishiladi')}
        </label>
      </FormSection>

      <FormSection title={T('Tavsif')}>
        <Field label={T('Tovar haqida')} counter={`${form.description.length}/${DESC_MAX}`} hint={T('Holati, o‘lchami, rangi, nima uchun sotilayotgani — xaridor nimani bilishi kerak bo‘lsa')}>
          <AITextEnhanceButton value={form.description} onChange={(text) => set('description', text.slice(0, DESC_MAX))} />
          <textarea
            rows={5}
            maxLength={DESC_MAX}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={T('Masalan: 2 yil ishlatilgan, hech qanday nuqsoni yo‘q, hujjatlari bor.')}
          />
        </Field>
        {form.saleMode === 'store' && (
          <Field label={T('Soni (dona)')} hint={T('Savatga nechta qo‘shish mumkinligi')}>
            <input type="number" inputMode="numeric" min="1" value={form.stockQuantity} onChange={(e) => set('stockQuantity', e.target.value)} />
          </Field>
        )}
      </FormSection>

      <FormSection title={T('Joylashuv va aloqa')}>
        <Field label={T('Viloyat')} error={errors.region}>
          <select value={form.region} onChange={(e) => set('region', e.target.value)}>
            <option value="">{T('Viloyatni tanlang')}</option>
            {REGIONS.map((r) => <option key={r} value={r}>{T(r)}</option>)}
          </select>
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
        <SuccessModal message={T('E’loningiz joylandi!')} onDone={() => navigate(`/equipment/${doneId}`)} />
      )}
    </form>
  );
}
