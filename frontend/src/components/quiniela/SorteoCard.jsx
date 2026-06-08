/**
 * components/quiniela/SorteoCard.jsx
 * Fila de sorteo clicable.
 * Al hacer click emite onSelect(idx) para que el padre muestre el sorteo completo.
 */
export default function SorteoCard({ sorteo, cifras = 3, onSelect, highlighted = false }) {
  const { idx, fecha, turno, nums } = sorteo

  // Reducir números a las cifras pedidas para mostrar
  function reducir(n) {
    const num = parseInt(n)
    if (cifras === 3) return String(num).padStart(3, '0')
    if (cifras === 2) return String(num % 100).padStart(2, '0')
    return String(num % 10)
  }

  const reducidos = nums.slice(0, 5).map(reducir)  // mostrar solo 5 en la fila compacta

  return (
    <button
      onClick={() => onSelect?.(idx)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
        ${highlighted
          ? 'bg-cyan-DEFAULT/10 border border-cyan-DEFAULT/30'
          : 'hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border)]'
        }`}
    >
      {/* Fecha + turno */}
      <div className="flex-shrink-0 w-28">
        <p className="text-xs font-mono-custom text-accent">{fecha}</p>
        <p className="text-xs text-muted capitalize">{turno.toLowerCase()}</p>
      </div>

      {/* Primeros 5 números */}
      <div className="flex gap-1.5 flex-1 flex-wrap">
        {reducidos.map((n, i) => (
          <span
            key={i}
            className="text-xs font-mono-custom font-semibold px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            {n}
          </span>
        ))}
        <span className="text-xs text-muted self-center">…</span>
      </div>

      {/* Ícono de flecha */}
      <span className="text-muted text-xs flex-shrink-0">›</span>
    </button>
  )
}
