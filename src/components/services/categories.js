// src/services/categories.js
import api from './api';

export const getLevel1 = () => api.get('/categories/level1?lang=uz');
export const getLevel2 = (level1) => api.get(`/categories/level2/${encodeURIComponent(level1)}?lang=uz`);
export const getLevel3 = (level1, level2) => api.get(`/categories/level3/${encodeURIComponent(level1)}/${encodeURIComponent(level2)}`);