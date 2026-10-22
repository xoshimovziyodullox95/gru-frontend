  // src/lib/supabase.js
  import { createClient } from '@supabase/supabase-js';

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const clientKey = '__ZUMO_SUPABASE_CLIENT__';
  export const supabase = globalThis[clientKey] || (globalThis[clientKey] = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // Give normal auth operations enough time to queue behind a refresh.
        lockAcquireTimeout: 10000,
      },
    }
  ));
