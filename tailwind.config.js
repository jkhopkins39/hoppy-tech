/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // CSS-variable-based tokens (theme-aware)
        canvas:    'var(--canvas)',
        surface:   { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
        ink:       'var(--ink)',
        muted:     { DEFAULT: 'var(--muted)', 2: 'var(--muted-2)', 3: 'var(--muted-3)' },
        accent:    { DEFAULT: 'var(--accent)', light: 'var(--accent-light)' },
        // Keep amber alias mapped to Picton Blue for any legacy Tailwind classes
        amber: {
          glow:    '#FFB703',
          DEFAULT: '#FB8500',
          light:   '#FFB703',
          dark:    '#E67700',
        },
      },
      maxHeight: {
        'screen-mid': '800px',
        'screen-sm': '600px',
        'screen-md': '700px',
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease-out forwards',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-right':'slideRight 0.3s ease-out forwards',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
