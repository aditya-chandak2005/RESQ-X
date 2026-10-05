/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#070b14',
          panel: '#0e1626',
          card: '#141e34',
          border: '#1e2c4a',
          hover: '#243456',
          text: '#f1f5f9',
          muted: '#8b9bb4',
        },
        emergency: {
          critical: '#ef4444',
          criticalGlow: 'rgba(239, 68, 68, 0.25)',
          high: '#f97316',
          medium: '#eab308',
          low: '#22c55e',
          info: '#06b6d4',
          flood: '#38bdf8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'hud': '0 0 15px rgba(0, 240, 255, 0.1)',
        'alert': '0 0 20px rgba(239, 68, 68, 0.3)',
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'spin 4s linear infinite',
      }
    },
  },
  plugins: [],
}
