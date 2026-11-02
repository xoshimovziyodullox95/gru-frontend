// Bo'sh holat: ikonka, sarlavha, qisqa izoh va keyingi qadam tugmasi (bir xil ko'rinish hamma joyda)
import '../../styles/emptyState.css';

export default function EmptyState({ icon: Icon, title, text, actionLabel, onAction }) {
  return (
    <div className="es-box">
      {Icon && <span className="es-icon"><Icon size={28} /></span>}
      <strong className="es-title">{title}</strong>
      {text && <p className="es-text">{text}</p>}
      {actionLabel && onAction && (
        <button type="button" className="es-btn" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
