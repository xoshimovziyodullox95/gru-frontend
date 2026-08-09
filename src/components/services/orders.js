import api from './api';

export const getMyOrders = () => api.get('/orders/my-orders');
export const getReceivedOrders = () => api.get('/orders/received');
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });

export const getOrderStatus = (id) => api.get(`/orders/${id}/status`, {
  params: { _t: Date.now() },
});