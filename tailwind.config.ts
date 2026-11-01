import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#fdfdfb',
          100: '#f9f8f5',
          200: '#f3f2ed',
          300: '#eaeae5',
          400: '#ddddd6',
        },
        ink: {
          DEFAULT: '#1a2320',
          50: '#f4f5f4',
          100: '#e4e8e4',
          200: '#c5cec6',
          300: '#9aab9e',
          400: '#6d8573',
          500: '#4d6853',
          600: '#3a5241',
          700: '#2f4235',
          800: '#27342d',
          900: '#1a2320',
        },
        teal: {
          DEFAULT: '#2c5145',
          50: '#eef5f2',
          100: '#d5e8e1',
          200: '#aed1c5',
          300: '#7fb5a3',
          400: '#549680',
          500: '#3d7a65',
          600: '#2c5145',
          700: '#264639',
          800: '#1f382e',
          900: '#192d25',
        },
        sand: {
          DEFAULT: '#c4a67a',
          50: '#faf7f2',
          100: '#f2eee5',
          200: '#e6d9c5',
          300: '#d6c09e',
          400: '#c4a67a',
          500: '#b8935e',
          600: '#a47f4f',
          700: '#886843',
          800: '#6f553b',
          900: '#5c4733',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        editorial: ['var(--font-playfair)', 'Georgia', 'serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26, 35, 32, 0.04), 0 6px 16px rgba(26, 35, 32, 0.03)',
        'elevated': '0 8px 24px rgba(26, 35, 32, 0.08), 0 16px 48px rgba(26, 35, 32, 0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
