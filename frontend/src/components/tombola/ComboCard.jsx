/**
 * components/tombola/ComboCard.jsx
 * Tarjeta clicable para una combinación de Tómbola.
 * Muestra los números, gap actual con semáforo, salidas y score.
 */
import GapBadge from '../ui/GapBadge'

export default function ComboCard({ combo, salidas, gap_actual, gap_promedio, score, onClick, animDelay = 0 }) {
  const accentColor =
    gap_actual <= 20  ? '#22C55E' :
    gap_actual <= 100 ? '#F59E0B' : '#EF4444'

  return (
    <button
      onClick={onClick}
      className="card-clickable w-full p-3 text-left space-y-2 animate-fade-up"
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'both' }}
    >
      {/* Números */}
      <div className="flex flex-wrap gap-1.5">
        {combo.map(n => (
          <span
            key={n}
            className="font-display font-bold text-sm px-2 py-0.5 rounded-lg"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >
            {String(n).padStart(2, '0')}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-muted">Gap</p>
            <GapBadge value={gap_actual} />
          </div>
          <div>
            <p className="text-xs text-muted">Salidas</p>
            <p className="font-mono-custom text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {salidas}
            </p>
          </div>
          {score != null && (
            <div>
              <p className="text-xs text-muted">Score</p>
              <p className="font-mono-custom text-sm font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                {score}
              </p>
            </div>
          )}
        </div>
        <span className="text-muted text-sm">›</span>
      </div>
    </button>
  )
}
