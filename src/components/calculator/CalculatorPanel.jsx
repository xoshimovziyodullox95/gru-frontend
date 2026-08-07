import { DollarSign, Plus, Minus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './CalculatorPanel.css';

/**
 * CalculatorPanel — endi HAR BIR mahsulotning miqdorini (quantity)
 * kuzatadi. "+" bosilganda bir xil mahsulot ikkinchi marta bosilsa
 * hech narsa bo'lmasdi — endi miqdor oshadi va jami summa
 * (narx * miqdor) avtomatik qayta hisoblanadi.
 *
 * selectedItems formati endi: { id, title, price, quantity }
 */
export default function CalculatorPanel({ equipment, selectedItems, onIncrement, onDecrement, onRemoveItem, onAddAll }) {
  const { t } = useTranslation();
  const totalSum = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleOrder = () => {
    alert(t('calculator.orderPlaced'));
  };

  return (
    <div className="CalculatorCard">
      <h3 className="CardSmallTitle"><DollarSign size={16} /> {t('calculator.title')}</h3>
      <div className="selected-items-list">
        {selectedItems.length === 0 && <p className="text-gray-400 text-sm">{t('calculator.empty')}</p>}
        {selectedItems.map(item => (
          <div key={item.id} className="selected-item">
            <span className="selected-item-title">{item.title}</span>
            <div className="selected-item-controls">
              <button onClick={() => onDecrement(item.id)} className="qty-btn"><Minus size={12} /></button>
              <span className="qty-value">{item.quantity}</span>
              <button onClick={() => onIncrement(item.id)} className="qty-btn"><Plus size={12} /></button>
            </div>
            <span className="selected-price">${(item.price * item.quantity).toLocaleString()}</span>
            <button onClick={() => onRemoveItem(item.id)} className="remove-item-btn">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="total-sum">
        <span>{t('calculator.total')}</span>
        <span className="total-price">${totalSum.toLocaleString()}</span>
      </div>
      <button className="buy-all-btn" onClick={handleOrder}>{t('calculator.order')}</button>
      <button className="add-all-btn" onClick={onAddAll}>{t('calculator.addAll')}</button>
    </div>
  );
}