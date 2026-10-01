/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#0a0d14',
          panel: '#111827',
          card: '#1a2234',
          border: '#2a374f',
          accent: '#38bdf8',
          neon: '#10b981',
          danger: '#f43f5e',
          warning: '#f59e0b',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
