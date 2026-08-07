// src/components/utils/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 🔥 Fayl src/components/utils/ ichida, locales/ esa src/locales/da —
// shuning uchun IKKI daraja yuqoriga chiqamiz (../../locales)
import uz from '../locales/uz/translation.json';
import ru from '../locales/ru/translation.json';
import en from '../locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
    },
    fallbackLng: 'uz',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;