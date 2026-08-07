import api from './api';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('images', file); // backend 'images' fieldini kutadi
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data.urls[0]; // yuklangan faylning URL si
};