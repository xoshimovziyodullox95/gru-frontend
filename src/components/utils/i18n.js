// src/components/utils/i18n.js
// Ikki xil tarjima:
//   t('kalit.yo‘li', 'standart')  — translation.json (kalit bo'yicha)
//   T('O‘zbekcha matn')          — ui.json (matnning o'zi kalit, utils/T.js)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const SUPPORTED = ['uz', 'ru', 'en'];

// Faqat joriy til yuklanadi (o'zbek — doim, chunki u zaxira til). Uchala tilni birga
// yuklash ilovani ~350 KB og'irlashtirardi. Til almashganda sahifa qayta yuklanadi (pastda).
function detectLanguage() {
  let saved = null;
  try { saved = localStorage.getItem('i18nextLng'); } catch { /* storage yo'q */ }
  const candidates = [saved, ...(typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [])];
  for (const value of candidates) {
    const code = String(value || '').slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(code)) return code;
  }
  return 'uz';
}

const TRANSLATION = {
  uz: () => import('../locales/uz/translation.json'),
  ru: () => import('../locales/ru/translation.json'),
  en: () => import('../locales/en/translation.json'),
};
const UI = {
  ru: () => import('../locales/ru/ui.json'),
  en: () => import('../locales/en/ui.json'),
};

const lang = detectLanguage();
const [uzMod, langMod, uiMod] = await Promise.all([
  TRANSLATION.uz(),
  lang === 'uz' ? null : TRANSLATION[lang](),
  lang === 'uz' ? null : UI[lang](),
]);

const resources = { uz: { translation: uzMod.default, ui: {} } };
if (lang !== 'uz') resources[lang] = { translation: langMod.default, ui: uiMod.default };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: lang,
    supportedLngs: SUPPORTED,
    load: 'languageOnly', // ru-RU -> ru
    fallbackLng: 'uz',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// <html lang> joriy tilga mos bo'lsin (ekran o'quvchi, brauzer tarjimasi, sana formatlari)
const syncLang = (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = (lng || 'uz').split('-')[0];
};
syncLang(i18n.language);

// Modul darajasidagi T('...') matnlari (ro'yxatlar, konstantalar) yuklanishda bir marta
// hisoblanadi — til almashganda sahifani qayta yuklaymiz, hammasi yangi tilda chiqadi.
let current = (i18n.language || 'uz').split('-')[0];
i18n.on('languageChanged', (lng) => {
  syncLang(lng);
  const next = (lng || 'uz').split('-')[0];
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem('i18nextLng', next);
  } catch {
    // saqlab bo'lmasa ham qayta yuklash ishlaydi
  }
  if (typeof window !== 'undefined') window.location.reload();
});

export default i18n;
