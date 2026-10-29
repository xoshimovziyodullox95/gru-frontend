// Google orqali kirish — web saytda oddiy redirect, ilovada (Capacitor) esa
// Google sahifasi Chrome Custom Tab'da ochiladi va kirgandan keyin
// uz.zumo.marketplace://auth/callback orqali ilovaning o'ziga qaytadi.
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

// Supabase → Authentication → URL Configuration → Redirect URLs ro'yxatida bo'lishi shart
export const NATIVE_AUTH_REDIRECT = 'uz.zumo.marketplace://auth/callback';

// Email tasdiqlash / OAuth'dan keyin qaytiladigan manzil
export const authRedirectUrl = () =>
  (Capacitor.isNativePlatform() ? NATIVE_AUTH_REDIRECT : window.location.origin);

// Google va Apple uchun umumiy OAuth oqimi
async function signInWithProvider(provider, queryParams) {
  if (!Capacitor.isNativePlatform()) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin, queryParams },
    });
    if (error) throw error;
    // Provayderdan qaytib "orqaga" bosilganda yana login sahifasi chiqmasin
    window.history.replaceState(null, '', '/');
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true, queryParams },
  });
  if (error) throw error;
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url: data.url, presentationStyle: 'popover' });
}

export const signInWithGoogle = (queryParams) => signInWithProvider('google', queryParams);

// Apple bilan kirish — App Store talabi (Google login bor ilovalarda majburiy).
// Supabase → Authentication → Providers → Apple yoqilgach VITE_APPLE_LOGIN=1 qilinadi.
export const APPLE_LOGIN_ENABLED = import.meta.env.VITE_APPLE_LOGIN === '1';
export const signInWithApple = () => signInWithProvider('apple');

// Ilovaga deep link bilan qaytilganda sessiyani o'rnatadi (capacitorShell chaqiradi)
export async function completeNativeAuth(url) {
  if (!url?.startsWith(NATIVE_AUTH_REDIRECT)) return false;
  const { Browser } = await import('@capacitor/browser');
  Browser.close().catch(() => {});

  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  parsed.searchParams.forEach((value, key) => params.set(key, value));

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return true;
  }
  throw new Error(params.get('error_description') || 'Kirish bekor qilindi');
}
