import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import '../../styles/successModal.css';

/**
 * SuccessModal — muvaffaqiyat animatsiyasi: avval dumaloq spinner
 * aylanadi, so'ng silliq o'tish bilan yashil ptichka (✓) belgisiga
 * aylanadi, tagida xabar matni chiqadi. Belgilangan vaqtdan keyin
 * avtomatik `onDone` chaqiriladi (odatda shu yerda navigate qilinadi).
 *
 * Ishlatilishi:
 *   {showSuccess && (
 *     <SuccessModal message="Joy muvaffaqiyatli qo'shildi!" onDone={() => navigate('/somewhere')} />
 *   )}
 */
export default function SuccessModal({ message = 'Muvaffaqiyatli bajarildi!', onDone, spinDuration = 700, holdDuration = 1100 }) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCheck(true), spinDuration);
    const t2 = setTimeout(() => onDone && onDone(), spinDuration + holdDuration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="success-modal-overlay">
      <div className="success-modal-box">
        <div className={`success-circle ${showCheck ? 'done' : ''}`}>
          {showCheck ? (
            <Check size={34} strokeWidth={3} className="success-check-icon" />
          ) : (
            <span className="success-spinner" />
          )}
        </div>
        <p className="success-message">{message}</p>
      </div>
    </div>
  );
}