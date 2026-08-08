import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { getOrderStatus } from '../services/orders';
import '../../styles/orderWaitingModal.css';

const WAITING_MESSAGES = [
  "Tovar mavjudligi tekshirilmoqda...",
  "Yetkazib beruvchiga xabar yuborildi...",
  "Tasdiqlash kutilmoqda...",
  "Deyarli tayyor...",
];

export default function OrderWaitingModal({ orderId, onClose }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('yangi');
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(async () => {
      try {
        const res = await getOrderStatus(orderId);
        if (res.data.status !== 'yangi') {
          setStatus(res.data.status);
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (status !== 'yangi') return;
    const textInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(textInterval);
  }, [status]);

  const isReady = status !== 'yangi';

  return (
    <div className="owm-fullscreen">
      {!isReady && (
        <button className="owm-close" onClick={onClose}><X size={22} /></button>
      )}

      <div className="owm-content">
        {!isReady ? (
          <>
            {/* ===== GLOWING ROTATING SPHERES (AI assistant style) ===== */}
            <div className="owm-sphere-container">
              <div className="owm-scale owm-scale-1">
                <div className="owm-circle owm-circle-1"></div>
                <div className="owm-circle owm-circle-2"></div>
                <div className="owm-circle owm-circle-3"></div>
              </div>
            
            </div>

            <h2 className="owm-title">Biroz kuting...</h2>
            <p key={msgIndex} className="owm-desc owm-desc-fade">
              {WAITING_MESSAGES[msgIndex]}
            </p>
          </>
        ) : (
          <>
            <div className="owm-success-wrap">
              <CheckCircle2 size={72} className="owm-success-icon" />
            </div>
            <h2 className="owm-title owm-title-success">Tayyor!</h2>
            <p className="owm-desc">Buyurtmangiz tasdiqlandi</p>
            <button className="owm-btn" onClick={() => navigate('/my-orders')}>
              Buyurtmalarimni ko'rish
            </button>
            <button className="owm-btn-ghost" onClick={onClose}>Yopish</button>
          </>
        )}
      </div>
    </div>
  );
}