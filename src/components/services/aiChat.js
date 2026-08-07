import api from './api';

export const sendAIMessage = async (messages) => {
  const response = await api.post('/ai/chat', {
    messages
  });

  return response.data;
};

// services/aiChat.js FAYLIGA QO'SHING (mavjud eksportlar yoniga):

export const getNearbySummary = (data) => api.post('/ai/nearby-summary', data);
// data: { locationTitle, level1, selectedItems, nearbyResults }