/**
 * components/ui/StatPanel.jsx
 * Panel de estadística individual.
 * Muestra un valor grande con título y subtítulo opcionales.
 */
import GapBadge from './GapBadge'

export default function StatPanel({
  titulo,
  valor,
  subtitulo,
  acento = false,    // si true, colorea el valor con accent-cyan
  esGap  = false,    // si true, usa GapBadge en lugar de texto plano
  animDelay = 0,
}) {
  return (
    <div
      className="card p-4 flex flex-col gap-1 animate-fade-up"
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'both' }}
    >
      <p className="text-xs text-muted uppercase tracking-wider">{titulo}</p>

      {esGap ? (
        <GapBadge value={valor} className="text-lg px-3 py-1 self-start mt-0.5" />
      ) : (
        <p
          className="font-display text-2xl font-bold leading-tight"
          style={{ color: acento ? 'var(--accent-cyan)' : 'var(--text-primary)' }}
        >
          {valor ?? '—'}
        </p>
      )}

      {subtitulo && (
        <p className="text-xs text-secondary leading-snug">{subtitulo}</p>
      )}
    </div>
  )
}
