/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0faf4',
          100: '#d1fae5',
          500: '#2d8a5e',
          600: '#1a5c3a',
          700: '#134a2e',
          800: '#0d3822',
        }
      }
    }
  },
  plugins: []
}
