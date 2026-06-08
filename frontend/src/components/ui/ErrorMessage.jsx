/**
 * components/ui/ErrorMessage.jsx
 * Muestra errores de API con opción de reintentar.
 */
import { AlertTriangle } from 'lucide-react'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertTriangle className="w-10 h-10 text-amber-400 opacity-80" />
      <p className="text-secondary text-sm max-w-xs">
        {message || 'No se pudo conectar con el servidor.'}
      </p>
      {onRetry && (
        <button className="btn-ghost text-sm mt-1" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}
