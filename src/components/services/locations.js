import api from './api';

export const getLocations = (params) => api.get('/locations', { params });
export const getLocationById = (id) => api.get(`/locations/${id}`);
export const createLocation = (data) => api.post('/locations', data);
export const updateLocation = (id, data) => api.put(`/locations/${id}`, data);
export const deleteLocation = (id) => api.delete(`/locations/${id}`);
export const uploadLocationMedia = (locationId, formData, onProgress) =>
  api.post(`/locations/${locationId}/upload-media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });

export const getRandomLocationsWithFallback = (level1, category, limit = 10) => {
  return api.get('/locations/random-or-fallback', { params: { level1, category, limit, _t: Date.now() } });
};

export const getAllLocations = async (limit = 10, level1 = null, category = null) => {
  const params = {};
  if (limit) params.limit = limit;
  if (level1) params.level1 = level1;
  if (category) params.category = category;
  const response = await api.get('/locations', { params });
  return { data: response.data };
};