/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stage: {
          reception: '#2563eb',   // blue
          hr: '#7c3aed',          // purple
          cabin1: '#16a34a',      // green
          cabin2: '#ea580c',      // orange
          cabin3: '#0d9488',      // teal
          cabin4: '#991b1b',      // dark red
          loi: '#065f46',         // dark green
          rejected: '#6b7280',    // gray
          completed: '#15803d',   // green (completed)
        },
        brand: {
          DEFAULT: '#1e3a8a', // corporate blue
          light: '#3b5bdb',
          dark: '#152a63',
        },
      },
    },
  },
  plugins: [],
}
