import api from './api';

export const getConversations = () => api.get('/chat/conversations');
export const getMessages = (userId) => api.get(`/chat/messages/${userId}`);
export const sendMessage = (data) => api.post('/chat/send', data);

export const sendMedia = (userId, file) => {
  const formData = new FormData();
  formData.append('media', file);
  return api.post(`/chat/media/${userId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const markAsRead = (messageId) => api.put(`/chat/messages/${messageId}/read`);
export const replyMessage = (messageId, text) => api.post(`/chat/messages/${messageId}/reply`, { text });
export const getUnreadCount = () => api.get('/chat/unread-count');
export const editMessage = (messageId, text) => api.put(`/chat/messages/${messageId}`, { message: text });
export const deleteMessage = (messageId) => api.delete(`/chat/messages/${messageId}`);