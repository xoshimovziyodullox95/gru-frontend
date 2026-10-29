// T('O‘zbekcha matn') — matnning o'zi kalit. Tarjimalar locales/<til>/ui.json da:
//   { "O‘zbekcha matn": "Русский текст" }
// O'zbek tili uchun fayl kerak emas — matnning o'zi qaytadi.
// O'zgaruvchi: T('{{count}} ta taklif', { count: 3 })
import i18n from './i18n';

const OPTIONS = { ns: 'ui', keySeparator: false, nsSeparator: false };

export function T(text, vars) {
  return i18n.t(text, { ...OPTIONS, defaultValue: text, ...vars });
}
