import api from './api';

export const getServiceProviders = (params) => api.get('/service-providers', { params });
export const getServiceProviderById = (id) => api.get(`/service-providers/${id}`);
export const createServiceProvider = (data) => api.post('/service-providers', data);
export const updateServiceProvider = (id, data) => api.put(`/service-providers/${id}`, data);
export const deleteServiceProvider = (id) => api.delete(`/service-providers/${id}`);
export const uploadServiceMedia = (id, formData, onProgress) => api.post(`/service-providers/${id}/upload-media`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: onProgress
});

export const getBankServices = (params) => api.get('/services', { params });
export const getBankServiceById = (id) => api.get(`/services/${id}`);

export const rateServiceProvider = (id, value) => api.post(`/service-providers/${id}/rate`, { value });
export const commentServiceProvider = (id, text) => api.post(`/service-providers/${id}/comment`, { text });
export const replyServiceProviderComment = (id, commentId, text) => api.post(`/service-providers/${id}/comment/${commentId}/reply`, { text });
export const applyToService = (id, message) => api.post(`/service-providers/${id}/apply`, { message });