// src/components/common/OrderWaitingModal.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import { getOrderStatus } from '../services/orders';
import '../../styles/orderWaitingModal.css';

import { T } from '../utils/T';
// Sotuvchi shu vaqt ichida javob bermasa, mijozni ushlab turmaymiz
const LONG_WAIT_MS = 2 * 60 * 1000;
const POLL_MS = 3000;

export default function OrderWaitingModal({ orderId, orderCount = 1, onClose }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('yangi');
  const [longWait, setLongWait] = useState(false);

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
    }, POLL_MS);
    const timer = setTimeout(() => setLongWait(true), LONG_WAIT_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [orderId]);

  const rejected = status === 'rad_etildi' || status === 'bekor_qilindi';
  const accepted = status !== 'yangi' && !rejected;
  const goToOrders = () => navigate('/my-orders');
  const extra = orderCount > 1 ? T(' Jami {{orderCount}} ta sotuvchiga buyurtma yuborildi.', { orderCount: orderCount }) : '';

  return (
    <div className="owm-fullscreen">
      <button className="owm-close" onClick={onClose} aria-label={T('Yopish')}><X size={22} /></button>

      <div className="owm-content">
        {status === 'yangi' && (
          <>
            <div className="owm-sphere-container">
              <div className="owm-scale owm-scale-1">
                <div className="owm-circle owm-circle-1"></div>
                <div className="owm-circle owm-circle-2"></div>
                <div className="owm-circle owm-circle-3"></div>
              </div>
            </div>
            {longWait ? (
              <>
                <h2 className="owm-title"><Clock size={20} /> {T('Sotuvchi hali javob bermadi')}</h2>
                <p className="owm-desc">
                  {T('Buyurtmangiz saqlandi. Sotuvchi qabul qilganda bildirishnoma keladi.')}{extra}
                </p>
                <button className="owm-btn" onClick={goToOrders}>{T('Buyurtmalarimda kuzatish')}</button>
              </>
            ) : (
              <>
                <h2 className="owm-title">{T('Buyurtma sotuvchiga yuborildi')}</h2>
                <p className="owm-desc">{T('Sotuvchi tasdiqlashini kutyapmiz.')}{extra}</p>
              </>
            )}
          </>
        )}

        {accepted && (
          <>
            <div className="owm-success-wrap">
              <CheckCircle2 size={72} className="owm-success-icon" />
            </div>
            <h2 className="owm-title owm-title-success">{T('Sotuvchi qabul qildi')}</h2>
            <p className="owm-desc">{T('Yetkazish muddati buyurtmalaringiz sahifasida ko‘rinadi.')}{extra}</p>
            <button className="owm-btn" onClick={goToOrders}>{T('Buyurtmalarimni ko‘rish')}</button>
            <button className="owm-btn-ghost" onClick={onClose}>{T('Yopish')}</button>
          </>
        )}

        {rejected && (
          <>
            <div className="owm-success-wrap">
              <XCircle size={72} className="owm-success-icon" />
            </div>
            <h2 className="owm-title">{T('Sotuvchi buyurtmani qabul qila olmadi')}</h2>
            <p className="owm-desc">{T('Sababini buyurtmalaringiz sahifasida ko‘rishingiz mumkin.')}</p>
            <button className="owm-btn" onClick={goToOrders}>{T('Buyurtmalarimni ko‘rish')}</button>
            <button className="owm-btn-ghost" onClick={onClose}>{T('Yopish')}</button>
          </>
        )}
      </div>
    </div>
  );
}
