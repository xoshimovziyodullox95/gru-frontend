// Kategoriyaga qarab e'lon formasi va filtrdagi qo'shimcha maydonlar (o'lcham, jins).
// Qiymatlar attributes ichida saqlanadi (backend'da Mixed), shuning uchun serverni o'zgartirish shart emas.
import { T } from './T';

const CLOTHES_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const SHOE_SIZES = Array.from({ length: 13 }, (_, i) => String(35 + i)); // 35..47
const KIDS_SIZES = ['0-3m', '3-6m', '6-12m', '1-2y', '2-3y', '3-4y', '4-5y', '5-6y', '6-8y', '8-10y', '10-12y', '12-14y'];

const kidsLabel = (v) => {
  const [range, unit] = [v.slice(0, -1), v.slice(-1)];
  return unit === 'm' ? T('{{n}} oy', { n: range }) : T('{{n}} yosh', { n: range });
};

const genderLabels = () => ({
  men: T('Erkaklar'),
  women: T('Ayollar'),
  boy: T('O‘g‘il bola'),
  girl: T('Qiz bola'),
  unisex: T('Uniseks'),
});

const opts = (values, label = (v) => v) => values.map((v) => ({ value: v, label: label(v) }));
const genderOpts = (keys) => keys.map((k) => ({ value: k, label: genderLabels()[k] }));

// Ichki bo'lim (sub) → maydonlar. Ro'yxatda yo'q bo'limlarda qo'shimcha maydon yo'q.
const spec = {
  erkaklar: () => [{ key: 'size', kind: 'clothes', label: T('O‘lcham'), required: true, options: opts(CLOTHES_SIZES) }],
  ayollar: () => [{ key: 'size', kind: 'clothes', label: T('O‘lcham'), required: true, options: opts(CLOTHES_SIZES) }],
  poyabzal: () => [
    { key: 'gender', label: T('Kimlar uchun'), required: true, options: genderOpts(['men', 'women', 'boy', 'girl']) },
    { key: 'size', kind: 'shoes', label: T('O‘lcham'), required: true, options: opts(SHOE_SIZES) },
  ],
  sumka: () => [{ key: 'gender', label: T('Kimlar uchun'), options: genderOpts(['men', 'women', 'unisex']) }],
  soat: () => [{ key: 'gender', label: T('Kimlar uchun'), options: genderOpts(['men', 'women', 'unisex']) }],
  'bolalar-kiyimi': () => [
    { key: 'gender', label: T('Kimlar uchun'), required: true, options: genderOpts(['boy', 'girl', 'unisex']) },
    { key: 'size', kind: 'kids', label: T('Yoshi / o‘lchami'), required: true, options: opts(KIDS_SIZES, kidsLabel) },
  ],
  oyinchoqlar: () => [{ key: 'gender', label: T('Kimlar uchun'), options: genderOpts(['boy', 'girl', 'unisex']) }],
};

const LEVEL1_SUBS = {
  kiyim: ['erkaklar', 'ayollar', 'poyabzal', 'sumka', 'soat'],
  bolalar: ['bolalar-kiyimi', 'oyinchoqlar'],
};

const IMPLIED_GENDER = { erkaklar: 'men', ayollar: 'women' };

// E'lon formasi uchun: tanlangan ichki bo'limning maydonlari
export const getListingFields = (sub) => (spec[sub] ? spec[sub]() : []);

// E'lonning jinsi: aniq tanlangan yoki bo'limdan ("Erkaklar kiyimi" → men)
export const itemGender = (item) => item.attrs?.gender || IMPLIED_GENDER[item.sub] || '';

export const conditionOptions = () => [
  { value: 'new', label: T('Yangi') },
  { value: 'used', label: T('Ishlatilgan') },
];

// Filtr uchun: tanlangan kategoriya/bo'limga mos jins va o'lcham guruhlari
export function getFilterFacets(selectedLevel1s, selectedSubs) {
  let subs = [];
  if (selectedSubs.size > 0) {
    subs = [...selectedSubs].filter((s) => spec[s]);
  } else {
    selectedLevel1s.forEach((l1) => { subs.push(...(LEVEL1_SUBS[l1] || [])); });
  }
  const gender = new Map();
  const sizeGroups = new Map();
  subs.forEach((s) => {
    spec[s]().forEach((field) => {
      if (field.key === 'gender') field.options.forEach((o) => gender.set(o.value, o));
      if (field.key === 'size' && !sizeGroups.has(field.kind)) sizeGroups.set(field.kind, field);
    });
  });
  const order = ['men', 'women', 'boy', 'girl', 'unisex'];
  return {
    gender: [...gender.values()].sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value)),
    sizeGroups: [...sizeGroups.values()],
  };
}

// Detal sahifasida ko'rsatish uchun yorliqlar
export function describeAttrs(sub, attrs = {}) {
  const out = [];
  getListingFields(sub).forEach((field) => {
    const opt = field.options.find((o) => o.value === attrs[field.key]);
    if (opt) out.push({ label: field.label, value: opt.label });
  });
  return out;
}
