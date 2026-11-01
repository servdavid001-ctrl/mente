import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        raised: 'var(--surface-raised)',
        text: {
          DEFAULT: 'var(--text)',
          soft: 'var(--text-soft)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)'
        },
        danger: 'var(--danger)',
        border: 'var(--border)'
      },
      borderRadius: { card: '16px', blob: '24px' },
      boxShadow: { card: 'var(--shadow-card)', pop: 'var(--shadow-pop)' },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', 'Georgia', 'serif'],
        ui: ['"Instrument Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: []
};
export default config;
