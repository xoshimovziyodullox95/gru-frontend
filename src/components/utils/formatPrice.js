// src/utils/formatPrice.js
export function formatPrice(price, currency) {
  if (price === undefined || price === null || price === '') return null;
  
  // Agar currency mavjud bo'lmasa, default UZS
  const cur = currency || 'UZS';
  const symbol = cur === 'UZS' ? "so'm" : '$';
  const formatted = typeof price === 'number' ? price.toLocaleString() : price;
  
  return cur === 'UZS' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}