import { useTheme } from '../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';

import { T } from '../utils/T';
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? T('Yorug‘ mavzuga o‘tish') : T('Qorong‘i mavzuga o‘tish')}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? T('Yorug‘ mavzu') : T('Qorong‘i mavzu')}
      className="relative w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-600 transition-colors duration-300 focus:outline-none"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {theme === 'light' ? (
          <Moon size={12} className="text-gray-700" />
        ) : (
          <Sun size={12} className="text-yellow-400" />
        )}
      </span>
    </button>
  );
}
