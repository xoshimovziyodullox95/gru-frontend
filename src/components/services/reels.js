// src/services/reels.js
import api from './api';

export const getReels = async () => {
  const res = await api.get('/reels');
  return res.data;
};

export const createReel = async (data) => {
  const res = await api.post('/reels', data);
  return res.data;
};

export const likeReel = async (reelId) => {
  const res = await api.post(`/reels/${reelId}/like`);
  return res.data;
};

export const commentReel = async (reelId, text) => {
  const res = await api.post(`/reels/${reelId}/comment`, { text });
  return res.data;
};

export const replyReelComment = async (reelId, commentId, text) => {
  const res = await api.post(`/reels/${reelId}/comment/${commentId}/reply`, { text });
  return res.data;
};

export const viewReel = async (reelId) => {
  const res = await api.post(`/reels/${reelId}/view`);
  return res.data;
};