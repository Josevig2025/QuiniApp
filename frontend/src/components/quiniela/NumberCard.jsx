/**
 * components/quiniela/NumberCard.jsx
 * Tarjeta clicable para cada número.
 * Muestra: número (Orbitron), gap actual con semáforo, salidas,
 * mini-sparkline de últimos gaps.
 * Al hacer click navega a /quiniela/numero/:n
 */
import { useNavigate } from 'react-router-dom'

// ── Mini sparkline SVG inline ────────────────────────────────────────
function Sparkline({ gaps = [], color }) {
  if (!gaps || gaps.length < 2) return null

  const W = 56, H = 22
  const max = Math.max(...gaps, 1)
  const pts = gaps.map((g, i) => {
    const x = (i / (gaps.length - 1)) * W
    const y = H - (g / max) * H
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Color semáforo por gap ───────────────────────────────────────────
function gapColor(gap) {
  if (gap == null) return { text: 'text-secondary', spark: '#8B98B8', ring: '' }
  if (gap <= 20)   return { text: 'text-green-400',  spark: '#22C55E', ring: 'hover:border-green-400/40'  }
  if (gap <= 100)  return { text: 'text-amber-400',  spark: '#F59E0B', ring: 'hover:border-amber-400/40' }
  return               { text: 'text-red-400',    spark: '#EF4444', ring: 'hover:border-red-400/40'   }
}

// ── Componente principal ─────────────────────────────────────────────
export default function NumberCard({
  numero,        // string, ej: "07"
  salidas,
  gap_actual,
  gap_promedio,
  ultimos_gaps = [],
  cifras = 2,
  animDelay = 0, // ms para stagger de entrada
  compact = false,
}) {
  const navigate = useNavigate()
  const { text, spark, ring } = gapColor(gap_actual)

  const handleClick = () => {
    navigate(`/quiniela/numero/${numero}`, { state: { cifras } })
  }

  if (compact) {
    // Versión compacta para grids densos
    return (
      <button
        onClick={handleClick}
        className={`card-clickable flex flex-col items-center justify-center p-2 gap-0.5 border border-transparent ${ring} animate-fade-up`}
        style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'both', minWidth: 0 }}
        title={`Gap actual: ${gap_actual} | Salidas: ${salidas}`}
      >
        <span className="font-display text-base font-bold text-primary" style={{ color: 'var(--text-primary)' }}>
          {numero}
        </span>
        <span className={`text-xs font-semibold font-mono-custom ${text}`}>
          {gap_actual ?? '—'}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`card-clickable flex flex-col p-3 gap-2 border border-transparent ${ring} animate-fade-up`}
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'both' }}
    >
      {/* Número grande */}
      <div className="flex items-start justify-between w-full">
        <span
          className="font-display text-2xl font-bold leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          {numero}
        </span>
        {/* Indicador de gap (punto + valor) */}
        <div className={`flex items-center gap-1 ${text}`}>
          <span className={`w-2 h-2 rounded-full ${text.replace('text-', 'bg-')}`} />
          <span className="text-xs font-mono-custom font-semibold">
            {gap_actual ?? '—'}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="flex justify-center w-full">
        <Sparkline gaps={ultimos_gaps.slice(-8)} color={spark} />
      </div>

      {/* Salidas */}
      <div className="flex justify-between w-full">
        <span className="text-xs text-muted">Salidas</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {salidas}
        </span>
      </div>
    </button>
  )
}
