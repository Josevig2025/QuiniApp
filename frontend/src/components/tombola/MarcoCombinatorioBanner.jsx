/**
 * components/tombola/MarcoCombinatorioBanner.jsx
 * Banner educativo con marco combinatorio correcto.
 */
import { Info } from 'lucide-react'

export default function MarcoCombinatorioBanner({ marco, loading }) {
  if (loading) return <div className="skeleton rounded-xl h-32" />
  if (!marco)  return null

  const {
    k, total_teorico, cobertura_x_sorteo,
    cobertura_real, veces_esperadas,
    combos_unicas_vistas, cobertura_unica,
    metodo, mensaje, n_sorteos, fecha_desde, fecha_hasta,
  } = marco

  const cubierto100 = cobertura_real >= 100

  // Stats según k
  const stats = [
    {
      label: `C(100,${k}) posibles`,
      valor: total_teorico?.toLocaleString('es-UY'),
      sub:   'combinaciones teóricas',
    },
    {
      label: 'Cubre 1 sorteo',
      valor: `${cobertura_x_sorteo}%`,
      sub:   'del espacio total',
      color: 'var(--accent-ember)',
    },
    {
      label: 'Veces esperadas',
      valor: veces_esperadas >= 1 ? `${veces_esperadas}×` : `${(veces_esperadas*100).toFixed(2)}%`,
      sub:   veces_esperadas >= 1 ? 'cada combo en promedio' : 'prob. de aparecer',
      color: veces_esperadas >= 1 ? 'var(--accent-cyan)' : undefined,
    },
    combos_unicas_vistas != null
      ? {
          label:  'Únicas observadas',
          valor:  `${cobertura_unica?.toFixed(1)}%`,
          sub:    `${combos_unicas_vistas?.toLocaleString('es-UY')} combos (${metodo})`,
          color:  cubierto100 ? 'var(--accent-cyan)' : undefined,
        }
      : {
          label:  'Cobertura esperada',
          valor:  cubierto100 ? '100%' : `${cobertura_real?.toFixed(1)}%`,
          sub:    `Espacio ${cubierto100 ? 'cubierto' : 'parcial'} (${metodo})`,
          color:  cubierto100 ? 'var(--accent-cyan)' : 'var(--accent-ember)',
        },
  ]

  return (
    <div
      className="rounded-xl p-4 space-y-3 animate-fade-up"
      style={{
        background:  'rgba(255,107,53,0.06)',
        border:      '1px solid rgba(255,107,53,0.25)',
        borderLeft:  '4px solid var(--accent-ember)',
      }}
    >
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-ember)' }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-ember)' }}>
          Marco Combinatorio — {k} números
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, valor, sub, color }) => (
          <div key={label} className="rounded-lg p-3" style={{ background: 'var(--bg-card)' }}>
            <p className="text-xs text-muted mb-0.5">{label}</p>
            <p className="font-display font-bold text-lg leading-tight"
              style={{ color: color || 'var(--text-primary)' }}>
              {valor ?? '—'}
            </p>
            <p className="text-xs text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-secondary leading-relaxed italic">{mensaje}</p>
    </div>
  )
}
