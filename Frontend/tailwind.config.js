/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        glassBg: 'rgba(15, 23, 42, 0.4)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        glassText: 'rgba(255, 255, 255, 0.9)',
        glassTextMuted: 'rgba(255, 255, 255, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'aurora-indigo': 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 60%)',
        'aurora-cyan': 'radial-gradient(ellipse at bottom right, rgba(6, 182, 212, 0.15), transparent 60%)',
        'aurora-emerald': 'radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.1), transparent 50%)',
      }
    },
  },
  plugins: [],
}
