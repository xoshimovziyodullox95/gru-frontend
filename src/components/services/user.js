import api from './api';

// ========== PROFIL ==========
export const getUserProfile = () => api.get('/user/profile');
export const updateUserProfile = (data) => api.put('/user/profile', data);
export const uploadUserAvatar = (formData) => api.post('/user/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ========== O'Z E'LONLARI ==========
export const getMyLocations = () => api.get('/user/my-locations');
export const getMyEquipment = () => api.get('/user/my-equipment');
export const getMyServices = () => api.get('/user/my-services');

// ========== O'CHIRISH ==========
export const deleteLocation = (id) => api.delete(`/locations/${id}`);
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);
export const deleteService = (id) => api.delete(`/service-providers/${id}`);

// ========== BOSHQA FOYDALANUVCHI MA'LUMOTLARI ==========
export const getAllUsers = () => api.get('/users');
export const searchUsers = (query) => api.get('/users/search', { params: { q: query } });
export const getUserById = (id) => api.get(`/user/${id}`); // to'g'rilandi: /user/:id

// ========== BOSHQA FOYDALANUVCHINING E'LONLARI ==========
export const getLocationsByUserId = (userId) => api.get(`/user/${userId}/locations`);
export const getEquipmentByUserId = (userId) => api.get(`/user/${userId}/equipment`);
export const getServicesByUserId = (userId) => api.get(`/user/${userId}/services`);

// ========== OBUNALAR ==========
export const getSubscribers = () => api.get('/user/subscribers');
export const getMySubscriptions = () => api.get('/user/my-subscriptions');
export const subscribeToUser = (id) => api.post(`/user/subscribe/${id}`);
export const unsubscribeFromUser = (id) => api.delete(`/user/unsubscribe/${id}`);
export const isSubscribed = (id) => api.get(`/user/is-subscribed/${id}`);

// ========== PREMIUM ==========
export const upgradePremium = (plan) => api.post('/user/premium/upgrade', { plan });
export const cancelSubscription = () => api.post('/user/premium/cancel');
export const getPremiumStatus = () => api.get('/user/premium/status');

// ========== DASHBOARD STATISTIKA ==========
export const getDashboardStats = () => api.get('/user/dashboard-stats');

// ========== COINS ==========
export const updateUserCoins = (amount) => api.post('/user/coins', { amount });
export const getUserCoins = () => api.get('/user/coins');

// ========== TARIF (agar kerak bo'lsa) ==========
export const upgradeTariff = (plan) => api.post('/user/premium/upgrade', { plan });

export const getSupplierStats = () => api.get('/user/supplier-stats');