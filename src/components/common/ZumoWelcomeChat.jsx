// Tanishuv boshidagi suhbat: Zumik avval tilni so'raydi, keyin salomlashadi, "ZUMO'dan nima uchun foydalanasiz?" deb so'raydi,
// javobga qarab shu odamga mos tanishtiruvni boshlaydi (onChoose(role)).
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Send } from 'lucide-react';
import ZumoBot from './ZumoBot.jsx';
import useTypewriter from '../hooks/useTypewriter';
import { T } from '../utils/T';
import i18n from '../utils/i18n';

// Til tanlanmaguncha qaysi tilda yozishni bilmaymiz — savol uch tilda birdan
const LANGS = [
  { code: 'uz', flag: '🇺🇿', label: 'O‘zbekcha' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];
const LANG_QUESTION = 'Tilni tanlang · Выберите язык · Choose a language';
// Til almashganda ilova sahifani qayta yuklaydi (i18n.js) — tanishuv shu belgi bilan davom etadi
export const TOUR_RESUME_KEY = 'zumo_tour_resume_lang';

const ROLES = [
  { id: 'client', emoji: '🛒', label: () => T('Xarid qilish yoki usta chaqirish') },
  { id: 'provider', emoji: '🔧', label: () => T('Men ustaman — buyurtma olmoqchiman') },
  { id: 'seller', emoji: '🏪', label: () => T('Men sotuvchiman — tovar sotmoqchiman') },
];

// "Boshqa" — odam o'zi yozadi; matndan mos tanishuvni taxmin qilamiz (uz/ru/en kalit so'zlar)
const guessRole = (text) => {
  const t = text.toLowerCase();
  if (/usta|ishla|ish qidir|ishchi|xizmat|buyurtma ol|elektrik|santexnik|ta.?mir|quruvchi|haydovchi|repetitor|enaga|мастер|работ|услуг|plumber|electrician|\bpro\b|work/.test(t)) return 'provider';
  if (/sot|do[‘'`]?kon|магазин|прода|sell|shop|store/.test(t)) return 'seller';
  return 'client';
};

const REPLIES = {
  client: () => T('Zo‘r! Usta chaqirish, tovar topish va sotuvchi bilan yozishishni ko‘rsataman.'),
  provider: () => T('Ajoyib! Xizmatingizni qanday joylash va buyurtmalarni qayerdan olishni ko‘rsataman.'),
  seller: () => T('Ajoyib! Tovar joylash va kelgan buyurtmalarni qayerda ko‘rishni ko‘rsataman.'),
};

function BotBubble({ text, onDone, onTalk, instant = false }) {
  const typed = useTypewriter(text, { enabled: !instant });
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

export default function ZumoWelcomeChat({ name, onChoose, onLater, initialLang = null }) {
  // lang → pickLang → greet → ask → choose → reply → ready
  const [phase, setPhase] = useState(initialLang ? 'greet' : 'lang');
  const [langCode, setLangCode] = useState(initialLang);
  const [role, setRole] = useState(null);
  const [talking, setTalking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [phase, role]);

  const pickLanguage = (code) => {
    const current = (i18n.resolvedLanguage || i18n.language || 'uz').split('-')[0];
    if (code !== current) {
      try { sessionStorage.setItem(TOUR_RESUME_KEY, code); } catch { /* qayta yuklangach tanishuv boshidan */ }
      i18n.changeLanguage(code); // sahifa qayta yuklanadi
      return;
    }
    setLangCode(code);
    setPhase('greet');
  };

  const [customText, setCustomText] = useState('');
  const [draft, setDraft] = useState('');

  const choose = (id) => {
    if (id === 'other') {
      setPhase('typing');
      return;
    }
    setRole(id);
    setPhase('reply');
  };

  const submitCustom = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setCustomText(text.slice(0, 200));
    setRole(guessRole(text));
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
          text={LANG_QUESTION}
          instant={Boolean(initialLang)}
          onTalk={phase === 'lang' ? setTalking : undefined}
          onDone={() => setPhase((p) => (p === 'lang' ? 'pickLang' : p))}
        />

        {phase === 'pickLang' && (
          <div className="zwc-choices zwc-choices--row">
            {LANGS.map((l) => (
              <button key={l.code} type="button" className="zwc-choice" onClick={() => pickLanguage(l.code)}>
                <span aria-hidden="true">{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        )}

        {langCode && (
          <div className="zwc-msg zwc-msg--me">
            {LANGS.find((l) => l.code === langCode).flag} {LANGS.find((l) => l.code === langCode).label}
          </div>
        )}

        {langCode && (
        <BotBubble
          text={T('Salom, {{name}}! 👋 Men Zumik — ZUMO yordamchisiman. Ilovani 1 daqiqada ko‘rsatib beraman.', { name })}
          onTalk={phase === 'greet' ? setTalking : undefined}
          onDone={() => setPhase((p) => (p === 'greet' ? 'ask' : p))}
        />
        )}

        {['ask', 'choose', 'reply', 'ready'].includes(phase) && (
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
            <button type="button" className="zwc-choice zwc-choice--other" onClick={() => choose('other')}>
              <span aria-hidden="true">✍️</span> {T('Boshqa — o‘zim yozaman')}
            </button>
          </div>
        )}

        {phase === 'typing' && (
          <form className="zwc-input" onSubmit={submitCustom}>
            <input
              autoFocus
              value={draft}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={T('Masalan: kvartiram uchun mebel qidiryapman')}
              aria-label={T('Javobingiz')}
            />
            <button type="submit" disabled={!draft.trim()} aria-label={T('Yuborish')}><Send size={18} /></button>
          </form>
        )}

        {role && (
          <>
            <div className="zwc-msg zwc-msg--me">
              {customText || `${ROLES.find((r) => r.id === role).emoji} ${ROLES.find((r) => r.id === role).label()}`}
            </div>
            <BotBubble
              text={customText ? `${T('Tushundim!')} ${REPLIES[role]()}` : REPLIES[role]()}
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
