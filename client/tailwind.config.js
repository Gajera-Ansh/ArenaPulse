/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F3F4F6',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: '#111827',
        'text-secondary': '#6B7280',
        primary: {
          DEFAULT: '#4F46E5', // Indigo-600
          hover: '#4338CA', // Indigo-700
          light: '#EEF2FF', // Indigo-50
        },
        accent: {
          DEFAULT: '#E11D48', // Rose-600
          hover: '#BE123C', // Rose-700
          light: '#FFF1F2', // Rose-50
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
      }
    },
  },
  plugins: [],
}
