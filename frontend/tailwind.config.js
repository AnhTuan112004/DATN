/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        fg: 'var(--fg)',
        muted: 'var(--fg-muted)',
        line: 'var(--line)',
        primary: 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        lime: '#D4F34A',
        sky: '#A5DAFF',
        peach: '#FFB48A',
        lilac: '#CBB8FF',
        ink: '#14131A',
        cobalt: '#2D4BFF',
        // Trạng thái giữ nguyên cho dot / icon / nhãn nhỏ
        status: {
          emerald: '#059669',
          amber: '#D97706',
          rose: '#E11D48',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        hard: '3px 3px 0 var(--shadow-c)',
        'hard-sm': '2px 2px 0 var(--shadow-c)',
        'hard-lg': '4px 4px 0 var(--shadow-c)',
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
