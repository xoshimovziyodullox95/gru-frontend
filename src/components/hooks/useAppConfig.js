// Serverdagi yoqgichlar (/api/app-config): masalan phoneLogin — telefon/SMS bilan kirish tugmasi.
// Server javob bermasa yoki xato bo'lsa — hamma narsa "o'chiq" (ilova baribir ishlaydi).
import { useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULTS = { phoneLogin: false };
let cache = null;
let pending = null;

function load() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = api.get('/app-config')
      .then((res) => { cache = { ...DEFAULTS, ...(res.data || {}) }; return cache; })
      .catch(() => { pending = null; return DEFAULTS; });
  }
  return pending;
}

export default function useAppConfig() {
  const [config, setConfig] = useState(cache || DEFAULTS);
  useEffect(() => {
    let alive = true;
    load().then((c) => { if (alive) setConfig(c); });
    return () => { alive = false; };
  }, []);
  return config;
}
