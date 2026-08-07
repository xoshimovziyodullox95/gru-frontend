import api from './api';

export const getUsers = () => api.get('/admin/users');
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);
export const getStatistics = () => api.get('/admin/statistics');
export const getAuditLogs = () => api.get('/admin/audit');
export const updateUserRole = (userId, role) => api.put(`/admin/users/${userId}/role`, { role });  // <-- YANGI