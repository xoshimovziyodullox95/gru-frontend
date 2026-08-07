import api from './api';

export const likeItem = (itemId, itemType) => {
  if (itemType === 'location') {
    return api.post(`/locations/${itemId}/like`);
  } else if (itemType === 'post') {
    return api.post(`/posts/${itemId}/like`);
  } else if (itemType === 'equipment') {
    return api.post(`/equipment/${itemId}/like`);
  } else if (itemType === 'service') {
    return api.post(`/service-providers/${itemId}/like`);
  } else if (itemType === 'youtube-external') {
    return api.post(`/youtube-shorts/${itemId}/like`);
  }
  return api.post('/interact/like', { itemId, itemType });
};

export const dislikeItem = (itemId, itemType) => {
  if (itemType === 'location') {
    return api.post(`/locations/${itemId}/dislike`);
  } else if (itemType === 'post') {
    return api.post(`/posts/${itemId}/dislike`);
  } else if (itemType === 'equipment') {
    return api.post(`/equipment/${itemId}/dislike`);
  } else if (itemType === 'service') {
    return api.post(`/service-providers/${itemId}/dislike`);
  } else if (itemType === 'youtube-external') {
    return api.post(`/youtube-shorts/${itemId}/dislike`);
  }
  return api.post('/interact/dislike', { itemId, itemType });
};

export const commentItem = (itemId, itemType, text) => {
  if (itemType === 'location') {
    return api.post(`/locations/${itemId}/comment`, { text });
  } else if (itemType === 'post') {
    return api.post(`/posts/${itemId}/comment`, { text });
  } else if (itemType === 'equipment') {
    return api.post(`/equipment/${itemId}/comment`, { text });
  } else if (itemType === 'service') {
    return api.post(`/service-providers/${itemId}/comment`, { text });
  } else if (itemType === 'youtube-external') {
    return api.post(`/youtube-shorts/${itemId}/comment`, { text });
  }
  return api.post('/interact/comment', { itemId, itemType, text });
};

export const replyComment = (itemId, itemType, commentId, text) => {
  if (itemType === 'location') {
    return api.post(`/locations/${itemId}/comment/${commentId}/reply`, { text });
  } else if (itemType === 'post') {
    return api.post(`/posts/${itemId}/comment/${commentId}/reply`, { text });
  } else if (itemType === 'equipment') {
    return api.post(`/equipment/${itemId}/comment/${commentId}/reply`, { text });
  } else if (itemType === 'service') {
    return api.post(`/service-providers/${itemId}/comment/${commentId}/reply`, { text });
  } else if (itemType === 'youtube-external') {
    return api.post(`/youtube-shorts/${itemId}/comment/${commentId}/reply`, { text });
  }
  return api.post('/interact/reply', { itemId, itemType, commentId, text });
};

export const viewItem = (itemId, itemType) => {
  if (itemType === 'location') {
    return api.put(`/locations/${itemId}/view`);
  } else if (itemType === 'post') {
    return api.put(`/posts/${itemId}/view`);
  } else if (itemType === 'equipment') {
    return api.put(`/equipment/${itemId}/view`);
  } else if (itemType === 'service') {
    return api.put(`/service-providers/${itemId}/view`);
  } else if (itemType === 'youtube-external') {
    return api.put(`/youtube-shorts/${itemId}/view`);
  }
  return api.post('/interact/view', { itemId, itemType });
};

export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);