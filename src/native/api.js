import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const extra = Constants.expoConfig?.extra || {};
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const configuredApiUrl = String(extra.apiUrl || '');
const androidApiUrl = Platform.OS === 'android'
  ? configuredApiUrl.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2')
  : configuredApiUrl;
export const API_URL = String(androidApiUrl || `http://${fallbackHost}:5000/api`).replace(/\/$/, '');
export const SUPABASE_URL = String(extra.supabaseUrl || '').replace(/\/$/, '');
export const SUPABASE_ANON_KEY = String(extra.supabaseAnonKey || '');
export const SESSION_KEY = 'zumo.native.session';

export function unwrapArray(payload) {
  const candidates = [payload, payload?.data, payload?.items, payload?.results,
    payload?.data?.data, payload?.data?.items, payload?.data?.results];
  return candidates.find(Array.isArray) || [];
}

export function absoluteMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^(https?:|data:|file:)/i.test(value)) return value;
  try {
    const origin = new URL(API_URL).origin;
    return `${origin}${value.startsWith('/') ? '' : '/'}${value}`;
  } catch {
    return value;
  }
}

async function refreshAuthSession(refreshToken) {
  const session = await supabaseAuth('token?grant_type=refresh_token', { refresh_token: refreshToken });
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function apiRequest(path, { token, method = 'GET', body, retryAuth = true } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401 && token && retryAuth) {
    try {
      const saved = await AsyncStorage.getItem(SESSION_KEY);
      const session = saved ? JSON.parse(saved) : null;
      if (session?.refresh_token && session.access_token === token) {
        const refreshed = await refreshAuthSession(session.refresh_token);
        return apiRequest(path, { token: refreshed.access_token, method, body, retryAuth: false });
      }
    } catch {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  }
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `So‘rov bajarilmadi (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function apiUpload(path, { token, formData }) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error || `Fayllar yuklanmadi (${response.status})`);
  return data;
}

async function supabaseAuth(path, payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase manzili yoki public kaliti sozlanmagan.');
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Tasdiqlash amalga oshmadi.');
  return data;
}

export const requestPhoneCode = (phone) => supabaseAuth('otp', { phone, create_user: true, data: { role: 'user', auth_method: 'phone_otp' } });
export const verifyPhoneCode = (phone, token) => supabaseAuth('verify', { phone, token, type: 'sms' });
