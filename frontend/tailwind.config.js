/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f2ff',
          100: '#e9e7fe',
          200: '#d6d2fc',
          300: '#b8b1f9',
          400: '#9688f4',
          500: '#7a63ec',
          600: '#6746df',
          700: '#5936c9',
          800: '#4a2ea6',
          900: '#3f2a85',
          950: '#261a54',
        },
        ink: {
          50: '#f7f7f9',
          100: '#eeeef2',
          200: '#dedee6',
          300: '#c2c2cf',
          400: '#9a9aae',
          500: '#77778f',
          600: '#5d5d75',
          700: '#4a4a5e',
          800: '#333344',
          900: '#1c1c2a',
          950: '#101018',
        },
        success: {
          50: '#edfcf5',
          100: '#d4f8e6',
          500: '#17b978',
          600: '#0f9c64',
          700: '#0d7a51',
        },
        warning: {
          50: '#fffaeb',
          100: '#fff0c6',
          500: '#f3a712',
          600: '#d18b06',
          700: '#a96b08',
        },
        danger: {
          50: '#fff1f2',
          100: '#ffe0e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        surface: {
          light: '#f6f6f9',
          card: '#ffffff',
          dark: '#0c0d12',
          darkCard: '#13151c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: [
          'Plus Jakarta Sans',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 30px -18px rgba(16, 24, 40, 0.22)',
        card: '0 1px 3px rgba(16, 24, 40, 0.05), 0 24px 48px -36px rgba(16, 24, 40, 0.22)',
        ring: '0 0 0 4px rgba(122, 99, 236, 0.14)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(18px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        unlock: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(6px)' },
          '55%': { transform: 'scale(1.025) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 0.28s ease-out both',
        unlock: 'unlock 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
