import api from './api';

/* ============================================================
   SERVICE PROVIDERS
   ============================================================ */

/**
 * Barcha xizmat ko‘rsatuvchilarni olish.
 *
 * Qo‘llab-quvvatlanadigan params:
 * {
 *   category,
 *   level1,
 *   entityType,
 *   userId,
 *   staffUserId,
 *   limit,
 *   page
 * }
 */
export const getServiceProviders = (params = {}) =>
  api.get('/service-providers', {
    params,
  });

/**
 * Bitta xizmat ko‘rsatuvchini olish.
 */
export const getServiceProviderById = (id) =>
  api.get(`/service-providers/${id}`);

/**
 * Yangi xizmat ko‘rsatuvchi yaratish.
 *
 * data:
 * {
 *   entityType: 'individual' | 'company',
 *   company?: string,
 *   name: string,
 *   description: string,
 *   phone: string,
 *   email?: string,
 *   website?: string,
 *   price_range?: string,
 *   level1: string,
 *   service_category: string,
 *   serviceTags?: string[]
 * }
 */
export const createServiceProvider = (data) =>
  api.post('/service-providers', data);

/**
 * Xizmat ko‘rsatuvchi ma’lumotlarini yangilash.
 *
 * companyStaff bu endpoint orqali yangilanmaydi.
 */
export const updateServiceProvider = (id, data) =>
  api.put(`/service-providers/${id}`, data);

/**
 * Xizmat ko‘rsatuvchini o‘chirish.
 */
export const deleteServiceProvider = (id) =>
  api.delete(`/service-providers/${id}`);

/* ============================================================
   SERVICE TAXONOMY
   ============================================================ */

/**
 * Xizmat yo‘nalishlari va kategoriyalarini olish.
 *
 * Response:
 * {
 *   directions: [
 *     'maishiy-va-uy-xizmatlari',
 *     ...
 *   ],
 *   taxonomy: {
 *     'maishiy-va-uy-xizmatlari': [
 *       'konditsioner',
 *       'santexnik',
 *       ...
 *     ]
 *   }
 * }
 */
export const getServiceTaxonomy = () =>
  api.get('/service-providers/taxonomy');

/* ============================================================
   COMPANY STAFF
   ============================================================ */

/**
 * Firma xodimini qo‘shish.
 *
 * @param {string} providerId ServiceProvider ID
 * @param {string} userId Qo‘shiladigan foydalanuvchi ID
 */
export const addServiceProviderStaff = (
  providerId,
  userId
) =>
  api.post(
    `/service-providers/${providerId}/staff`,
    {
      userId,
    }
  );

/**
 * Firma xodimini o‘chirish.
 *
 * @param {string} providerId ServiceProvider ID
 * @param {string} staffUserId Xodim foydalanuvchi ID
 */
export const removeServiceProviderStaff = (
  providerId,
  staffUserId
) =>
  api.delete(
    `/service-providers/${providerId}/staff/${staffUserId}`
  );

/* ============================================================
   MEDIA
   ============================================================ */

/**
 * Xizmat uchun rasm va videolar yuklash.
 *
 * Content-Type qo‘lda yozilmaydi.
 * Browser multipart boundary qiymatini o‘zi yaratadi.
 */
export const uploadServiceMedia = (
  providerId,
  formData,
  onProgress
) =>
  api.post(
    `/service-providers/${providerId}/upload-media`,
    formData,
    {
      onUploadProgress: onProgress,
    }
  );

/* ============================================================
   RATING
   ============================================================ */

/**
 * Xizmat ko‘rsatuvchiga 1–5 baho berish.
 */
export const rateServiceProvider = (
  providerId,
  value
) =>
  api.post(
    `/service-providers/${providerId}/rate`,
    {
      value,
    }
  );

/* ============================================================
   COMMENTS
   ============================================================ */

/**
 * Izoh yozish.
 */
export const commentServiceProvider = (
  providerId,
  text
) =>
  api.post(
    `/service-providers/${providerId}/comment`,
    {
      text,
    }
  );

/**
 * Izohga javob yozish.
 */
export const replyServiceProviderComment = (
  providerId,
  commentId,
  text
) =>
  api.post(
    `/service-providers/${providerId}/comment/${commentId}/reply`,
    {
      text,
    }
  );

/* ============================================================
   SERVICE APPLICATION
   ============================================================ */

/**
 * Xizmatga ariza yuborish.
 *
 * Individual:
 *   notification faqat xizmat egasiga boradi.
 *
 * Company:
 *   notification firma egasi va barcha companyStaff
 *   foydalanuvchilariga boradi.
 */
export const applyToService = (
  providerId,
  message = ''
) =>
  api.post(
    `/service-providers/${providerId}/apply`,
    {
      message,
    }
  );

/* ============================================================
   BANK SERVICES
   ============================================================ */

export const getBankServices = (params = {}) =>
  api.get('/services', {
    params,
  });

export const getBankServiceById = (id) =>
  api.get(`/services/${id}`);