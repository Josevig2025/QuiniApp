/**
 * pages/Configuracion.jsx
 * Pantalla de configuración de apariencia.
 * Tipografía, paleta de colores y tema dark/light.
 */
import { useTheme }  from '../context/ThemeContext'
import { useConfig, TIPOGRAFIAS, PALETAS } from '../context/ConfigContext'
import { Sun, Moon, Type, Palette, Check } from 'lucide-react'

// ── Tarjeta de opción seleccionable ──────────────────────────────────
function OpcionCard({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full text-left rounded-xl p-4 transition-all border"
      style={{
        background:   activo ? 'rgba(0,229,255,0.08)' : 'var(--bg-card)',
        borderColor:  activo ? 'var(--accent-cyan)'   : 'var(--border)',
        boxShadow:    activo ? '0 0 0 1px var(--accent-cyan)' : 'none',
      }}
    >
      {activo && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent-cyan)' }}>
          <Check className="w-3 h-3 text-black" />
        </div>
      )}
      {children}
    </button>
  )
}

// ── Muestra de tipografía ─────────────────────────────────────────────
function MuestraTipografia({ tip }) {
  return (
    <div>
      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)', fontFamily: tip.body }}>
        {tip.label}
        <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
          {tip.sub}
        </span>
      </p>
      <p className="text-2xl font-bold" style={{ fontFamily: tip.display, color: 'var(--accent-cyan)' }}>
        07 23 45 89
      </p>
      <p className="text-xs mt-1" style={{ fontFamily: tip.body, color: 'var(--text-secondary)' }}>
        Gap actual · Salidas · Ranking de atrasos
      </p>
    </div>
  )
}

// ── Muestra de paleta ─────────────────────────────────────────────────
function MuestraPaleta({ pal }) {
  return (
    <div className="flex items-center gap-3">
      {/* Círculos de colores */}
      <div className="flex gap-1.5">
        {pal.preview.map((color, i) => (
          <div key={i} className="w-6 h-6 rounded-full border"
            style={{ background: color, borderColor: 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          {pal.label}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pal.sub}</p>
      </div>
    </div>
  )
}

export default function Configuracion() {
  const { isDark, toggle } = useTheme()
  const { tipografia, setTipografia, paleta, setPaleta } = useConfig()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Configuración
        </h1>
        <p className="text-xs text-muted mt-1">Personalizá la apariencia de QuiniApp</p>
      </div>

      {/* ── Tema ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Tema
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <OpcionCard activo={isDark} onClick={() => !isDark && toggle()}>
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Oscuro</p>
                <p className="text-xs text-muted">Modo nocturno</p>
              </div>
            </div>
          </OpcionCard>
          <OpcionCard activo={!isDark} onClick={() => isDark && toggle()}>
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Claro</p>
                <p className="text-xs text-muted">Modo diurno</p>
              </div>
            </div>
          </OpcionCard>
        </div>
      </section>

      {/* ── Tipografía ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Tipografía
          </h2>
        </div>
        <div className="space-y-2">
          {Object.values(TIPOGRAFIAS).map(tip => (
            <OpcionCard key={tip.id} activo={tipografia === tip.id} onClick={() => setTipografia(tip.id)}>
              <MuestraTipografia tip={tip} />
            </OpcionCard>
          ))}
        </div>
        <p className="text-xs text-muted px-1">
          La tipografía "Legible" usa Inter en todos los elementos — ideal para personas con dificultad visual.
        </p>
      </section>

      {/* ── Paleta de colores ────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Paleta de colores
          </h2>
        </div>
        <div className="space-y-2">
          {Object.values(PALETAS).map(pal => (
            <OpcionCard key={pal.id} activo={paleta === pal.id} onClick={() => setPaleta(pal.id)}>
              <MuestraPaleta pal={pal} />
            </OpcionCard>
          ))}
        </div>
        <p className="text-xs text-muted px-1">
          Los colores afectan acentos, badges y elementos interactivos en toda la app.
        </p>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────────── */}
      <section className="rounded-xl p-4 space-y-2"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Acerca de QuiniApp
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Esta aplicación muestra estadísticas históricas de sorteos de Quiniela y Tómbola de Uruguay
          con fines exclusivamente informativos y de entretenimiento.
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Los datos provienen de fuentes oficiales de acceso público. Esta aplicación no tiene
          ningún vínculo con la banca de quinielas ni con la Dirección Nacional de Loterías
          y Quinielas (DNLQ). Ante cualquier duda sobre un resultado, consultá el sitio oficial.
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          El azar no puede predecirse. El análisis estadístico describe el pasado, no el futuro.
          Si el juego deja de ser entretenimiento, buscá ayuda: <strong>línea 0800 4444</strong>.
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          QuiniApp no promueve el juego ni se responsabiliza por el uso que se haga de la información.
        </p>
      </section>
    </div>
  )
}
