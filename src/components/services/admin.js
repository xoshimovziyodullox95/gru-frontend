import api from './api';

export const getOverview = () => api.get('/admin/overview');
export const getUsers = (params) => api.get('/admin/users', { params });
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);
export const updateUserRole = (userId, role) => api.put(`/admin/users/${userId}/role`, { role });
export const getListings = (type, params) => api.get(`/admin/listings/${type}`, { params });
export const deleteListing = (type, id) => api.delete(`/admin/listings/${type}/${id}`);
export const getAdminRequests = (params) => api.get('/admin/requests', { params });
export const getStatistics = () => api.get('/admin/statistics');
export const getAuditLogs = () => api.get('/admin/audit');
