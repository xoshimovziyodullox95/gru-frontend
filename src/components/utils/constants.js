// API endpointlari va umumiy konstantalar
export const API_BASE = import.meta.env.VITE_API_URL;

// Kategoriya ranglari (ixtiyoriy, UI uchun)
export const CATEGORY_COLORS = {
  Social: '#FF2D75',
  Retail: '#00F0FF',
  Production: '#FFA000',
  Services: '#9C27B0',
  Agro: '#4CAF50',
  Infrastructure: '#2196F3',
  Auto: '#FF9800',
  Digital: '#E91E63',
};

// Mahsulot holatlari
export const CONDITIONS = {
  NEW: 'new',
  USED: 'used',
};

// Foydalanuvchi turlari
export const USER_TYPES = {
  INDIVIDUAL: 'individual',
  LEGAL: 'legal',
};

// Savat element turlari
export const CART_ITEM_TYPES = {
  EQUIPMENT: 'equipment',
  LOCATION: 'location',
  PACKAGE: 'package',
};

// Til variantlari
export const LANGUAGES = [
  { code: 'uz', name: 'O‘zbek', flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

// Supabase JWT token muddati (sekund)
export const TOKEN_EXPIRY = 3600;

// Xarita sozlamalari
export const DEFAULT_MAP_CENTER = [41.2995, 69.2401]; // Toshkent
export const DEFAULT_MAP_ZOOM = 13;