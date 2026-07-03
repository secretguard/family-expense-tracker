/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: '#12141C',
          surface: '#1A1D29',
          raised: '#20233070',
          line: '#272B3B',
          text: '#EEF0F6',
          muted: '#8D93A6',
        },
        brass: {
          300: '#F2C879',
          400: '#E8B75E',
          500: '#D9A344',
        },
        coral: {
          400: '#F2897E',
        },
        mint: {
          400: '#5FCBA1',
        },
      },
      fontFamily: {
        display: ['"Newsreader"', 'Georgia', 'serif'],
        sans: ['"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        ledger: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
