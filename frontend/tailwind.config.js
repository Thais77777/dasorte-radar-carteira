/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3ccff',
          300: '#80a8ff',
          400: '#4d7fff',
          500: '#2557f5',
          600: '#1a41d1',
          700: '#1732a3',
          800: '#152a7f',
          900: '#132363',
        },
      },
    },
  },
  plugins: [],
};
