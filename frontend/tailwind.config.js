/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#101828', 800: '#1D2939', 700: '#344054', 600: '#475467', 500: '#667085', 400: '#98A2B3', 300: '#D0D5DD', 200: '#EAECF0', 100: '#F2F4F7', 50: '#F9FAFB' },
        indigo: { DEFAULT: '#6366F1', 50: '#EEF2FF', 100: '#E0E7FF', 600: '#4F46E5', 700: '#4338CA' },
        electric: { DEFAULT: '#3B82F6', 50: '#EFF6FF', 100: '#DBEAFE', 600: '#2563EB' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)',
        lift: '0 12px 32px -8px rgba(99,102,241,.25)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
        'hero-glow': 'radial-gradient(60% 50% at 70% 0%, rgba(99,102,241,.18) 0%, rgba(59,130,246,.08) 45%, transparent 75%)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: { 'fade-up': 'fadeUp .5s ease-out both', floaty: 'floaty 6s ease-in-out infinite' },
    },
  },
  plugins: [],
};
