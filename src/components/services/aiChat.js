import api from './api';
import i18n from '../utils/i18n';

export const sendAIMessage = async (messages) => {
  const response = await api.post('/ai/chat', {
    messages,
    // Javob tili — ilova tili (server foydalanuvchi yozgan tilni ustun qo'yadi)
    lang: (i18n.resolvedLanguage || i18n.language || 'uz').split('-')[0],
  });

  return response.data;
};

// services/aiChat.js FAYLIGA QO'SHING (mavjud eksportlar yoniga):

export const getNearbySummary = (data) => api.post('/ai/nearby-summary', data);
// data: { locationTitle, level1, selectedItems, nearbyResults }