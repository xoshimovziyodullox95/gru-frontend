// src/utils/formatPrice.js
import i18n from './i18n';
import { currentLocale } from './i18nHelpers';
import { T } from './T';

export function formatPrice(price, currency) {
  if (price === undefined || price === null || price === '') return null;

  // Narxi 0 — "Otdam darom" e'lonlari
  if (price === 0) return T('Tekin');

  // Agar currency mavjud bo'lmasa, default UZS
  const cur = currency || 'UZS';
  const formatted = typeof price === 'number' ? price.toLocaleString(currentLocale()) : price;

  return cur === 'UZS' ? `${formatted} ${i18n.t('common.sum', 'so‘m')}` : `$${formatted}`;
}
