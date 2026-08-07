import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function localFirstProxy() {
  return {
    target: 'http://localhost:5000',
    changeOrigin: true,
    bypass(req) {
      const localPath = path.join(__dirname, 'public', decodeURIComponent(req.url));
      if (fs.existsSync(localPath)) {
        return req.url;
      }
    }
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/images': localFirstProxy(),
      '/videos': localFirstProxy(),
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      
      // 🔥 YANGI – barcha /api so‘rovlarini backendga yuborish
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path, // yo‘nalishni o‘zgartirmaslik
      }
    }
  }
});