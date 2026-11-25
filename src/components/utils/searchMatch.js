// Bozor qidiruvi: so'zlarga bo'lib qidiradi (ketma-ketlik shart emas), ruscha/o'zbekcha qo'shimchalarni
// hisobga oladi. Aniq topilmasa — o'xshashlarini (kamida bitta so'z mos) ball bo'yicha qaytaradi.
const norm = (s) => String(s || '').toLocaleLowerCase('uz-UZ').replace(/[‘’ʻʼ`´]/g, "'");

export function searchWords(query) {
  return [...new Set(
    norm(query).split(/[^\p{L}\p{N}']+/u).map((w) => w.replace(/^'+|'+$/g, '')).filter((w) => w.length >= 2)
  )].slice(0, 8);
}

// кошка/кошек/кошки → кош; muzlatgichlar → muzlatgich
function stem(w) {
  if (/[а-яё]/.test(w)) return w.length >= 4 ? w.slice(0, Math.max(3, w.length - 2)) : w;
  return w.length >= 6 ? w.replace(/(larni|lari|lar|ning|ni|ga|da|dan)$/u, '') : w;
}

// Nechta so'z matnda bor. fuzzy: so'z boshining 4 harfi ("muzlatkich" xatosi ham "muzl" bilan topiladi)
export function wordHits(text, words, fuzzy = false) {
  const hay = norm(text);
  let hits = 0;
  for (const w of words) {
    const s = stem(w);
    const key = fuzzy && s.length >= 5 ? s.slice(0, 4) : s;
    if (hay.includes(key)) hits += 1;
  }
  return hits;
}

export { norm as normalizeSearch };
