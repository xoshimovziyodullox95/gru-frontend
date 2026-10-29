// src/components/pages/AddListingChoice.jsx
// "Nima joylaysiz?" — OLX uslubida avval e'lon turi, keyin qisqa forma.
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Wrench, Home, ChevronRight, Lightbulb } from 'lucide-react';
import { safeGoBack } from '../utils/navigation.js';
import { T } from '../utils/T';
import '../../styles/listingForm.css';

const TYPES = [
  {
    to: '/add-equipment',
    icon: Package,
    title: 'Narsa sotaman',
    desc: 'Texnika, mebel, oziq-ovqat va boshqa tovarlar — yangi yoki ishlatilgan',
  },
  {
    to: '/add-service',
    icon: Wrench,
    title: 'Xizmat ko‘rsataman',
    desc: 'Usta, tozalash, ta’mirlash, repetitor va boshqa xizmatlar — mijozlar so‘rov yuboradi',
  },
  {
    to: '/add-location',
    icon: Home,
    title: 'Joy: ijara yoki sotuv',
    desc: 'Do‘kon, ofis, xona, ombor yoki boshqa joyni ijaraga berish yoki sotish',
  },
];

export default function AddListingChoice() {
  const navigate = useNavigate();

  return (
    <div className="lf-page">
      <header className="lf-head">
        <button type="button" className="lf-back" onClick={() => safeGoBack(navigate)} aria-label={T('Orqaga')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>{T('Nima joylaysiz?')}</h1>
          <p>{T('E’lon turini tanlang — 1–2 daqiqada joylanadi')}</p>
        </div>
      </header>

      <div className="lf-types">
        {TYPES.map((type) => (
          <button key={type.to} type="button" className="lf-type" onClick={() => navigate(type.to)}>
            <span className="lf-type__icon"><type.icon size={24} /></span>
            <span className="lf-type__text">
              <strong>{T(type.title)}</strong>
              <span>{T(type.desc)}</span>
            </span>
            <ChevronRight size={20} className="lf-type__chev" />
          </button>
        ))}
      </div>

      <p className="lf-tip">
        <Lightbulb size={18} />
        <span>{T('Aniq sarlavha, haqiqiy rasm va to‘g‘ri narx — e’loningiz tezroq sotiladi.')}</span>
      </p>
    </div>
  );
}
