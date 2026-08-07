export function formatPrice(price, currency) {
  if (price === undefined || price === null || price === '') return null;
  const symbol = currency === 'UZS' ? "so'm" : '$';
  const formatted = typeof price === 'number' ? price.toLocaleString() : price;
  return currency === 'UZS' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}