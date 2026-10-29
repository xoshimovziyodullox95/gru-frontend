import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './components/utils/i18n'; // 🔥 to'g'ri yo'l bilan tuzatildi
import { setupNativeShell, restoreLastRoute } from './components/utils/capacitorShell';

restoreLastRoute();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Android/iPhone ilovasi ichida: orqaga tugmasi, status bar, splash
setupNativeShell();
