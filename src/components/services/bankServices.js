import api from './api';

export const getBankServices = (params) => api.get('/services', { params });
export const getBankServiceById = (id) => api.get(`/services/${id}`);