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