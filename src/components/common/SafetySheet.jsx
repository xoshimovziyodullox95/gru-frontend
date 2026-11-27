// Shikoyat qilish / bloklash — pastdan chiqadigan oyna. openSafety({...}) bilan istalgan joydan ochiladi.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flag, Ban, X, Check, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { openSafety, sendReport, blockUser, fetchBlocks } from '../services/moderation';
import { T } from '../utils/T';
import '../../styles/safety.css';

const REASONS = [
  ['spam', () => T('Spam yoki reklama')],
  ['fraud', () => T('Firibgarlik yoki aldov')],
  ['abuse', () => T('Haqorat yoki tahdid')],
  ['adult', () => T('Odobsiz kontent')],
  ['violence', () => T('Zo‘ravonlik yoki taqiqlangan narsa')],
  ['other', () => T('Boshqa sabab')],
];

// E'lon sahifalaridagi sokin havola
export function ReportLink(props) {
  return (
    <button type="button" className="sf-link" onClick={() => openSafety(props)}>
      <Flag size={15} /> {T('Shikoyat qilish')}
    </button>
  );
}

export default function SafetySheet() {
  const { user } = useAuth();
  const [target, setTarget] = useState(null);
  const [step, setStep] = useState('menu'); // menu | report | block | done
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const open = (e) => { setTarget(e.detail); setStep('menu'); setReason(''); setComment(''); };
    window.addEventListener('zumo:safety', open);
    return () => window.removeEventListener('zumo:safety', open);
  }, []);

  useEffect(() => { if (user) fetchBlocks(api).catch(() => {}); }, [user]);

  if (!target) return null;
  const ownerId = String(target.ownerId || '');
  const canBlock = /^[a-f\d]{24}$/i.test(ownerId);
  const close = () => { if (!busy) setTarget(null); };

  const run = async (fn) => {
    if (!user) { toast.error(T('Davom etish uchun tizimga kiring')); return; }
    setBusy(true);
    try { await fn(); } catch (e) { toast.error(e?.response?.data?.error || T('Nomaʼlum xatolik yuz berdi')); } finally { setBusy(false); }
  };
  const submit = () => run(async () => {
    await sendReport(api, { targetType: target.type, targetId: String(target.id), ownerId, reason, comment });
    setStep('done');
  });
  const block = () => run(async () => {
    await blockUser(api, ownerId);
    toast.success(T('Foydalanuvchi bloklandi'));
    setTarget(null);
    window.location.assign('/marketplace');
  });

  const title = step === 'report' ? T('Shikoyat sababi') : step === 'block' ? T('Bloklaysizmi?') : T('Xavfsizlik');

  return createPortal(
    <div className="sf-overlay" onClick={(e) => { e.stopPropagation(); close(); }}>
      <div className="sf-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <span className="sf-grip" aria-hidden="true" />
        <header className="sf-head">
          <h3>{title}</h3>
          <button type="button" className="sf-x" onClick={close} aria-label={T('Yopish')}><X size={18} /></button>
        </header>

        {step === 'menu' && (
          <div className="sf-list">
            <button type="button" className="sf-item" onClick={() => setStep('report')}>
              <span className="sf-item__icon sf-item__icon--warn"><Flag size={19} /></span>
              <span className="sf-item__text"><strong>{T('Shikoyat qilish')}</strong><small>{T('Moderatorlar 24 soat ichida ko‘rib chiqadi')}</small></span>
              <ChevronRight size={18} />
            </button>
            {canBlock && (
              <button type="button" className="sf-item" onClick={() => setStep('block')}>
                <span className="sf-item__icon sf-item__icon--danger"><Ban size={19} /></span>
                <span className="sf-item__text"><strong>{T('Foydalanuvchini bloklash')}</strong><small>{target.ownerName || T('E’lonlari va xabarlari ko‘rinmaydi')}</small></span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}

        {step === 'report' && (
          <>
            <div className="sf-reasons" role="radiogroup">
              {REASONS.map(([id, label]) => (
                <button key={id} type="button" role="radio" aria-checked={reason === id}
                  className={`sf-reason ${reason === id ? 'is-on' : ''}`} onClick={() => setReason(id)}>
                  <span>{label()}</span><i>{reason === id && <Check size={13} strokeWidth={3} />}</i>
                </button>
              ))}
            </div>
            <textarea className="sf-note" rows={3} maxLength={500} value={comment}
              onChange={(e) => setComment(e.target.value)} placeholder={T('Izoh (ixtiyoriy)')} />
            <button type="button" className="sf-btn" disabled={!reason || busy} onClick={submit}>
              {busy ? <Loader2 size={18} className="sf-spin" /> : T('Yuborish')}
            </button>
          </>
        )}

        {step === 'block' && (
          <>
            <p className="sf-lead">{T('Uning e’lonlari va videolari sizga ko‘rinmaydi, bir-biringizga xabar yubora olmaysiz. Sozlamalardan istalgan vaqtda blokdan chiqarasiz.')}</p>
            <button type="button" className="sf-btn sf-btn--danger" disabled={busy} onClick={block}>
              {busy ? <Loader2 size={18} className="sf-spin" /> : T('Bloklash')}
            </button>
            <button type="button" className="sf-btn sf-btn--ghost" onClick={() => setStep('menu')}>{T('Bekor qilish')}</button>
          </>
        )}

        {step === 'done' && (
          <div className="sf-done">
            <span><ShieldCheck size={34} /></span>
            <strong>{T('Shikoyatingiz qabul qilindi')}</strong>
            <p>{T('Rahmat! Moderatorlar 24 soat ichida ko‘rib chiqadi.')}</p>
            {canBlock && <button type="button" className="sf-btn sf-btn--ghost" onClick={() => setStep('block')}>{T('Foydalanuvchini bloklash')}</button>}
            <button type="button" className="sf-btn" onClick={close}>{T('Tayyor')}</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
