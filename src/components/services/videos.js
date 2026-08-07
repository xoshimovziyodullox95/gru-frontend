import api from './api';

export const getPosts = (params) => api.get('/posts', { params });
export const getPostById = (id) => api.get(`/posts/${id}`);
export const createPost = (data) => api.post('/posts', data);
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const likePost = (id) => api.post(`/posts/${id}/like`);
export const dislikePost = (id) => api.post(`/posts/${id}/dislike`);
export const commentPost = (id, data) => api.post(`/posts/${id}/comment`, data);
export const getNotifications = () => api.get('/posts/notifications');
export const markNotificationRead = (id) => api.put(`/posts/notifications/${id}/read`);

// services/posts.js
export const createVideoPost = (formData) =>
  api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const createYoutubePost = ({ title, description, youtubeUrl, relatedId, relatedType }) =>
  api.post('/posts', { title, description, youtubeUrl, relatedId, relatedType });