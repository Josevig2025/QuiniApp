/**
 * pages/Placeholder.jsx
 * Página temporal para rutas aún no implementadas.
 */
import { useNavigate } from 'react-router-dom'
import { Construction } from 'lucide-react'

export default function Placeholder({ titulo = 'En construcción' }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <Construction className="w-12 h-12 text-amber-400 opacity-70" />
      <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {titulo}
      </h2>
      <p className="text-secondary text-sm max-w-xs">
        Esta sección estará disponible próximamente.
      </p>
      <button className="btn-ghost" onClick={() => navigate(-1)}>
        ← Volver
      </button>
    </div>
  )
}
