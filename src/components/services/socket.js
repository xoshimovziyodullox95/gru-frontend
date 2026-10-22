// src/components/services/socket.js
// Umumiy socket.io client (Navbar va ChatPage ikkalasi shu ulanishdan foydalanadi)
// Server JWT talab qiladi, shuning uchun token har ulanishda yuboriladi.

import { io } from 'socket.io-client';
import { supabase } from '../lib/supabase';

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/api\/?$/, '');

let socket = null;
let currentUserId = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 15,
      timeout: 20000,
      withCredentials: true,

      // 🔑 Server io.use() shu tokenni tekshiradi
      auth: async (cb) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          cb({ token: session?.access_token || null });
        } catch (err) {
          console.warn('Socket token xato:', err);
          cb({ token: null });
        }
      },
    });

    socket.on('connect', () => {
      if (currentUserId) socket.emit('register', currentUserId);
    });

    socket.on('connect_error', (err) => {
      console.warn('🔌 Socket xato:', err.message);
    });
  }
  return socket;
};

export const registerSocketUser = (mongoUserId) => {
  if (!mongoUserId) return;
  currentUserId = String(mongoUserId);

  const s = getSocket();
  if (!s.connected) {
    s.connect();
    return;
  }
  s.emit('register', currentUserId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};

export default getSocket;