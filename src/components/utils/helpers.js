// Haversine formulasi – ikki nuqta orasidagi masofa (km)
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371; // Yer radiusi (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Raqamni valyuta formatida ko‘rsatish (USD)
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
};

// Sana vaqtni mahalliy formatda chiqarish
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Xatolik xabarini olish (backenddan kelgan obyektdan)
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return 'Noma’lum xatolik yuz berdi';
};

// Stringni slugga aylantirish (URL uchun)
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// Email validatsiyasi
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return re.test(email);
};

// Telefon raqam (O‘zbekiston uchun oddiy tekshiruv)
export const isValidPhone = (phone) => {
  const re = /^\+998[0-9]{9}$/;
  return re.test(phone);
};

// Lokatsiyani localStorage dan olish yoki default
export const getUserLocation = () => {
  const stored = localStorage.getItem('userLocation');
  if (stored) return JSON.parse(stored);
  return null;
};

export const setUserLocation = (lat, lng) => {
  localStorage.setItem('userLocation', JSON.stringify({ lat, lng }));
};