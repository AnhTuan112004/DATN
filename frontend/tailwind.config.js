/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F3EC',
        ink: '#14131A',
        cobalt: {
          DEFAULT: '#2D4BFF',
          hover: '#1E3AE8',
        },
        lime: {
          DEFAULT: '#D4F34A',
          hover: '#C2E535',
        },
        peach: {
          DEFAULT: '#FFB48A',
          hover: '#F8A375',
        },
        lilac: {
          DEFAULT: '#CBB8FF',
          hover: '#BAA3F8',
        },
        sky: {
          DEFAULT: '#A5DAFF',
          hover: '#90CCF8',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        hard: '3px 3px 0 #14131A',
        'hard-sm': '2px 2px 0 #14131A',
        'hard-lg': '5px 5px 0 #14131A',
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
