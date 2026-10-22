// src/services/socket.js
/* ============================================================
   SOCKET — Socket.io client (FINAL)
   ============================================================ */

import { io } from 'socket.io-client';
import { supabase } from './supabase';

let socket = null;
let currentUserId = null;

export const getSocket = () => {
  if (!socket) {
    const URL = (
      import.meta.env.VITE_API_URL || 'http://localhost:5000'
    ).replace('/api', '');

    socket = io(URL, {
      // ✅ POLLING BIRINCHI, keyin websocket'ga upgrade
      transports: ['polling', 'websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 15,
      timeout: 20000,
      withCredentials: true,

      auth: async (cb) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          cb({ token: session?.access_token || null });
        } catch (err) {
          console.warn('Socket auth token xato:', err);
          cb({ token: null });
        }
      },
    });

    socket.on('connect', () => {
      console.log('🔌 Socket ulandi:', socket.id, '| transport:', socket.io.engine.transport.name);

      // Websocket'ga upgrade bo'lganda log
      socket.io.engine.on('upgrade', (transport) => {
        console.log('⬆️ Upgrade:', transport.name);
      });

      if (currentUserId) {
        socket.emit('register', currentUserId);
        console.log('📤 Register yuborildi:', currentUserId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket uzildi:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('🔌 Socket xato:', err.message);
    });
  }

  return socket;
};

export const registerSocketUser = async (mongoUserId) => {
  if (!mongoUserId) return;

  currentUserId = String(mongoUserId);
  const s = getSocket();

  if (!s.connected) {
    console.log('⏳ Socket ulanmoqda...');
    s.connect();
    return;
  }

  s.emit('register', currentUserId);
  console.log('📤 Register yuborildi:', currentUserId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};