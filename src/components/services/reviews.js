// Sharhlar API — backend: routes/reviews.js
// type: 'equipment' | 'service_provider' | 'location'
import api from './api';

export const getReviews = (type, id, params = {}) => api.get(`/reviews/${type}/${id}`, { params });
export const getReviewEligibility = (type, id) => api.get(`/reviews/${type}/${id}/eligibility`);
export const createReview = (type, id, formData) =>
  api.post(`/reviews/${type}/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteReview = (reviewId) => api.delete(`/reviews/item/${reviewId}`);
export const toggleReviewHelpful = (reviewId) => api.post(`/reviews/item/${reviewId}/helpful`);
export const replyToReview = (reviewId, text) => api.post(`/reviews/item/${reviewId}/reply`, { text });

// Sharh sahifasi manzili: /reviews/equipment/<id>
export const reviewsPath = (type, id) => `/reviews/${type}/${id}`;

// Telefonda olingan rasmni yuborishdan oldin kichraytiradi (5 MB → ~300 KB)
export async function compressImage(file, maxSide = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file;
  } catch {
    return file; // eski brauzer — asl faylni yuboramiz
  }
}
