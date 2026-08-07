import { io } from 'socket.io-client';

let socket = null;

// Bitta marta ulanadi, keyingi chaqiruvlarda mavjud socketni qaytaradi
export const getSocket = () => {
  if (!socket) {
    const URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');
    socket = io(URL, { transports: ['websocket'], autoConnect: true });
  }
  return socket;
};

// mongoUserId — bu Mongo'dagi User._id bo'lishi SHART,
// chunki backend (orders.js) `listing.userId` (Mongo _id) orqali
// `user_${userId}` xonasiga eventni jo'natadi.
export const registerSocketUser = (mongoUserId) => {
  if (!mongoUserId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit('register', mongoUserId);
  } else {
    s.once('connect', () => s.emit('register', mongoUserId));
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};