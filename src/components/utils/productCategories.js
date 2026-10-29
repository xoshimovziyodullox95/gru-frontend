// Marketplace tovar kategoriyalari backend'dan keladi. Bu xarita ikonka va ranglarni beradi.
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Apple, Baby, Boxes, Car, Dumbbell, Hammer, HeartPulse, Refrigerator, Shirt, Smartphone, Sofa, Store, Tractor,
} from 'lucide-react';
import { getProductCategories } from '../services/categories';

export const CATEGORY_LOOK = {
  elektronika: { icon: Smartphone, image: 'electronics', colors: ['#4b8dff', '#2a4fe0'] },
  'maishiy-texnika': { icon: Refrigerator, image: 'appliances', colors: ['#00c8f8', '#1267d8'] },
  'uy-mebel': { icon: Sofa, image: 'furniture', colors: ['#ff9f43', '#e8590c'] },
  qurilish: { icon: Hammer, image: 'construction', colors: ['#ffb020', '#d97706'] },
  transport: { icon: Car, image: 'transport', colors: ['#5b6cff', '#3b2fd0'] },
  kiyim: { icon: Shirt, image: 'clothing', colors: ['#ff5c7a', '#e0264f'] },
  bolalar: { icon: Baby, image: 'kids', colors: ['#ff7ac6', '#d63384'] },
  gozallik: { icon: HeartPulse, image: 'beauty', colors: ['#c06cff', '#8b2fe0'] },
  oziqovqat: { icon: Apple, image: 'groceries', colors: ['#2fd576', '#0a9a52'] },
  'biznes-jihozlar': { icon: Store, image: 'business', colors: ['#14b8a6', '#0f766e'] },
  'qishloq-xojaligi': { icon: Tractor, image: 'agriculture', colors: ['#84cc16', '#4d7c0f'] },
  'sport-hobbi': { icon: Dumbbell, image: 'sports', colors: ['#f43f5e', '#be123c'] },
};
const FALLBACK_LOOK = { icon: Boxes, colors: ['#00c8f8', '#1267d8'] };

// Bir marta yuklanadi va butun ilova bo'ylab ishlatiladi
let cache = null;
let pending = null;
function loadCategories() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = getProductCategories()
      .then((res) => { cache = Array.isArray(res.data) ? res.data : []; return cache; })
      .catch((err) => { pending = null; throw err; });
  }
  return pending;
}

const pickName = (name, lang) => (name && (name[lang] || name.uz)) || '';

// Joriy tildagi kategoriyalar: [{ id, name, short, icon, colors, productType, subs: [{ id, name }] }]
export function useProductCategories() {
  const { i18n } = useTranslation();
  const [raw, setRaw] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    loadCategories()
      .then((list) => { if (alive) setRaw(list); })
      .catch((err) => console.error('Kategoriyalar yuklanmadi:', err))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const lang = (i18n.resolvedLanguage || 'uz').slice(0, 2);
  const categories = useMemo(() => raw.map((cat) => ({
    ...(CATEGORY_LOOK[cat.id] || FALLBACK_LOOK),
    image: CATEGORY_LOOK[cat.id]?.image ? `/images/categories/${CATEGORY_LOOK[cat.id].image}.png` : null,
    id: cat.id,
    productType: cat.productType,
    name: pickName(cat.name, lang),
    short: pickName(cat.short || cat.name, lang),
    subs: (cat.subs || []).map((sub) => ({ id: sub.id, name: pickName(sub.name, lang) })),
  })), [raw, lang]);

  return { categories, loading };
}

// Kategoriya (va ixtiyoriy ichki bo'lim) bo'yicha marketplace ro'yxati
export const categoryPath = (catId, subId) =>
  `/marketplace/all?type=equipment&level1=${encodeURIComponent(catId)}${subId ? `&sub=${encodeURIComponent(subId)}` : ''}`;
