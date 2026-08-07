import api from './api';

// Barcha bildirishnomalarni olish
export const getNotifications = () => api.get('/notifications');

// Bir bildirishnomani o'qilgan deb belgilash
export const markOneRead = (id) => api.put(`/notifications/${id}/read`);

// Barcha bildirishnomalarni o'qilgan deb belgilash
export const markAllRead = () => api.put('/notifications/read-all');

// Bildirishnomalar sonini olishQ
export const getUnreadCount = () => api.get('/notifications/unread-count');