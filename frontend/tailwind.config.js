/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06b6d4',
          hover: '#22d3ee',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
        }
      },
    },
  },
  plugins: [],
}