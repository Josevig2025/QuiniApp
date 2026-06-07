/**
 * components/ui/GapBadge.jsx
 * Badge de atraso con color semáforo.
 * Verde < 20 | Ámbar 20–100 | Rojo > 100
 */
export default function GapBadge({ value, className = '' }) {
  if (value == null) return null

  const color =
    value <= 20  ? 'text-green-400' :
    value <= 100 ? 'text-amber-400' :
                   'text-red-400'

  const bg =
    value <= 20  ? 'bg-green-400/10' :
    value <= 100 ? 'bg-amber-400/10' :
                   'bg-red-400/10'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-mono-custom ${color} ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
      {value}
    </span>
  )
}
