import api from './api';

export const getCart = () => api.get('/cart');
export const addToCart = (itemType, itemId) => api.post('/cart', { itemType, itemId });
export const removeFromCart = (itemId) => api.delete(`/cart/${itemId}`);