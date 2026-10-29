// Uzun tavsifni 5 qatorda qisqartiradi, "Batafsil" bosilsa to'liq ochiladi
import { useState } from 'react';
import { T } from '../utils/T';

export default function ClampText({ text, limit = 260 }) {
  const [open, setOpen] = useState(false);
  const long = (text || '').length > limit;
  return (
    <div className="dp-clamp">
      <p className={long && !open ? 'is-clamped' : ''}>{text}</p>
      {long && (
        <button type="button" className="dp-more" onClick={() => setOpen((v) => !v)}>
          {open ? T('Yig‘ish') : T('Batafsil')}
        </button>
      )}
    </div>
  );
}
