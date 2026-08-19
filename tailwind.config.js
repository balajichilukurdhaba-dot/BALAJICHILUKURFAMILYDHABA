/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': 'var(--color-brand-bg)',
        'brand-dark': 'var(--color-brand-dark)',
        'brand-accent': 'var(--color-brand-accent)',
        'brand-gold': 'var(--color-brand-gold)',
        'brand-olive': 'var(--color-brand-olive)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        telugu: ['var(--font-telugu)', 'serif'],
      },
    },
  },
  plugins: [],
};
