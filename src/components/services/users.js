import api from './api';

export const getAllUsers = () => api.get('/users');
export const searchUsers = (query) =>
  api.get('/users/search', { params: { q: query } });
