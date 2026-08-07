import api from './api';

export const getEquipment = (params) => api.get('/equipment', { params });
export const getEquipmentById = (id) => api.get(`/equipment/${id}`);
export const createEquipment = (data) => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);
export const uploadEquipmentMedia = (id, formData, onProgress) =>
  api.post(`/equipment/${id}/upload-media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });

export const getAllEquipment = async (limit = 10) => {
  const response = await api.get('/equipment', { params: { limit } });
  return { data: response.data };
};

export const getNearbyEquipment = (params) => api.get('/equipment/nearby', { params });