// src/components/CartStepper.jsx
import { Plus, Minus, Check } from 'lucide-react';
import '../styles/CartStepper.css';

/**
 * Savat steppери.
 *
 * maxQuantity — shu mahsulotdan sotuvda necha dona borligi
 * (AddEquipmentForm'dagi oziq-ovqat turi uchun: unit === 'dona' bo'lsa,
 * amount shu ma'noni bildiradi).
 *
 * - maxQuantity === 1  -> stepper (-/+) umuman chiqmaydi, faqat bitta
 *   "Qo'shish / Qo'shildi" tugma chiqadi (chunki 1 tadan ortiq tanlab
 *   bo'lmaydi, sonini ko'rsatishning hojati yo'q).
 * - maxQuantity > 1 (yoki noma'lum, ya'ni cheklov qo'yilmagan) -> to'liq
 *   "- son +" stepper. "+" tugmasi maxQuantity'ga yetganda o'chiriladi.
 */
export default function CartStepper({ quantity = 0, onIncrement, onDecrement, maxQuantity, size = 'md' }) {
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const singleUnitOnly = maxQuantity === 1;

  if (singleUnitOnly) {
    const added = quantity > 0;
    return (
      <button
        type="button"
        className={`cart-toggle-btn cart-stepper--${size} ${added ? 'is-added' : ''}`}
        onClick={(e) => { stop(e); added ? onDecrement() : onIncrement(); }}
        aria-label={added ? 'Savatdan olib tashlash' : "Savatga qo'shish"}
      >
        {added ? <><Check size={14} /> Qo'shildi</> : <><Plus size={14} /> Qo'shish</>}
      </button>
    );
  }

  if (!quantity || quantity <= 0) {
    return (
      <button
        type="button"
        className={`cart-stepper-add cart-stepper--${size}`}
        onClick={(e) => { stop(e); onIncrement(); }}
        aria-label="Savatga qo'shish"
      >
        <Plus size={16} />
      </button>
    );
  }

  const reachedMax = typeof maxQuantity === 'number' && quantity >= maxQuantity;

  return (
    <div className={`cart-stepper cart-stepper--${size}`} onClick={stop}>
      <button
        type="button"
        className="cart-stepper-btn"
        onClick={(e) => { stop(e); onDecrement(); }}
        aria-label="Kamaytirish"
      >
        <Minus size={14} />
      </button>
      <span className="cart-stepper-value">{quantity}</span>
      <button
        type="button"
        className="cart-stepper-btn"
        disabled={reachedMax}
        onClick={(e) => { stop(e); if (!reachedMax) onIncrement(); }}
        aria-label="Ko'paytirish"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}