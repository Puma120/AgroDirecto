/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta AgroDirecto
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // verde principal
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50:  '#fdf8f0',
          100: '#faebd7',
          200: '#f5d0a9',
          300: '#eea85c',
          400: '#e07b20',  // naranja tierra
          500: '#c96a10',
          600: '#a8540c',
        },
        fresh: {
          400: '#34d399',  // verde fresco (badge cosechado hoy)
          500: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',  // mínimo táctil accesible
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}


