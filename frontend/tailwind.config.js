/** @type {import('tailwindcss').Config} */
export default {
  // Activar modo oscuro por clase (lo maneja ThemeContext)
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ── Paleta QuiniApp ──────────────────────────────────────────────
      colors: {
        // Dark mode base
        ink: {
          950: '#080A0F',
          900: '#0D0F14',
          800: '#131620',
          700: '#161A22',
          600: '#1C2130',
          500: '#252D3D',
          400: '#2E3850',
        },
        // Acento cyan eléctrico
        cyan: {
          DEFAULT: '#00E5FF',
          dim:     '#00B8CC',
          glow:    'rgba(0,229,255,0.18)',
          pulse:   'rgba(0,229,255,0.08)',
        },
        // Acento naranja (alertas, hot numbers)
        ember: {
          DEFAULT: '#FF6B35',
          dim:     '#CC5228',
          glow:    'rgba(255,107,53,0.18)',
        },
        // Semáforo gaps
        gap: {
          low:    '#22C55E',   // verde  — gap < 20
          mid:    '#F59E0B',   // ámbar  — gap 20–100
          high:   '#EF4444',   // rojo   — gap > 100
        },
        // Texto
        ink_text: {
          primary:   '#F0F4FF',
          secondary: '#8B98B8',
          muted:     '#4B5675',
        },
      },

      // ── Tipografía ───────────────────────────────────────────────────
      fontFamily: {
        // Usan variables CSS para que ConfigContext pueda cambiarlas dinámicamente
        display: ['var(--font-display)', '"Orbitron"', 'monospace'],
        body:    ['var(--font-body)',    '"DM Sans"',  'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      // ── Sombras con glow ─────────────────────────────────────────────
      boxShadow: {
        'cyan-glow':  '0 0 20px rgba(0,229,255,0.25), 0 0 60px rgba(0,229,255,0.08)',
        'ember-glow': '0 0 20px rgba(255,107,53,0.25)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },

      // ── Animaciones ──────────────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,229,255,0.2)' },
          '50%':      { boxShadow: '0 0 24px rgba(0,229,255,0.5)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'number-pop': {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.4s ease forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.6s linear infinite',
        'number-pop': 'number-pop 0.35s cubic-bezier(.34,1.56,.64,1) forwards',
      },
    },
  },
  plugins: [],
}
