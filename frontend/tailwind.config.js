/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        ezpos: {
          DEFAULT: '#2563eb',
          light: '#dbeafe',
          dark: '#1e3a8a',
        },
        crossx: {
          DEFAULT: '#7c3aed',
          light: '#ede9fe',
          dark: '#4c1d95',
        },
        ezoffice: {
          DEFAULT: '#6d5df6',
          light: '#ece9fe',
          dark: '#4c3fb8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
