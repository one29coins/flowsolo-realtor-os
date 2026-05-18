/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark-rgb) / <alpha-value>)',
          light: 'rgb(var(--brand-light-rgb) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          dark: 'rgb(var(--accent-dark-rgb) / <alpha-value>)'
        },
        realtor: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#a5b4fc',
          bg: '#eef2ff'
        },
        warm: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          light: '#fcd34d',
          bg: '#fffbeb'
        },
        canvas: '#f5f5f0',
        ink: {
          DEFAULT: '#111111',
          muted: '#888888'
        },
        line: '#eeeeee'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '10px',
        btn: '8px'
      },
      borderWidth: {
        hairline: '0.5px'
      }
    }
  },
  plugins: []
}
