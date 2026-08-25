/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        panel: '#1a1a1e',
        accent: '#4f8ef7',
      },
    },
  },
  plugins: [],
};
