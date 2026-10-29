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
  build: {
    rolldownOptions: {
      output: {
        // Mayda bo'laklarni birlashtiramiz: ikonkalar va React yadrosi bitta-bittadan fayl,
        // og'ir kutubxonalar (xarita, markdown) esa kerak bo'lganda alohida yuklanadi
        codeSplitting: {
          groups: [
            { name: 'icons', test: /node_modules[\/]lucide-react/ },
            { name: 'react', test: /node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/ },
          ],
        },
      },
    },
  },
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