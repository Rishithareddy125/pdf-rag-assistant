/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1020',
        paper: '#F5F7FB',
        slate: {
          DEFAULT: '#64748B',
          700: '#334155',
        },
        amber: {
          DEFAULT: '#5850EC',
          50: '#EEF2FF',
        },
        verified: '#10B981',
        rust: '#EF4444',
      },
      fontFamily: {
        display: ['"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
