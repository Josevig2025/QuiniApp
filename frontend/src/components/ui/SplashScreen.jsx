/**
 * components/ui/SplashScreen.jsx
 * Pantalla de bienvenida — aparece una vez por día.
 * Se cierra sola a los 4 segundos o al hacer click.
 * Muestra mensaje de juego responsable y línea de ayuda.
 */
import { useEffect, useState } from 'react'

const HOY = new Date().toDateString()
const STORAGE_KEY = 'quiniapp-splash-last'

export default function SplashScreen() {
  const [visible,  setVisible]  = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [progreso, setProgreso] = useState(0)

  useEffect(() => {
    // Mostrar solo si no se mostró hoy
    const ultima = localStorage.getItem(STORAGE_KEY)
    if (ultima !== HOY) {
      setVisible(true)
      localStorage.setItem(STORAGE_KEY, HOY)
    }
  }, [])

  useEffect(() => {
    if (!visible) return

    // Barra de progreso
    const intervalo = setInterval(() => {
      setProgreso(p => {
        if (p >= 100) {
          clearInterval(intervalo)
          cerrar()
          return 100
        }
        return p + 2.5   // 100 / 2.5 = 40 pasos × 100ms = 4000ms
      })
    }, 100)

    return () => clearInterval(intervalo)
  }, [visible]) // eslint-disable-line

  const cerrar = () => {
    setCerrando(true)
    setTimeout(() => setVisible(false), 400)
  }

  if (!visible) return null

  return (
    <div
      onClick={cerrar}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 cursor-pointer"
      style={{
        background: 'rgba(8,10,15,0.97)',
        backdropFilter: 'blur(12px)',
        opacity:    cerrando ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div
        className="w-full max-w-sm space-y-6 animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-display text-xl font-black text-black"
            style={{ background: 'var(--accent-cyan)' }}>
            Q
          </div>
          <span className="font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
            QUINI<span style={{ color: 'var(--accent-cyan)' }}>APP</span>
          </span>
        </div>

        {/* Mensaje principal */}
        <div className="rounded-2xl p-5 space-y-3 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Bienvenido a QuiniApp Uruguay
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Esta app muestra <strong>estadísticas históricas</strong> de Quiniela y Tómbola
            con fines informativos y de entretenimiento.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            El azar <strong>no puede predecirse</strong>. Los datos del pasado no garantizan
            resultados futuros. Cada sorteo es un evento independiente.
          </p>

          {/* Línea de ayuda destacada */}
          <div className="rounded-xl p-3 mt-2"
            style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)' }}>
            <p className="text-xs" style={{ color: 'var(--accent-ember)' }}>
              ⚠ Si el juego deja de ser entretenimiento, buscá ayuda
            </p>
            <p className="font-display font-bold text-lg mt-1" style={{ color: 'var(--accent-ember)' }}>
              0800 4444
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Línea gratuita de ayuda — disponible las 24hs
            </p>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sin vínculo con la banca de quinielas ni con la DNLQ.
          </p>
        </div>

        {/* Barra de progreso + botón */}
        <div className="space-y-3">
          {/* Barra */}
          <div className="h-1 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progreso}%`,
                background: 'var(--accent-cyan)',
              }}
            />
          </div>

          <button
            onClick={cerrar}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-98"
            style={{ background: 'var(--accent-cyan)', color: '#000' }}
          >
            Entendido — Ingresar
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Se cierra automáticamente · Click en cualquier lugar para continuar
          </p>
        </div>
      </div>
    </div>
  )
}
