// src/utils/formatPrice.js
import i18n from './i18n';
import { currentLocale } from './i18nHelpers';

export function formatPrice(price, currency) {
  if (price === undefined || price === null || price === '') return null;

  // Agar currency mavjud bo'lmasa, default UZS
  const cur = currency || 'UZS';
  const formatted = typeof price === 'number' ? price.toLocaleString(currentLocale()) : price;

  return cur === 'UZS' ? `${formatted} ${i18n.t('common.sum', 'so‘m')}` : `$${formatted}`;
}
