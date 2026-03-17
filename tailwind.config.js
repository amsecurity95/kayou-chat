/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#E8EFF5',
        surface: '#FFFFFF',
        'surface-hover': '#F0F6FB',
        border: '#D0DDE8',
        'text-primary': '#1A2B3C',
        'text-secondary': '#6B8299',
        'text-accent': '#0A66C2',
        'message-in': '#F0F6FB',
        'message-out': '#0A66C2',
        'blue-start': '#0A66C2',
        'blue-mid': '#2E8AE6',
        'blue-end': '#5BA8F5',
        'blue-light': '#E8F1FB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
