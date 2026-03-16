/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0B',
        surface: '#141416',
        'surface-hover': '#1C1C1F',
        border: '#2A2A2E',
        'text-primary': '#E8E8E8',
        'text-secondary': '#71717A',
        'text-accent': '#FFFFFF',
        'message-in': '#1C1C1F',
        'message-out': '#2A2A2E',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
