import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'sf-root': 'var(--bg-root)',
        'sf-surface': 'var(--bg-surface)',
        'sf-elevated': 'var(--bg-elevated)',
        'sf-hover': 'var(--bg-hover)',
        'sf-active': 'var(--bg-active)',
        'sf-border-subtle': 'var(--border-subtle)',
        'sf-border': 'var(--border-default)',
        'sf-border-strong': 'var(--border-strong)',
        'sf-accent': 'var(--accent)',
        'sf-accent-dim': 'var(--accent-dim)',
        'sf-accent-glow': 'var(--accent-glow)',
        'sf-accent-text': 'var(--accent-text)',
        'sf-text': 'var(--text-primary)',
        'sf-text-secondary': 'var(--text-secondary)',
        'sf-text-tertiary': 'var(--text-tertiary)',
        'sf-red': 'var(--red)',
        'sf-green': 'var(--green)',
        'sf-blue': 'var(--blue)',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
