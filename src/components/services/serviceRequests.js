import api from './api';

/* ============================================================
   SERVICE REQUESTS
   "So'rov tarqatish" xizmat buyurtma tizimi
   ============================================================ */

/**
 * Mijoz yangi so'rov yaratadi.
 * Backend shu kategoriyadagi eng yaqin/yuqori reytingli
 * 3-5 ta ustaga avtomatik bildirishnoma yuboradi.
 *
 * data:
 * {
 *   category: string,
 *   description: string,
 *   location: { address?: string, lat?: number, lng?: number }
 * }
 */
export const createServiceRequest = (data) =>
  api.post('/service-requests', data);

/**
 * Mijozning o'z so'rovlari ro'yxati.
 *
 * params: { status?: 'open' | 'closed', limit?, page? }
 */
export const getMyServiceRequests = (params = {}) =>
  api.get('/service-requests/mine', { params });

/**
 * Ustaga (yoki firma xodimiga) kelgan so'rovlar ro'yxati.
 *
 * params: { status?: 'open' | 'closed', limit?, page? }
 */
export const getProviderServiceRequests = (params = {}) =>
  api.get('/service-requests/for-provider', { params });

/**
 * Bitta so'rovning tafsilotlari.
 *
 * - So'rov egasi: barcha takliflarni ko'radi
 * - Bildirishnoma olgan usta: faqat o'z taklifini ko'radi
 */
export const getServiceRequestById = (id) =>
  api.get(`/service-requests/${id}`);

/**
 * Usta (yoki firma xodimi) taklif yuboradi.
 *
 * data: { price: number, message?: string, providerId?: string }
 */
export const sendServiceRequestOffer = (id, data) =>
  api.post(`/service-requests/${id}/offer`, data);

/**
 * Mijoz taklifni tanlaydi.
 * Qolgan barcha takliflar avtomatik "declined" bo'ladi.
 */
export const acceptServiceRequestOffer = (id, offerId) =>
  api.post(`/service-requests/${id}/accept/${offerId}`);

/* ============================================================
   AKTIV ZAKAZ (Yandex Taxi uslubi)
   ============================================================ */

export const getActiveRequest = () =>
  api.get('/service-requests/active');

/* ============================================================
   STATUS O'ZGARTIRISH (usta ishlatadi)
   ============================================================ */

// extra: masalan { photos: ['/uploads/...'] } — usta ishni tugatganda
export const updateRequestStatus = (id, status, reason = '', extra = {}) =>
  api.post(`/service-requests/${id}/status`, {
    status,
    reason,
    ...extra,
  });

/* ============================================================
   NARXNI O'ZGARTIRISH (usta joyida taklif qiladi, mijoz javob beradi)
   ============================================================ */

export const requestPriceChange = (id, price, reason) =>
  api.post(`/service-requests/${id}/price-change`, { price, reason });

export const respondPriceChange = (id, accept) =>
  api.post(`/service-requests/${id}/price-change/respond`, { accept });

/* ============================================================
   TARIX
   ============================================================ */

export const getRequestHistory = (params = {}) =>
  api.get('/service-requests/history', { params });
/* ============================================================
   BAHO (mijoz, ish yakunlangach)
   ============================================================ */

export const submitServiceReview = (id, rating, comment = '') =>
  api.post(`/service-requests/${id}/review`, { rating, comment });

/* Usta to'g'ridan-to'g'ri buyurtmani qabul qila olmaydi */
export const declineServiceRequest = (id, reason = '') =>
  api.post(`/service-requests/${id}/decline`, { reason });
