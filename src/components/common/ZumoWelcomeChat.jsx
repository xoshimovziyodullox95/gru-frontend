// Tanishuv boshidagi suhbat: Zumik salomlashadi, "ZUMO'dan nima uchun foydalanasiz?" deb so'raydi,
// javobga qarab shu odamga mos tanishtiruvni boshlaydi (onChoose(role)).
import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import ZumoBot from './ZumoBot.jsx';
import useTypewriter from '../hooks/useTypewriter';
import { T } from '../utils/T';

const ROLES = [
  { id: 'client', emoji: '🛒', label: () => T('Xarid qilish yoki usta chaqirish') },
  { id: 'provider', emoji: '🔧', label: () => T('Men ustaman — buyurtma olmoqchiman') },
  { id: 'seller', emoji: '🏪', label: () => T('Men sotuvchiman — tovar sotmoqchiman') },
];

const REPLIES = {
  client: () => T('Zo‘r! Usta chaqirish, tovar topish va sotuvchi bilan yozishishni ko‘rsataman.'),
  provider: () => T('Ajoyib! Xizmatingizni qanday joylash va buyurtmalarni qayerdan olishni ko‘rsataman.'),
  seller: () => T('Ajoyib! Tovar joylash va kelgan buyurtmalarni qayerda ko‘rishni ko‘rsataman.'),
};

function BotBubble({ text, onDone, onTalk }) {
  const typed = useTypewriter(text);
  useEffect(() => { onTalk?.(typed.typing && !typed.thinking); }, [typed.typing, typed.thinking, onTalk]);
  useEffect(() => { if (typed.done) onDone?.(); }, [typed.done, onDone]);
  return (
    <div className="zwc-msg zwc-msg--bot" onClick={typed.typing ? typed.skip : undefined}>
      {typed.thinking
        ? <span className="zumo-typing-dots" aria-label={T('Yozmoqda...')}><i /><i /><i /></span>
        : <span className={typed.typing ? 'zumo-caret' : ''}>{typed.shown}</span>}
    </div>
  );
}

export default function ZumoWelcomeChat({ name, onChoose, onLater }) {
  // greet → ask → choose → reply
  const [phase, setPhase] = useState('greet');
  const [role, setRole] = useState(null);
  const [talking, setTalking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [phase, role]);

  const choose = (id) => {
    setRole(id);
    setPhase('reply');
  };

  return (
    <div className="zwc">
      <div className="zwc-head">
        <span className="zwc-head__bot"><ZumoBot size={64} talking={talking} /></span>
        <div>
          <strong id="zumo-tour-welcome-title">Zumik</strong>
          <span>{talking ? T('yozmoqda…') : T('ZUMO yordamchi · onlayn')}</span>
        </div>
      </div>

      <div className="zwc-thread" aria-live="polite">
        <BotBubble
          text={T('Salom, {{name}}! 👋 Men Zumik — ZUMO yordamchisiman. Ilovani 1 daqiqada ko‘rsatib beraman.', { name })}
          onTalk={phase === 'greet' ? setTalking : undefined}
          onDone={() => setPhase((p) => (p === 'greet' ? 'ask' : p))}
        />

        {phase !== 'greet' && (
          <BotBubble
            text={T('Avval ayting-chi, ZUMO’dan nima uchun foydalanmoqchisiz?')}
            onTalk={phase === 'ask' ? setTalking : undefined}
            onDone={() => setPhase((p) => (p === 'ask' ? 'choose' : p))}
          />
        )}

        {phase === 'choose' && (
          <div className="zwc-choices">
            {ROLES.map((r) => (
              <button key={r.id} type="button" className="zwc-choice" onClick={() => choose(r.id)}>
                <span aria-hidden="true">{r.emoji}</span> {r.label()}
              </button>
            ))}
          </div>
        )}

        {role && (
          <>
            <div className="zwc-msg zwc-msg--me">
              {ROLES.find((r) => r.id === role).emoji} {ROLES.find((r) => r.id === role).label()}
            </div>
            <BotBubble
              text={REPLIES[role]()}
              onTalk={setTalking}
              onDone={() => setPhase('ready')}
            />
          </>
        )}
        <div ref={endRef} />
      </div>

      <div className="zwc-actions">
        <button type="button" className="zumo-tour-welcome__skip" onClick={onLater}>{T('Keyinroq')}</button>
        {phase === 'ready' && (
          <button type="button" className="zumo-tour-welcome__start" onClick={() => onChoose(role)}>
            {T('Ko‘rsatishni boshlash')} <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
