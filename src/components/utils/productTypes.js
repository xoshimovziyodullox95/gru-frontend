import { T } from './T';
// src/components/utils/productTypes.js
//
// Yagona, 31 ta umumiy mahsulot kategoriyasi tizimi.
// Har bir kategoriya "directions" massivida qaysi yo'nalish(lar)da
// chiqishini belgilaydi — masalan "Ichimliklar" ham Do'kon, ham
// Restoran/Kafe'da ko'rinadi (kesishuv effekti).

export const PRODUCT_TYPES = {
  // ==================== OZIQ-OVQAT — Do'kon + Kafe umumiy (12) ====================
  sabzavotlar: {
    label: T('Sabzavotlar'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  holMevalar: {
    label: "Ho'l mevalar",
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  muzlatilganMahsulotlar: {
    label: T('Muzlatilgan mahsulotlar'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  goshtMahsulotlari: {
    label: T('Go\'sht mahsulotlari'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  baliqMahsulotlari: {
    label: T('Baliq mahsulotlari'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  parrandaMahsulotlari: {
    label: T('Parranda mahsulotlari'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  sutMahsulotlari: {
    label: T('Sut mahsulotlari'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  ichimliklar: {
    label: T('Ichimliklar'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  souslar: {
    label: T('Souslar'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  yogMahsulotlari: {
    label: "Yog' mahsulotlari",
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  unVaDon: {
    label: T('Un va don mahsulotlari'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },
  ziravorlar: {
    label: T('Ziravorlar'),
    directions: ["Do'konlar", "Restoran/Kafe"],
  },

  // ==================== FAQAT DO'KON (5) ====================
  shirinliklar: {
    label: "Shirinliklar / qandolat",
    directions: ["Do'konlar"],
  },
  konservalar: {
    label: T('Konservalar'),
    directions: ["Do'konlar"],
  },
  xojalikMahsulotlari: {
    label: T('Xo\'jalik mahsulotlari'),
    directions: ["Do'konlar"],
  },
  gigienaMahsulotlari: {
    label: T('Gigiyena mahsulotlari'),
    directions: ["Do'konlar", "Restoran/Kafe"], // salfetka, tish tozalagich - kafega ham kerak
  },
  bolalarMahsulotlari: {
    label: T('Bolalar mahsulotlari'),
    directions: ["Do'konlar"],
  },

  // ==================== AGRO (6) ====================
  donDun: {
    label: T('Don-dun (g\'alla)'),
    directions: ["Agro"],
  },
  vetDoriDarmon: {
    label: T('Veterinariya dori-darmoni'),
    directions: ["Agro"],
  },
  chorvaAnjomlari: {
    label: T('Chorva anjomlari (arqon, zapchast)'),
    directions: ["Agro"],
  },
  yemXashak: {
    label: "Yem-xashak",
    directions: ["Agro"],
  },
  urugilik: {
    label: T('Urug\'lik'),
    directions: ["Agro"],
  },
  ogitlar: {
    label: T('O\'g\'itlar'),
    directions: ["Agro"],
  },

  // ==================== BOSHQA YO'NALISHLAR (8) — keyinroq to'ldiriladi ====================
  tibbiyBuyumlar: {
    label: T('Tibbiy buyumlar va sarflanadigan materiallar'),
    directions: ["Klinika"],
  },
  doriVositalari: {
    label: T('Dori vositalari'),
    directions: ["Klinika"],
  },
  qurilishMateriallari: {
    label: T('Qurilish materiallari'),
    directions: ["Service"],
  },
  santexnikaBuyumlari: {
    label: T('Santexnika buyumlari'),
    directions: ["Service"],
  },
  oquvQurollari: {
    label: T('O\'quv qurollari va darsliklar'),
    directions: ["Ta'lim"],
  },
  sportAnjomlari: {
    label: T('Sport anjomlari'),
    directions: ["Ko'ngilochar", "Do'konlar"],
  },
  texnikaEhtiyotQismlari: {
    label: T('Texnika ehtiyot qismlari'),
    directions: ["Do'konlar", "Service"],
  },
  boshqaMahsulot: {
    label: T('Boshqa mahsulot'),
    directions: ["Do'konlar", "Restoran/Kafe", "Agro", "Klinika", "Service", "Ta'lim", "Ko'ngilochar", "Yangi biznes"],
  },
};

// Yordamchi: bitta kategoriya tanlanganda, qaysi yo'nalish(lar)ga
// avtomatik qo'shilishi kerakligini qaytaradi
export function getDirectionsForType(typeKey) {
  return PRODUCT_TYPES[typeKey]?.directions || [];
}

// Yordamchi: berilgan yo'nalishda ko'rinadigan barcha turlarni qaytaradi
// (masalan CategoryPage'da "Mahsulot" bo'limi uchun)
export function getTypesForDirection(direction) {
  return Object.entries(PRODUCT_TYPES)
    .filter(([, val]) => val.directions.includes(direction))
    .map(([key, val]) => ({ key, label: val.label }));
}