// Mutaxassis/sotuvchiga: Xiaomi, Oppo, Vivo, Huawei ilovani qatordan surib yopsa buyurtma push'i kelmaydi.
// Faqat Android ilovada va batareya cheklovi yoqilgan bo'lsa ko'rinadi.
import { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { BellRing, X } from 'lucide-react';
import { T } from '../utils/T';
import '../../styles/orderAlertTip.css';

const Background = registerPlugin('Background');
const HIDE_KEY = 'zumo_order_tip_hidden';
const AUTOSTART_BRANDS = ['xiaomi', 'redmi', 'poco', 'oppo', 'realme', 'oneplus', 'vivo', 'iqoo', 'huawei', 'honor'];

export default function OrderAlertTip() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return undefined;
    try { if (localStorage.getItem(HIDE_KEY)) return undefined; } catch { /* ko'rsataveramiz */ }

    // Sozlamadan qaytganda qayta tekshiramiz — cheklov olingan bo'lsa yashirinadi
    const check = () => Background.status().then(setInfo).catch(() => {});
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, []);

  if (!info || info.batteryUnrestricted) return null;

  const hasAutostart = AUTOSTART_BRANDS.some((brand) => info.manufacturer.includes(brand));
  const hide = () => {
    try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* faqat shu safar */ }
    setInfo(null);
  };

  return (
    <div className="oat-card" role="note">
      <button type="button" className="oat-close" onClick={hide} aria-label={T('Yopish')}>
        <X size={16} />
      </button>
      <div className="oat-head">
        <BellRing size={20} />
        <strong>{T('Buyurtmalarni o‘tkazib yubormang')}</strong>
      </div>
      <p>{T('Telefoningiz ilovani yopib qo‘yganda yangi buyurtma xabari kelmasligi mumkin. Bir marta sozlab qo‘ying:')}</p>
      <ol>
        {hasAutostart && <li>{T('«Avtozapusk» ro‘yxatida ZUMO’ni yoqing')}</li>}
        <li>{T('«Batareya» bo‘limida «Cheklovsiz» ni tanlang')}</li>
      </ol>
      <div className="oat-actions">
        {hasAutostart && (
          <button type="button" className="oat-btn oat-btn--main" onClick={() => Background.openAutostart().catch(() => {})}>
            {T('Avtozapusk')}
          </button>
        )}
        <button
          type="button"
          className={`oat-btn ${hasAutostart ? '' : 'oat-btn--main'}`}
          onClick={() => Background.openAppDetails().catch(() => {})}
        >
          {T('Batareya sozlamasi')}
        </button>
      </div>
    </div>
  );
}
