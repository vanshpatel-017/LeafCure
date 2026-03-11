/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'animate-slide-in-right',
    'animate-slide-in-left', 
    'animate-slide-in-up',
    'animate-bounce-in',
    'animate-count-up',
    'animate-scale-in-bounce',
    'animate-fade-in',
    'animate-fade-in-up'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}