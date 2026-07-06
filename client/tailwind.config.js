/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: '#111827',
        'text-secondary': '#6B7280',
        primary: {
          DEFAULT: '#2563EB', // Blue-600
          hover: '#1D4ED8', // Blue-700
          light: '#EFF6FF', // Blue-50
        },
        accent: {
          DEFAULT: '#EA580C', // Orange-600
          hover: '#C2410C', // Orange-700
          light: '#FFF7ED', // Orange-50
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        DEFAULT: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        sharp: '4px 4px 0px 0px rgba(15, 23, 42, 0.1)',
        'sharp-hover': '2px 2px 0px 0px rgba(15, 23, 42, 0.15)',
      },
      borderRadius: {
        DEFAULT: '6px',
        btn: '4px',
        badge: '4px',
        panel: '8px'
      },
      keyframes: {
        aurora: {
          '0%, 100%': { transform: 'scale(1) translate(0px, 0px)', opacity: 0.5 },
          '33%': { transform: 'scale(1.1) translate(30px, -50px)', opacity: 0.7 },
          '66%': { transform: 'scale(0.9) translate(-20px, 20px)', opacity: 0.6 },
        }
      },
      animation: {
        aurora: 'aurora 15s ease-in-out infinite',
        'aurora-delayed': 'aurora 15s ease-in-out 5s infinite',
        'aurora-slow': 'aurora 20s ease-in-out 2s infinite',
      }
    },
  },
  plugins: [],
}
