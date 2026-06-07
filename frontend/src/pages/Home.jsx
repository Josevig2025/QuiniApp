/**
 * pages/Home.jsx
 * Pantalla de inicio: selector de juego con tarjetas grandes.
 */
import { useNavigate, Link } from 'react-router-dom'
import { BarChart2, Dices, Layers } from 'lucide-react'

const JUEGOS = [
  {
    id:       'quiniela',
    to:       '/quiniela',
    label:    'Quiniela',
    sub:      'Análisis de números 00–999',
    Icon:     BarChart2,
    accent:   'var(--accent-cyan)',
    bg:       'rgba(0,229,255,0.06)',
    border:   'rgba(0,229,255,0.2)',
    ready:    true,
  },
  {
    id:       'tombola',
    to:       '/tombola',
    label:    'Tómbola',
    sub:      'Combinaciones de 3 a 7 números',
    Icon:     Dices,
    accent:   'var(--accent-ember)',
    bg:       'rgba(255,107,53,0.06)',
    border:   'rgba(255,107,53,0.2)',
    ready:    true,
  },
  {
    id:       'redoblona',
    to:       '/redoblona',
    label:    'Redoblona',
    sub:      'Pares de números en el mismo sorteo',
    Icon:     Layers,
    accent:   '#A78BFA',
    bg:       'rgba(167,139,250,0.06)',
    border:   'rgba(167,139,250,0.2)',
    ready:    true,
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-24 md:pb-10 flex flex-col items-center gap-8">

      {/* Logo / titulo */}
      <div className="text-center space-y-2 animate-fade-up">
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-wider" style={{ color: 'var(--text-primary)' }}>
          QUINI<span style={{ color: 'var(--accent-cyan)' }}>APP</span>
        </h1>
        <p className="text-secondary text-sm">
          Estadística de Quiniela y Tómbola · Uruguay
        </p>
      </div>

      {/* Cards de juego */}
      <div className="w-full space-y-3">
        {JUEGOS.map(({ id, to, label, sub, Icon, accent, bg, border, ready }, i) => (
          <button
            key={id}
            onClick={() => ready && navigate(to)}
            disabled={!ready}
            className="w-full text-left rounded-2xl p-5 flex items-center gap-4 transition-all animate-fade-up"
            style={{
              background:     bg,
              border:         `1px solid ${border}`,
              animationDelay: `${i * 80}ms`,
              animationFillMode: 'both',
              opacity: ready ? 1 : 0.5,
              cursor: ready ? 'pointer' : 'not-allowed',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${accent}18` }}
            >
              <Icon className="w-6 h-6" style={{ color: accent }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {label}
                </p>
                {!ready && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: accent + '22', color: accent }}
                  >
                    Pronto
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary truncate">{sub}</p>
            </div>

            {ready && (
              <span className="text-2xl text-muted flex-shrink-0">›</span>
            )}
          </button>
        ))}
      </div>

      {/* Footer disclaimer */}
      <div className="text-center space-y-2">
        <p className="text-xs text-muted max-w-xs leading-relaxed mx-auto">
          Esta app muestra estadísticas históricas con fines informativos.
          El azar no puede predecirse. Jugá con responsabilidad.
        </p>
        <Link to="/configuracion"
          className="text-xs hover:underline transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}>
          Acerca de QuiniApp · Disclaimer ›
        </Link>
      </div>
    </div>
  )
}
