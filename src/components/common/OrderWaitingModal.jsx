// src/components/common/OrderWaitingModal.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { getOrderStatus } from '../services/orders';
import '../../styles/orderWaitingModal.css';

// ===== MATNLAR =====
const MESSAGES = {
  equipment: {
    waiting: [
      "Tovar mavjudligi tekshirilmoqda...",
      "Yetkazib beruvchiga xabar yuborildi...",
      "Tasdiqlash kutilmoqda...",
      "Deyarli tayyor...",
    ],
    waitingTitle: "Biroz kuting...",
    successTitle: "Tayyor!",
    successDesc: "Buyurtmangiz tasdiqlandi",
    buttonText: "Buyurtmalarimni ko'rish",
  },
  bank: {
    waiting: [
      "Ariza ko‘rib chiqilmoqda...",
      "Bank xodimi tomonidan tekshirilmoqda...",
      "Tasdiqlash kutilmoqda...",
      "Deyarli tayyor...",
    ],
    waitingTitle: "Ariza ko‘rib chiqilmoqda...",
    successTitle: "Tasdiqlandi!",
    successDesc: "Arizangiz bank xodimi tomonidan tasdiqlandi",
    buttonText: "Arizalarimni ko'rish",
  },
};

export default function OrderWaitingModal({ orderId, onClose, orderType = 'equipment' }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('yangi');
  const [msgIndex, setMsgIndex] = useState(0);

  const config = MESSAGES[orderType] || MESSAGES.equipment;
  const waitingMessages = config.waiting;

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
      setMsgIndex((prev) => (prev + 1) % waitingMessages.length);
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
            <div className="owm-sphere-container">
              <div className="owm-scale owm-scale-1">
                <div className="owm-circle owm-circle-1"></div>
                <div className="owm-circle owm-circle-2"></div>
                <div className="owm-circle owm-circle-3"></div>
              </div>
            </div>

            <h2 className="owm-title">{config.waitingTitle}</h2>
            <p key={msgIndex} className="owm-desc owm-desc-fade">
              {waitingMessages[msgIndex]}
            </p>
          </>
        ) : (
          <>
            <div className="owm-success-wrap">
              <CheckCircle2 size={72} className="owm-success-icon" />
            </div>
            <h2 className="owm-title owm-title-success">{config.successTitle}</h2>
            <p className="owm-desc">{config.successDesc}</p>
            <button className="owm-btn" onClick={() => navigate('/my-orders')}>
              {config.buttonText}
            </button>
            <button className="owm-btn-ghost" onClick={onClose}>Yopish</button>
          </>
        )}
      </div>
    </div>
  );
}