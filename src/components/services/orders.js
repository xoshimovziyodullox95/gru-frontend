import api from './api';

export const getMyOrders = () => api.get('/orders', { params: { role: 'buyer' } });
export const getReceivedOrders = () => api.get('/orders/received');
export const updateOrderStatus = (id, status, deliveryEstimate = null) =>
  api.put(`/orders/${id}/status`, { status, deliveryEstimate });

export const getOrderStatus = (id) => api.get(`/orders/${id}/status`, {
  params: { _t: Date.now() },
});

export const cancelOrder = (id, reason = '') =>
  api.put(`/orders/${id}/status`, { status: 'bekor_qilindi', reason });
export const rejectOrder = (id, reason = '') =>
  api.put(`/orders/${id}/status`, { status: 'rad_etildi', reason });

// Bank arizalari
export const createBankApplication = (serviceId, data = {}) =>
  api.post('/bank-applications', { serviceId, ...data });
export const getMyBankApplications = () => api.get('/bank-applications/mine');
export const getBankApplications = (status) =>
  api.get('/bank-applications', { params: status ? { status } : {} });
export const updateBankApplicationStatus = (id, status, note) =>
  api.patch(`/bank-applications/${id}/status`, { status, note });
