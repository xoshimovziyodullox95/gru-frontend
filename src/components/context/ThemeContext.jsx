// src/context/ThemeContext.jsx
// mode: 'dark' | 'light' | 'system' (foydalanuvchi tanlovi)
// theme: 'dark' | 'light' (hozir amalda qo'llanayotgani)
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'theme';
const MODES = ['dark', 'light', 'system'];

// Context hooks are intentionally exported beside their provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const systemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

function readMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (MODES.includes(saved)) return saved;
  } catch {
    // localStorage yopiq bo'lsa standart rejim
  }
  return 'light'; // standart — yorug' mavzu
}

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState(readMode);
  const [system, setSystem] = useState(systemTheme);

  // Tizim rejimi tanlangan bo'lsa, telefon mavzusi o'zgarishini kuzatamiz
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!media) return undefined;
    const onChange = () => setSystem(media.matches ? 'light' : 'dark');
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const theme = mode === 'system' ? system : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0A1628' : '#F0F6FC');
  }, [theme]);

  const setMode = (next) => {
    if (!MODES.includes(next)) return;
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // saqlab bo'lmasa ham shu sessiyada ishlaydi
    }
  };

  const toggleTheme = () => setMode(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
