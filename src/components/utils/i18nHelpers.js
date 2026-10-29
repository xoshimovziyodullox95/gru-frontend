// Komponentdan tashqarida (hook'siz) ishlatiladigan tarjima yordamchilari.
// Har chaqiruvda joriy til olinadi, shuning uchun render paytida chaqirilsa yetarli.
import i18n from './i18n';

const LOCALES = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

export const currentLocale = () => LOCALES[(i18n.language || 'uz').split('-')[0]] || 'uz-UZ';

const prettifySlug = (slug = '') =>
  String(slug).replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

// Xizmat turi slug'i -> joriy tildagi nom (santexnik -> "Сантехник")
export const serviceLabel = (slug) =>
  slug ? i18n.t(`svc.cat.${slug}`, { defaultValue: prettifySlug(slug) }) : i18n.t('common.service', 'Xizmat');

// Xizmat yo'nalishi slug'i -> nom
export const directionLabel = (slug) =>
  slug ? i18n.t(`svc.dir.${slug}`, { defaultValue: prettifySlug(slug) }) : '';

// "5 daqiqa oldin" / "5 мин назад"
export function timeAgo(date) {
  if (!date) return i18n.t('time.now', 'hozir');
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1) return i18n.t('time.now', 'hozir');
  if (diff < 60) return i18n.t('time.minutesAgo', '{{count}} daqiqa oldin', { count: diff });
  if (diff < 1440) return i18n.t('time.hoursAgo', '{{count}} soat oldin', { count: Math.floor(diff / 60) });
  return i18n.t('time.daysAgo', '{{count}} kun oldin', { count: Math.floor(diff / 1440) });
}

// 220000 -> "220 000"
export const formatSum = (value) => Number(value || 0).toLocaleString(currentLocale());

// Mijoz tanlagan "qachon kerak" qiymati
export const whenLabel = (when) =>
  i18n.t(`requestWhen.${when || 'now'}`, { now: 'Hozir', today: 'Bugun', tomorrow: 'Ertaga', week: 'Shu hafta' }[when || 'now']);

// Ustaning kelish vaqti: "Bugun, 15:00" / "Ertaga, 10:30" / "3-noy, 09:00"
export function formatVisit(date) {
  if (!date) return '';
  const d = new Date(date);
  const time = d.toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit' });
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((day - today) / 86400000);
  if (diff === 0) return `${i18n.t('requestWhen.today', 'Bugun')}, ${time}`;
  if (diff === 1) return `${i18n.t('requestWhen.tomorrow', 'Ertaga')}, ${time}`;
  return `${d.toLocaleDateString(currentLocale(), { day: 'numeric', month: 'short' })}, ${time}`;
}
