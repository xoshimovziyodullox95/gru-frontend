import api from './api';

export const createTurnkeyRequest = (businessModelId, budget) => 
  api.post('/turnkey', { businessModelId, budget });
export const getMyTurnkeyRequests = () => api.get('/turnkey');