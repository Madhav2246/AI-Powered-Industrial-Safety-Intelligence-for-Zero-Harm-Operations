/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aegis: {
          bg:        '#0a0d14',
          surface:   '#0f1420',
          card:      '#141b2d',
          border:    '#1e2a42',
          muted:     '#2a3650',
          primary:   '#3b82f6',
          secondary: '#8b5cf6',
          accent:    '#06b6d4',
          success:   '#10b981',
          warning:   '#f59e0b',
          danger:    '#ef4444',
          critical:  '#dc2626',
          text:      '#e2e8f0',
          subtext:   '#94a3b8',
        },
        risk: {
          low:      '#10b981',
          medium:   '#f59e0b',
          high:     '#f97316',
          critical: '#ef4444',
          extreme:  '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-spin': 'spin 4s linear infinite',
      }
    },
  },
  plugins: [],
}
