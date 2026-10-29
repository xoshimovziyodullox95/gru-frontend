// Web saytni Android/iPhone ilovasiga yig'ish (Capacitor).
//   node scripts/app-build.mjs        — asosiy: .env dagi VITE_API_URL (https server)
//   node scripts/app-build.mjs dev    — sinov: kompyuterdagi backend (http://<LAN IP>:5000/api)
import { execSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import fs from 'node:fs';

const dev = process.argv[2] === 'dev';
const CONFIG = 'capacitor.config.json';
const base = fs.readFileSync(CONFIG, 'utf8');
const env = { ...process.env };

if (dev) {
  // Telefon "localhost"ni topa olmaydi — kompyuterning Wi-Fi manzilini olamiz
  const ip = Object.values(networkInterfaces()).flat()
    .find((n) => n && n.family === 'IPv4' && !n.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(n.address))?.address;
  if (!ip) throw new Error('Wi-Fi manzili topilmadi. Kompyuter tarmoqqa ulanganini tekshiring.');
  env.VITE_API_URL = `http://${ip}:5000/api`;
  // Faqat sinov yig'masida: shifrlanmagan (http) backend'ga ruxsat
  const cfg = JSON.parse(base);
  cfg.android = { ...cfg.android, allowMixedContent: true };
  cfg.server = { ...cfg.server, cleartext: true };
  fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`Sinov yig'masi — backend: ${env.VITE_API_URL}`);
}

try {
  execSync('npx vite build', { stdio: 'inherit', env });
  execSync('npx cap sync', { stdio: 'inherit', env });
} finally {
  if (dev) fs.writeFileSync(CONFIG, base); // asosiy sozlamani qaytaramiz
}
