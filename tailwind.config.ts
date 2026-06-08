import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // reset all defaults — only custom tokens live here
    screens: {
      sm: '390px',
      md: '768px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      // Base palette
      bg: '#FAF9F6',
      ink: '#111111',
      muted: '#6B7280',
      border: '#E5E3DF',
      surface: '#FFFFFF',
      // Accent
      accent: {
        DEFAULT: '#2563EB',
        light: '#DBEAFE',
        dark: '#1D4ED8',
      },
      // State
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
    },
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"SF Pro Display"',
        '"Segoe UI"',
        'sans-serif',
      ],
    },
    fontSize: {
      // strict 5-step scale
      hero:  ['32px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
      title: ['24px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
      body:  ['18px', { lineHeight: '1.5', fontWeight: '400' }],
      sm:    ['15px', { lineHeight: '1.4', fontWeight: '400' }],
      xs:    ['13px', { lineHeight: '1.3', fontWeight: '400' }],
    },
    spacing: {
      px: '1px',
      0: '0',
      0.5: '2px',
      1: '4px',
      1.5: '6px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      10: '40px',
      12: '48px',
      14: '56px',
      16: '64px',
      20: '80px',
      24: '96px',
      safe: 'env(safe-area-inset-bottom)',
    },
    borderRadius: {
      none: '0',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      full: '9999px',
    },
    boxShadow: {
      card: '0 2px 8px rgba(0,0,0,0.06)',
      'card-hover': '0 4px 16px rgba(0,0,0,0.08)',
      none: 'none',
    },
    extend: {},
  },
  plugins: [],
}

export default config
