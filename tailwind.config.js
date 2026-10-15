/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          blue: '#2563EB',
          'blue-hover': '#1D4ED8',
          navy: '#163A63',
          'navy-dark': '#0F2742',
          'navy-light': '#1E4E85',
          bg: '#F5F7FB',
          card: '#FFFFFF',
          text: '#18283E',
          muted: '#64748B',
          border: '#E2E8F0',
        },
        status: {
          pending: '#F59E0B',
          'pending-bg': '#FEF3C7',
          progress: '#2563EB',
          'progress-bg': '#EFF6FF',
          resolved: '#10B981',
          'resolved-bg': '#ECFDF5',
          rejected: '#EF4444',
          'rejected-bg': '#FEF2F2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
