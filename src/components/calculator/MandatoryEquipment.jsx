import { Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

export default function MandatoryEquipment({ items, onAddToCalculator, onRemoveFromCalculator, selectedIds }) {
  if (!items.length) return null;

  return (
    <div className="required-equipment-card">
      <h4 className="required-title">🏗️ Ushbu joy uchun zarur texnikalar</h4>
      <div className="required-equipment-list">
        {items.map(item => {
          const isSelected = selectedIds.includes(item._id);
          return (
            <div key={item._id} className="required-equipment-item">
              <div className="req-info">
                <span className="req-title">{item.title}</span>
                <span className="req-price">{formatPrice(item.price, item.currency)}</span>
              </div>
              {!isSelected ? (
                <button onClick={() => onAddToCalculator({ id: item._id, title: item.title, price: item.price })} className="add-req-btn">
                  <Plus size={14} /> Qo‘shish
                </button>
              ) : (
                <button onClick={() => onRemoveFromCalculator(item._id)} className="remove-req-btn">
                  <Trash2 size={14} /> O‘chirish
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}