/**
 * components/quiniela/SorteoViewer.jsx
 * Panel del sorteo con navegación y selector de fecha tipo calendario.
 */
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { getSorteo, getSorteoPorFecha } from '../../api/quiniela'

function posColor(pos) {
  if (pos === 0) return { bg: 'rgba(0,229,255,0.2)',  text: 'var(--accent-cyan)',   border: 'rgba(0,229,255,0.5)' }
  if (pos <= 4)  return { bg: 'rgba(0,229,255,0.09)', text: 'var(--accent-cyan)',   border: 'rgba(0,229,255,0.25)' }
  if (pos <= 9)  return { bg: 'rgba(255,107,53,0.1)', text: 'var(--accent-ember)',  border: 'rgba(255,107,53,0.3)' }
  return               { bg: 'var(--bg-elevated)',   text: 'var(--text-secondary)', border: 'var(--border)' }
}

function NumCell({ numero, pos, cifras, onClick }) {
  const c = posColor(pos)
  const reducido = cifras === 3 ? numero
    : cifras === 2 ? String(parseInt(numero) % 100).padStart(2, '0')
    : String(parseInt(numero) % 10)
  return (
    <button
      onClick={() => onClick(reducido)}
      className="flex flex-col items-center gap-0.5 rounded-xl py-2 px-1 transition-all hover:scale-105 active:scale-95"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
      title={`Posición ${pos + 1}°`}
    >
      <span className="text-xs text-muted font-mono-custom">{pos + 1}°</span>
      <span className="font-display font-bold text-xl leading-none" style={{ color: c.text }}>
        {reducido}
      </span>
    </button>
  )
}

function ViewerSkeleton() {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      <div className="skeleton h-8 w-40 rounded mx-auto" />
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function SorteoViewer({ totalSorteos, cifras = 2, onNumeroClick, onVerUltimo }) {
  const [idx,     setIdx]     = useState(null)
  const [sorteo,  setSorteo]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const cargarPorIdx = useCallback(async (i) => {
    setLoading(true)
    setError(null)
    try {
      const r = await getSorteo(i)
      setSorteo(r.data)
      setIdx(i)
    } catch {
      setError('No se pudo cargar el sorteo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (totalSorteos != null) cargarPorIdx(totalSorteos - 1)
  }, [totalSorteos]) // eslint-disable-line

  const buscarPorFecha = async (fechaISO) => {
    if (!fechaISO) return
    setLoading(true)
    setError(null)
    try {
      const r = await getSorteoPorFecha(fechaISO)
      if (r.data.sorteos?.length > 0) {
        const ultimo = r.data.sorteos[r.data.sorteos.length - 1]
        setSorteo(ultimo)
        setIdx(ultimo.idx)
      } else {
        setError('Sin sorteos para esa fecha')
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Fecha no encontrada')
    } finally {
      setLoading(false)
    }
  }

  const irUltimo = () => { if (totalSorteos) cargarPorIdx(totalSorteos - 1) }
  const esUltimo = idx === totalSorteos - 1

  // Formatear fecha para mostrar
  const fechaMostrar = sorteo?.fecha
    ? sorteo.fecha.replace(/(\d{2})\/(\d{2})\/(\d{2})/, (_, d, m, y) => `${d}/${m}/20${y}`)
    : '—'

  // Fecha en formato YYYY-MM-DD para el input date
  const fechaISO = sorteo?.fecha
    ? (() => {
        const [d, m, y] = sorteo.fecha.split('/')
        return `20${y}-${m}-${d}`
      })()
    : ''

  return (
    <div className="p-3 space-y-3">

      {/* Cabecera: flechas + fecha grande + turno */}
      <div className="flex items-center gap-2">
        <button onClick={() => idx > 0 && cargarPorIdx(idx - 1)}
          disabled={!idx || idx === 0}
          className="btn-ghost p-2 rounded-xl flex-shrink-0 disabled:opacity-25">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 text-center">
          {/* Título clicable para volver al último */}
          <button
            onClick={irUltimo}
            className="group flex flex-col items-center w-full"
            title={esUltimo ? 'Este es el último sorteo' : 'Ir al último sorteo'}
          >
            <span
              className="font-display font-black leading-none transition-all"
              style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                color: esUltimo ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              }}
            >
              {fechaMostrar}
            </span>
            <span className="text-xs text-muted mt-0.5 capitalize flex items-center gap-1.5">
              {sorteo?.turno?.toLowerCase() || '—'}
              {idx != null && totalSorteos && (
                <span className="opacity-40 font-mono-custom">
                  #{idx + 1}/{totalSorteos}
                </span>
              )}
              {!esUltimo && (
                <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--accent-cyan)' }}>
                  ↩ volver al último
                </span>
              )}
            </span>
          </button>
        </div>

        <button onClick={() => idx < totalSorteos - 1 && cargarPorIdx(idx + 1)}
          disabled={esUltimo}
          className="btn-ghost p-2 rounded-xl flex-shrink-0 disabled:opacity-25">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Números */}
      {loading ? <ViewerSkeleton /> : error ? (
        <p className="text-xs text-center py-4" style={{ color: 'var(--gap-high)' }}>{error}</p>
      ) : sorteo ? (
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {sorteo.nums.map((n, i) => (
            <NumCell key={i} numero={n} pos={i} cifras={cifras} onClick={onNumeroClick} />
          ))}
        </div>
      ) : null}

      {/* Leyenda + selector de fecha */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {[
            { label: '1°',      bg: 'rgba(0,229,255,0.2)',  border: 'rgba(0,229,255,0.5)' },
            { label: '2°–5°',   bg: 'rgba(0,229,255,0.09)', border: 'rgba(0,229,255,0.25)' },
            { label: '6°–10°',  bg: 'rgba(255,107,53,0.1)', border: 'rgba(255,107,53,0.3)' },
            { label: '11°–20°', bg: 'var(--bg-elevated)',   border: 'var(--border)' },
          ].map(({ label, bg, border }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: bg, border: `1px solid ${border}` }} />
              <span className="text-xs text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* Selector de fecha tipo calendario */}
        <input
          type="date"
          value={fechaISO}
          onChange={e => buscarPorFecha(e.target.value)}
          className="field text-xs py-1 px-2"
          style={{ colorScheme: 'dark', width: 140 }}
          title="Ir a una fecha específica"
        />
      </div>
    </div>
  )
}
