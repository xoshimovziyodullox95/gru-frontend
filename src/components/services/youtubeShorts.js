import api from './api'; // sizning mavjud axios instance'ingiz nomiga moslang

export const getYoutubeShorts = (params = {}) =>
  api.get('/youtube-shorts', { params: { limit: 50, ...params } });