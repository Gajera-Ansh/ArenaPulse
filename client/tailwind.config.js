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
        text: '#0F172A',
        'text-secondary': '#64748B',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        accent: {
          DEFAULT: '#EA580C',
          hover: '#C2410C',
          light: '#FFF7ED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        DEFAULT: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        DEFAULT: '12px',
        btn: '10px',
        badge: '50px',
      }
    },
  },
  plugins: [],
}
