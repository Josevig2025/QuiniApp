/**
 * components/quiniela/SorteoModal.jsx
 * Modal que muestra un sorteo completo cuando el usuario hace click en una fecha.
 */
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function SorteoModal({ sorteo, cifras = 2, onClose }) {
  // Cerrar con Escape
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  if (!sorteo) return null

  function reducir(n) {
    const num = parseInt(n)
    if (cifras === 3) return String(num).padStart(3, '0')
    if (cifras === 2) return String(num % 100).padStart(2, '0')
    return String(num % 10)
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="card w-full max-w-sm p-5 animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-display text-lg text-accent">{sorteo.fecha}</p>
            <p className="text-xs text-muted capitalize">{sorteo.turno?.toLowerCase()}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grid de 20 números */}
        <div className="grid grid-cols-5 gap-2">
          {sorteo.nums.map((n, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-muted">{i + 1}°</span>
              <span
                className="font-display text-base font-bold w-full text-center py-1.5 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >
                {reducir(n)}
              </span>
            </div>
          ))}
        </div>

        <button className="btn-ghost w-full mt-4 text-sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
