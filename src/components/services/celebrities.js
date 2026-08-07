import api from './api'; // sizning mavjud axios instance nomi bilan almashtiring

// 🔥 TUZATILDI: backend'dagi haqiqiy yo'l bilan mos keldi —
// /celebrities/category/:category (yo'l parametri), avvalgi
// ?category= (query parametri) emas. Avvalgi holatda bu so'rov
// aslida "hammasini ro'yxat qil" route'iga tushib qolgan edi,
// natijada bitta obyekt o'rniga massiv qaytgan va karta bo'sh
// ko'rinar edi.
export const getCelebrityByCategory = (category) =>
  api.get(`/celebrities/category/${category}`);