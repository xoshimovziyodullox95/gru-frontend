/* ============================================================
   API CLIENT — Supabase token bilan ishlaydi
   Zaxira: localStorage'dan to'g'ridan-to'g'ri olish
   ============================================================ */

import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ============================================================
   TOKEN OLISH — 3 xil usul
   ============================================================ */

/**
 * Supabase'dan tokenni olishning eng ishonchli yo'li.
 * 1. supabase.auth.getSession() — asosiy
 * 2. localStorage — zaxira
 */
async function getAccessToken() {
  /* 1) Supabase session */
  try {
    const { data, error } = await supabase.auth.getSession();

    if (!error && data?.session?.access_token) {
      return data.session.access_token;
    }
  } catch (err) {
    console.warn('[api] Supabase getSession xato:', err);
  }

  /* 2) localStorage'dan to'g'ridan-to'g'ri */
  try {
    /* Supabase key nomini topamiz — 'sb-<projectRef>-auth-token' */
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith('sb-') && k.endsWith('-auth-token')
    );

    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token;
        if (token) return token;
      } catch {
        /* JSON emas, o'tkazib yuboramiz */
      }
    }
  } catch (err) {
    console.warn('[api] localStorage o\'qishda xato:', err);
  }

  return null;
}

/* ============================================================
   REQUEST INTERCEPTOR
   ============================================================ */

api.interceptors.request.use(
  async (config) => {
    try {
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        // JSON defaulti FormData'ni buzadi; browser multipart boundary'ni o'zi qo'yishi kerak.
        if (typeof config.headers?.delete === 'function') {
          config.headers.delete('Content-Type');
        } else if (config.headers) {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
      }

      const token = await getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn(
          '[api] ⚠️ Token topilmadi —',
          config.method?.toUpperCase(),
          config.url
        );
      }
    } catch (err) {
      console.warn('[api] Token qo\'shishda xato:', err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   RESPONSE INTERCEPTOR
   ============================================================ */

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (status === 401) {
      console.warn(`[api] 401 — ${url}`);

      /* Session eskirgan bo'lsa yangilash */
      try {
        const { data, error: refreshError } =
          await supabase.auth.refreshSession();

        if (!refreshError && data?.session?.access_token) {
          /* Qayta so'rov yuborish */
          error.config.headers.Authorization =
            `Bearer ${data.session.access_token}`;
          return api.request(error.config);
        }
      } catch (refreshErr) {
        console.warn('[api] Refresh xato:', refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
