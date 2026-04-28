/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ul: {
          yellow: '#f1c800',
          'yellow-hover': '#d4af00',
          'yellow-light': '#fef9d9',
          black: '#1a1a1a',
          gray: '#6b7280',
          'gray-light': '#f3f4f6',
          white: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
