/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0A1628',
        darkCard: '#0F2040',
        darkBorder: '#1A3A6A',
        cyan: '#00D4FF',
        cyanLight: '#66E5FF',
        cyanDark: '#0099CC',
        textLight: '#E8F4FD',
        textMuted: '#8AB4D0',
      }
    },
  },
  plugins: [],
}