/**
 * pages/tombola/TombolaMain.jsx
 * Fixes:
 * - Fecha sin hora
 * - Bolillas todas iguales (sin destacar por posición)
 * - Analizador: números 00-99, inputs grandes, stats reactivos por número individual
 * - Resultados combo desde 1 número en adelante
 * - Laboratorio con filtros temporales
 * - Links de navegación
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Dices, TrendingUp, FlaskConical, DollarSign,
  AlertTriangle, ChevronLeft, ChevronRight, BarChart2,
  ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react'

import MarcoCombinatorioBanner from '../../components/tombola/MarcoCombinatorioBanner'
import ComboCard               from '../../components/tombola/ComboCard'
import ErrorMessage            from '../../components/ui/ErrorMessage'
import { SkeletonCard }        from '../../components/ui/Skeleton'

import {
  getInfo, getMarco, getRanking, getSugeridas,
  getCombo, getBacktest, getSorteo, getNumero,
} from '../../api/tombola'

// ── Helpers de fecha ──────────────────────────────────────────────────
function limpiarFecha(f) {
  // Quitar hora si viene como "2016-09-20 00:00:00" o similar
  if (!f) return '—'
  const s = String(f).split(' ')[0].split('T')[0]
  // Convertir YYYY-MM-DD a DD/MM/YYYY
  if (s.includes('-')) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  // DD/MM/YY → DD/MM/20YY
  if (s.includes('/')) {
    const [d, m, y] = s.split('/')
    return `${d}/${m}/${y.length === 2 ? '20' + y : y}`
  }
  return s
}

function toISO(f) {
  if (!f) return ''
  const s = String(f).split(' ')[0]
  if (s.includes('-')) return s.substring(0,10)
  const [d, m, y] = s.split('/')
  return `20${y.length===2?y:y.slice(-2)}-${m}-${d}`
}
const HOY = new Date().toISOString().split('T')[0]

// ── Bolilla — todas iguales (sin destacar por posición) ───────────────
function Bolilla({ numero }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-display font-bold select-none"
      style={{
        width:      44,
        height:     44,
        fontSize:   '0.9rem',
        background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-card))',
        color:      'var(--text-primary)',
        border:     '2px solid var(--border)',
        boxShadow:  '0 2px 6px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}
    >
      {String(numero).padStart(2, '0')}
    </div>
  )
}

// ── Sorteo Viewer ─────────────────────────────────────────────────────
function TombolaSorteoViewer({ totalSorteos, minFecha, maxFecha }) {
  const [idx,     setIdx]     = useState(null)
  const [sorteo,  setSorteo]  = useState(null)
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async (i) => {
    setLoading(true)
    try { const r = await getSorteo(i); setSorteo(r.data); setIdx(i) }
    catch {} finally { setLoading(false) }
  }, [])

  const buscarFecha = async (fechaISO) => {
    if (!fechaISO) return
    // Buscar el sorteo más cercano a esa fecha
    setLoading(true)
    try {
      // Buscar linealmente desde el final hacia atrás
      const total = totalSorteos
      for (let i = total - 1; i >= 0; i--) {
        const r = await getSorteo(i)
        const fSorteo = toISO(r.data.fecha)
        if (fSorteo <= fechaISO) {
          setSorteo(r.data); setIdx(i); break
        }
        if (i === 0) { setSorteo(r.data); setIdx(0) }
      }
    } catch {} finally { setLoading(false) }
  }

  // Búsqueda eficiente por fecha usando bisección
  const buscarFechaEficiente = async (fechaISO) => {
    if (!fechaISO || !totalSorteos) return
    setLoading(true)
    try {
      let lo = 0, hi = totalSorteos - 1, found = hi
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2)
        const r = await getSorteo(mid)
        const fMid = toISO(r.data.fecha)
        if (fMid <= fechaISO) { found = mid; lo = mid + 1 }
        else hi = mid - 1
      }
      const r = await getSorteo(found)
      setSorteo(r.data); setIdx(found)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    if (totalSorteos != null) cargar(totalSorteos - 1)
  }, [totalSorteos]) // eslint-disable-line

  const esUltimo = idx === totalSorteos - 1
  const fechaMostrar = limpiarFecha(sorteo?.fecha)
  const fechaInputVal = sorteo?.fecha ? toISO(sorteo.fecha) : ''

  if (loading && !sorteo) return (
    <div className="space-y-3 p-4">
      <div className="skeleton h-8 w-40 rounded mx-auto" />
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({length:20}).map((_,i) => (
          <div key={i} className="skeleton rounded-full" style={{width:44,height:44}} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-3 space-y-3">
      {/* Navegación */}
      <div className="flex items-center gap-2">
        <button onClick={() => idx > 0 && cargar(idx - 1)}
          disabled={!idx || idx === 0}
          className="btn-ghost p-2 rounded-xl disabled:opacity-25">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button onClick={() => cargar(totalSorteos - 1)} className="flex-1 text-center group">
          <p className="font-display font-black leading-none"
            style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', color: esUltimo ? 'var(--accent-ember)' : 'var(--text-secondary)' }}>
            {fechaMostrar}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {sorteo?.turno?.toLowerCase() || '—'}
            {idx != null && <span className="opacity-40 ml-2 font-mono-custom">#{idx+1}/{totalSorteos}</span>}
            {!esUltimo && (
              <span className="ml-2 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--accent-ember)' }}>↩ volver al último</span>
            )}
          </p>
        </button>

        <button onClick={() => idx < totalSorteos - 1 && cargar(idx + 1)}
          disabled={esUltimo} className="btn-ghost p-2 rounded-xl disabled:opacity-25">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bolillas — todas iguales */}
      {sorteo && (
        <div className="flex flex-wrap gap-2 justify-center py-1">
          {sorteo.nums.map((n, i) => <Bolilla key={i} numero={n} />)}
        </div>
      )}

      {/* Selector fecha */}
      <div className="flex justify-end">
        <input type="date" value={fechaInputVal}
          onChange={e => buscarFechaEficiente(e.target.value)}
          min={minFecha} max={maxFecha}
          className="field text-xs py-1"
          style={{ colorScheme: 'dark', width: 140 }}
          title="Ir a una fecha" />
      </div>
    </div>
  )
}

// ── Selector K ────────────────────────────────────────────────────────
function SelectorK({ k, setK }) {
  return (
    <div className="card p-3">
      <p className="text-xs text-muted mb-2 uppercase tracking-wider">Modalidad</p>
      <div className="flex gap-2">
        {[3,4,5,6,7].map(v => (
          <button key={v} onClick={() => setK(v)}
            className="flex-1 py-2.5 rounded-xl font-display font-bold text-lg transition-all"
            style={k===v
              ? { background: 'var(--accent-ember)', color: '#fff' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Tab Ranking ───────────────────────────────────────────────────────
function TabRanking({ k }) {
  const [modo,    setModo]    = useState('frecuencia')
  const [top,     setTop]     = useState(10)
  const [ultN,    setUltN]    = useState(null)
  const [data,    setData]    = useState(null)
  const [aviso,   setAviso]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  // Cargar automáticamente al montar y cuando cambian filtros
  useEffect(() => { setData(null); setAviso(null) }, [k])
  useEffect(() => { cargar() }, [k, top, modo, ultN]) // eslint-disable-line

  const cargar = useCallback(async () => {
    setLoading(true); setError(null); setAviso(null)
    try {
      const params = ultN ? { ultimos_n: ultN } : {}
      const r = await getRanking(k, top, modo, params)
      if (r.data.aviso) { setAviso(r.data.mensaje); setData([]) }
      else { setData(r.data); setSortCol(null) }
    } catch (e) { setError(e.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }, [k, top, modo, ultN])

  // Ordenamiento local por columna
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sortedData = () => {
    if (!data) return []
    if (!sortCol) return data
    return [...data].sort((a, b) => {
      const va = a[sortCol] ?? -Infinity
      const vb = b[sortCol] ?? -Infinity
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 opacity-30 inline ml-1" />
    return sortDir === 'desc'
      ? <ArrowDown className="w-3 h-3 inline ml-1" style={{ color: 'var(--accent-cyan)' }} />
      : <ArrowUp   className="w-3 h-3 inline ml-1" style={{ color: 'var(--accent-cyan)' }} />
  }

  const MODOS = [
    { id: 'frecuencia', label: 'Más frecuentes' },
    { id: 'atrasos',    label: `Más atrasadas${k <= 4 ? ' (últ.1000)' : ''}`, soloK4: true },
  ]

  return (
    <div className="space-y-3">

      {/* Controles — reactivos */}
      <div className="flex flex-wrap gap-2 items-center">
        {MODOS.filter(m => !m.soloK4 || k <= 4).map(m => (
          <button key={m.id}
            onClick={() => setModo(m.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={modo === m.id
              ? { background: 'rgba(255,107,53,0.15)', color: 'var(--accent-ember)', border: '1px solid rgba(255,107,53,0.4)' }
              : { color: 'var(--text-secondary)', border: '1px solid transparent' }}>
            {m.label}
          </button>
        ))}

        <div className="flex gap-1 items-center ml-auto">
          <span className="text-xs text-muted">Top</span>
          {[10, 20, 50].map(n => (
            <button key={n} onClick={() => setTop(n)}
              className="px-2.5 py-1 rounded-lg text-xs transition-all"
              style={top === n
                ? { color: 'var(--accent-cyan)', background: 'rgba(0,229,255,0.1)' }
                : { color: 'var(--text-muted)' }}>
              {n}
            </button>
          ))}
        </div>

        <div className="flex gap-1 items-center">
          <span className="text-xs text-muted">Período:</span>
          <select value={ultN ?? ''} onChange={e => setUltN(e.target.value ? Number(e.target.value) : null)}
            className="field text-xs py-1">
            <option value="">Todo</option>
            <option value="500">Últ. 500</option>
            <option value="1000">Últ. 1000</option>
            <option value="3000">Últ. 3000</option>
          </select>
        </div>
      </div>

      {/* Aviso */}
      {aviso && !loading && (
        <div className="flex items-start gap-2 rounded-xl p-4"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <span className="text-amber-400 text-lg">⚠</span>
          <p className="text-xs text-secondary leading-relaxed">{aviso}</p>
        </div>
      )}

      {error   && <ErrorMessage message={error} onRetry={cargar} />}
      {loading && <SkeletonCard rows={6} />}

      {/* Tabla ordenable */}
      {!loading && sortedData().length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted w-8">#</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted">Combinación</th>
                  {[
                    { label: 'Salidas',   col: 'salidas'      },
                    { label: 'Gap Act.',  col: 'gap_actual'   },
                    { label: 'Gap Máx',   col: 'gap_maximo'   },
                    { label: 'Gap Prom',  col: 'gap_promedio' },
                  ].map(({ label, col }) => (
                    <th key={col}
                      onClick={() => handleSort(col)}
                      className="px-3 py-3 text-left text-xs font-semibold cursor-pointer select-none"
                      style={{ color: sortCol === col ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {label}<SortIcon col={col} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData().map((item, i) => {
                  const gColor = item.gap_actual <= 20 ? '#22C55E'
                    : item.gap_actual <= 100 ? '#F59E0B' : '#EF4444'
                  return (
                    <tr key={item.combo.join('-')}
                      className="hover:bg-[var(--bg-elevated)] transition-colors animate-fade-up"
                      style={{ borderBottom: '1px solid var(--border)', animationDelay: `${i*15}ms`, animationFillMode: 'both' }}>
                      <td className="px-3 py-2.5 text-xs text-muted">{i+1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {item.combo.map(n => (
                            <span key={n} className="font-display font-bold text-sm px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--bg-elevated)', color: 'var(--accent-ember)' }}>
                              {String(n).padStart(2,'0')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono-custom text-secondary">{item.salidas}</td>
                      <td className="px-3 py-2.5 font-mono-custom font-semibold" style={{ color: gColor }}>{item.gap_actual}</td>
                      <td className="px-3 py-2.5 font-mono-custom text-secondary">{item.gap_maximo}</td>
                      <td className="px-3 py-2.5 font-mono-custom text-secondary">{item.gap_promedio}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted text-center py-2">
            Click en encabezado de columna para ordenar
          </p>
        </div>
      )}
    </div>
  )
}


// ── Analizador de combinación reactivo ────────────────────────────────
// ── Numpad tipo calculadora ──────────────────────────────────────────
function Numpad({ onDigit, onClear, onClearAll }) {
  const KEYS = [['7','8','9'],['4','5','6'],['1','2','3'],['C','0','CE']]
  return (
    <div className="rounded-2xl p-3 space-y-1.5 flex-shrink-0"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', width: 152 }}>
      <p className="text-xs text-muted text-center mb-1 uppercase tracking-wider">Teclado</p>
      {KEYS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map(key => {
            const special = key === 'C' || key === 'CE'
            return (
              <button key={key}
                onClick={() => {
                  if (key === 'C') onClear()
                  else if (key === 'CE') onClearAll()
                  else onDigit(key)
                }}
                className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm
                  transition-all active:scale-95 hover:opacity-80"
                style={{
                  background: special ? 'rgba(255,107,53,0.15)' : 'var(--bg-card)',
                  color: special ? 'var(--accent-ember)' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}>
                {key}
              </button>
            )
          })}
        </div>
      ))}
      <p className="text-xs text-muted text-center" style={{ fontSize: '0.65rem' }}>C=borrar · CE=limpiar todo</p>
    </div>
  )
}

function AnalizadorCombo({ filtrosTemporal, inputs: externalInputs, setInputs: externalSetInputs }) {
  const COLS = 7
  const [localInputs, setLocalInputs] = useState(Array(COLS).fill(''))
  const inputs    = externalInputs    ?? localInputs
  const setInputs = externalSetInputs ?? setLocalInputs
  const [stats,   setStats]   = useState(Array(COLS).fill(null))
  const [combo,   setCombo]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [foco,    setFoco]    = useState(0)
  const inputRefs = Array.from({ length: COLS }, (_, i) => React.useRef(null))

  // Usar ref para siempre tener el filtrosTemporal más reciente
  const paramsRef = React.useRef(filtrosTemporal)
  React.useEffect(() => { paramsRef.current = filtrosTemporal }, [filtrosTemporal])
  const params = filtrosTemporal

  const handleInput = async (idx, val) => {
    const clean = val.replace(/\D/g,'').slice(0,2)
    const newInputs = [...inputs]
    newInputs[idx] = clean
    setInputs(newInputs)
    // Avanzar al siguiente cuadro cuando hay 2 dígitos
    if (clean.length === 2 && idx < COLS - 1) {
      setFoco(idx + 1)
      setTimeout(() => inputRefs[idx + 1]?.current?.focus(), 50)
    }

    const num = parseInt(clean)
    const valido = !isNaN(num) && num >= 0 && num <= 99

    const newStats = [...stats]
    if (!clean || !valido) {
      newStats[idx] = null
      setStats(newStats)
    } else {
      // Analizar número individual — tómbola usa 1-100 internamente pero mostramos 00-99
      // Convertir: 00→100, 01→1... 99→99
      try {
        const r = await getNumero(num, paramsRef.current)  // 0 = bolillo 00
        newStats[idx] = { ...r.data, display: clean }
      } catch {
        newStats[idx] = { error: true }
      }
      setStats(newStats)
    }
  }

  // Numpad handlers
  const onDigit = (d) => {
    const cur = inputs[foco] || ''
    if (cur.length < 2) handleInput(foco, cur + d)
  }
  const onClear = () => {
    const cur = inputs[foco] || ''
    if (cur.length > 0) {
      handleInput(foco, cur.slice(0, -1))
    } else if (foco > 0) {
      const prev = foco - 1
      setFoco(prev)
      inputRefs[prev]?.current?.focus()
      handleInput(prev, (inputs[prev] || '').slice(0, -1))
    }
  }
  const onClearAll = () => {
    setInputs(Array(COLS).fill(''))
    setStats(Array(COLS).fill(null))
    setFoco(0)
    setTimeout(() => inputRefs[0]?.current?.focus(), 50)
  }

  // Re-analizar todos los números cuando cambia el filtro temporal
  useEffect(() => {
    const reanalizar = async () => {
      const newStats = [...stats]
      let cambio = false
      for (let idx = 0; idx < inputs.length; idx++) {
        const clean = inputs[idx]
        if (!clean) continue
        const num = parseInt(clean)
        if (isNaN(num) || num < 0 || num > 99) continue
        try {
          const r = await getNumero(num, filtrosTemporal)
          newStats[idx] = { ...r.data, display: clean }
          cambio = true
        } catch {
          newStats[idx] = { error: true }
        }
      }
      if (cambio) setStats(newStats)
    }
    reanalizar()
  }, [filtrosTemporal]) // eslint-disable-line

  // Recalcular combinación cuando cambian los inputs
  useEffect(() => {
    const nums = inputs
      .map(v => { const n = parseInt(v); return isNaN(n) ? null : n })
      .filter(n => n !== null && n >= 0 && n <= 99)
    const unique = [...new Set(nums)]

    if (unique.length < 1) { setCombo(null); return }

    setLoading(true)
    getCombo(unique, filtrosTemporal)
      .then(r => setCombo(r.data))
      .catch(() => setCombo(null))
      .finally(() => setLoading(false))
  }, [inputs, filtrosTemporal]) // eslint-disable-line

  const numIngresados = inputs.filter(v => v !== '').length

  const FILAS = [
    { label: 'Salidas',    key: 'apariciones'  },
    { label: 'Gap actual', key: 'gap_actual'   },
    { label: 'Gap máx',   key: 'gap_maximo'   },
    { label: 'Gap prom',   key: 'gap_promedio' },
  ]

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Ingresá números del <strong>00 al 99</strong> — cada cuadro muestra sus estadísticas individuales.
        La combinación se calcula automáticamente.
      </p>

      {/* Cuadros + Numpad */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 overflow-x-auto pb-2">
          <div style={{ minWidth: 480 }}>

            {/* Row de inputs */}
            <div className="flex gap-2 mb-3">
              <div style={{ width: 72, flexShrink: 0 }} />
              {Array.from({length: COLS}).map((_, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  inputMode="numeric"
                  value={inputs[i]}
                  onChange={e => handleInput(i, e.target.value)}
                  onFocus={() => setFoco(i)}
                  placeholder="—"
                  className="font-display font-bold text-center rounded-xl transition-all"
                  style={{
                    width: 60, height: 60, fontSize: '1.3rem', flexShrink: 0,
                    background: inputs[i] ? 'var(--bg-card)' : 'var(--bg-elevated)',
                    border: foco === i
                      ? '2px solid rgba(255,107,53,0.8)'
                      : inputs[i] ? '2px solid rgba(255,107,53,0.4)' : '2px solid var(--border)',
                    color: inputs[i] ? 'var(--accent-ember)' : 'var(--text-muted)',
                    outline: 'none',
                    boxShadow: foco === i ? '0 0 0 3px rgba(255,107,53,0.15)' : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>

          {/* Filas de estadísticas */}
          {FILAS.map(({ label, key }) => (
            <div key={key} className="flex gap-2 mb-1.5">
              {/* Label */}
              <div className="flex items-center justify-end pr-2" style={{ width: 72, flexShrink: 0 }}>
                <span className="text-xs text-muted text-right leading-tight">{label}</span>
              </div>
              {/* Celdas */}
              {Array.from({length: COLS}).map((_, i) => {
                const s = stats[i]
                const val = s?.[key]
                const color = key === 'gap_actual' && val != null
                  ? (val <= 20 ? '#22C55E' : val <= 100 ? '#F59E0B' : '#EF4444')
                  : 'var(--text-primary)'
                return (
                  <div key={i}
                    className="flex items-center justify-center rounded-lg font-mono-custom font-semibold text-sm"
                    style={{
                      width: 64, height: 36, flexShrink: 0,
                      background: s && !s.error ? 'var(--bg-card)' : 'var(--bg-elevated)',
                      border: `1px solid ${s && !s.error && val != null ? 'var(--border)' : 'transparent'}`,
                      color: val != null ? color : 'var(--text-muted)',
                    }}>
                    {val != null ? val : '—'}
                  </div>
                )
              })}
            </div>
          ))}
          </div>
        </div>

        {/* Numpad al lado */}
        <Numpad onDigit={onDigit} onClear={onClear} onClearAll={onClearAll} />
      </div>

      {/* Resultado combinación */}
      {numIngresados >= 1 && (
        <div className="card p-4 space-y-3 animate-fade-up"
          style={{ borderLeft: '3px solid var(--accent-ember)' }}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Combinación ({numIngresados} número{numIngresados > 1 ? 's' : ''})
          </p>

          {loading && <div className="skeleton h-10 rounded-lg" />}

          {combo && !loading && (
            <>
              <div className="flex flex-wrap gap-2">
                {combo.combo?.map(n => (
                  <span key={n} className="font-display font-bold text-xl px-3 py-1.5 rounded-xl"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--accent-ember)',
                      border: '1px solid rgba(255,107,53,0.3)' }}>
                    {String(n).padStart(2,'0')}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Total salidas', combo.apariciones],
                  ['Gap actual',    combo.gap_actual],
                  ['Gap promedio',  combo.gap_promedio ?? '—'],
                  ['Gap máximo',    combo.gap_maximo  ?? '—'],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-xs text-muted">{label}</p>
                    <p className="font-mono-custom font-bold text-lg"
                      style={{ color: 'var(--text-primary)' }}>{val}</p>
                  </div>
                ))}
              </div>
              {combo.ratio_atraso && (
                <p className="text-xs text-secondary">
                  Ratio atraso/promedio: <strong>{combo.ratio_atraso}×</strong>
                  {combo.ratio_atraso > 1.5 && ' — por encima del promedio histórico'}
                </p>
              )}
            </>
          )}
          {numIngresados >= 1 && !combo && !loading && (
            <p className="text-xs text-muted">Sin apariciones registradas para esta combinación.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Filtros temporales (para Laboratorio) ─────────────────────────────
function FiltrosTemporal({ filtros, setFiltros, minFecha, maxFecha }) {
  const PERIODOS = [
    { value: 'todo', label: 'Todo' }, { value: 'anio', label: 'Últ. año' },
    { value: 'mes',  label: 'Últ. mes' }, { value: 'n', label: 'Últ. N' },
    { value: 'custom', label: 'Fechas' },
  ]
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 items-end p-3 rounded-xl"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div>
        <p className="text-xs text-muted mb-1">Período</p>
        <div className="flex gap-1 flex-wrap">
          {PERIODOS.map(op => (
            <button key={op.value} onClick={() => setFiltros(f => ({...f, rango: op.value}))}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-semibold transition-all border ${
                filtros.rango === op.value
                  ? 'border-cyan-DEFAULT/40 bg-cyan-DEFAULT/15'
                  : 'border-transparent text-muted hover:border-[var(--border)]'
              }`} style={filtros.rango===op.value?{color:'var(--accent-cyan)'}:{}}>
              {op.label}
            </button>
          ))}
        </div>
      </div>
      {filtros.rango === 'n' && (
        <div>
          <p className="text-xs text-muted mb-1">Cantidad</p>
          <input type="number" value={filtros.ultN} min={10} max={10500}
            onChange={e => setFiltros(f => ({...f, ultN: Number(e.target.value)}))}
            className="field w-20 text-xs" />
        </div>
      )}
      {filtros.rango === 'custom' && (
        <div className="flex gap-2 items-end">
          <div>
            <p className="text-xs text-muted mb-1">Desde</p>
            <input type="date" value={filtros.desde} min={minFecha} max={maxFecha}
              onChange={e => setFiltros(f => ({...f, desde: e.target.value}))}
              className="field text-xs py-1" style={{ colorScheme: 'dark', width: 135 }} />
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Hasta</p>
            <input type="date" value={filtros.hastaF} min={minFecha} max={maxFecha}
              onChange={e => setFiltros(f => ({...f, hastaF: e.target.value}))}
              className="field text-xs py-1" style={{ colorScheme: 'dark', width: 135 }} />
          </div>
        </div>
      )}
    </div>
  )
}

function toParamsTombola(filtros) {
  const p = {}
  switch (filtros.rango) {
    case 'anio':   p.ultimos_n = 730;  break  // ~2 años de sorteos diarios
    case 'mes':    p.ultimos_n = 60;   break  // ~2 meses
    case 'n':      p.ultimos_n = filtros.ultN; break
    case 'custom':
      if (filtros.desde)  p.desde       = filtros.desde
      if (filtros.hastaF) p.hasta_fecha = filtros.hastaF
      break
    // 'todo': sin params, usa todo el dataset
  }
  return p
}

// ── Tab Laboratorio ───────────────────────────────────────────────────
function TabLaboratorio({ k, minFecha, maxFecha }) {
  const [subTab,   setSubTab]   = useState('analizador')
  const [filtros,  setFiltros]  = useState({ rango:'todo', ultN:300, desde:'', hastaF:'' })
  // Compartir números entre Analizador y Backtest
  const [inputs,   setInputs]   = useState(Array(7).fill(''))
  const [apuesta,  setApuesta]  = useState(50)
  const [resultado,setResultado]= useState(null)
  const [loadingBT,setLoadingBT]= useState(false)
  const [errorBT,  setErrorBT]  = useState(null)

  const PAGOS = {
    3:{3:60},4:{4:180,3:9},5:{5:900,4:24,3:3},
    6:{6:3600,5:90,4:9,3:1.5},7:{7:12000,6:600,5:30,4:3,3:1}
  }

  // Solo limpiar si k cambia y no hay nada ingresado
  useEffect(() => {
    if (inputs.every(v => v === '')) setResultado(null)
  }, [k]) // eslint-disable-line

  // k libre — detectado desde los inputs, sin vínculo con la modalidad global
  const kLibre = [...new Set(
    inputs.map(v => parseInt(v)).filter(n => !isNaN(n) && n >= 0 && n <= 99)
  )].length

  const parseNums = () => {
    const nums = inputs
      .map(v => { const n = parseInt(v); return isNaN(n) ? null : n })
      .filter(n => n !== null && n >= 0 && n <= 99)
    return [...new Set(nums)]
  }

  const ejecutarBacktest = async () => {
    const nums = parseNums()
    if (nums.length < 2) { setErrorBT('Ingresá al menos 2 números distintos (00–99)'); return }
    setLoadingBT(true); setErrorBT(null); setResultado(null)
    try {
      const r = await getBacktest(nums, apuesta, toParamsTombola(filtros))
      setResultado(r.data)
    } catch (e) { setErrorBT(e.response?.data?.detail || 'Error') }
    finally { setLoadingBT(false) }
  }

  const params = toParamsTombola(filtros)

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
        {[{id:'analizador',label:'Analizar combo'},{id:'backtest',label:'Backtest'}].map(({id,label})=>(
          <button key={id} onClick={() => setSubTab(id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              subTab===id?'text-black':'text-secondary hover:text-primary'
            }`}
            style={subTab===id?{background:'var(--accent-ember)'}:{}}>
            {label}
          </button>
        ))}
      </div>

      {/* Filtros temporales */}
      <FiltrosTemporal filtros={filtros} setFiltros={setFiltros} minFecha={minFecha} maxFecha={maxFecha} />

      {subTab === 'analizador' && <AnalizadorCombo filtrosTemporal={params} inputs={inputs} setInputs={setInputs} />}

      {subTab === 'backtest' && (
        <div className="card p-4 space-y-4">
          {/* Link volver al analizador conservando los números */}
          <button onClick={() => setSubTab('analizador')}
            className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--accent-ember)' }}>
            ← Volver al análisis
          </button>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-2">Pagos — {kLibre > 0 ? kLibre : '?'} números</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PAGOS[kLibre]||PAGOS[k]||{}).sort(([a],[b])=>Number(b)-Number(a)).map(([ac,mult])=>(
                <div key={ac} className="flex flex-col items-center px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-xs text-muted">{ac} aciertos</span>
                  <span className="font-mono-custom font-bold text-sm" style={{ color: 'var(--accent-ember)' }}>×{mult}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-secondary block mb-1.5">
              {kLibre > 0 ? `${kLibre} número${kLibre>1?'s':''} ingresado${kLibre>1?'s':''}` : 'Ingresá números en el Analizador'}
            </label>
            {/* Cuadros compartidos con el analizador */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({length: 7}).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  value={inputs[i]}
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g,'').slice(0,2)
                    const ni = [...inputs]; ni[i] = clean; setInputs(ni)
                  }}
                  placeholder="—"
                  className="font-display font-bold text-center rounded-xl border transition-all"
                  style={{
                    width:64, height:56, fontSize:'1.3rem', flexShrink:0,
                    background: inputs[i] ? 'var(--bg-card)' : 'var(--bg-elevated)',
                    border:`2px solid ${inputs[i]?'rgba(255,107,53,0.5)':'var(--border)'}`,
                    color: inputs[i] ? 'var(--accent-ember)' : 'var(--text-muted)',
                    outline:'none',
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted mt-1">
              {inputs.filter(v=>v!=='').length} de {k} números ingresados
            </p>
          </div>
          <div>
            <label className="text-xs text-secondary block mb-1.5">Apuesta por sorteo ($)</label>
            <div className="flex gap-2 flex-wrap">
              {[50,100,200].map(m=>(
                <button key={m} onClick={()=>setApuesta(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono-custom transition-all ${
                    apuesta===m?'bg-cyan-DEFAULT/20 text-accent border border-cyan-DEFAULT/40':'text-secondary'
                  }`} style={apuesta===m?{color:'var(--accent-cyan)'}:{}}>
                  ${m}
                </button>
              ))}
              <input type="number" value={apuesta} min={1} onChange={e=>setApuesta(Number(e.target.value))}
                className="field w-20" />
            </div>
          </div>
          <button onClick={ejecutarBacktest} disabled={loadingBT}
            className="btn-primary w-full flex items-center justify-center gap-2"
            style={{ background: 'var(--accent-ember)', color: '#fff' }}>
            {loadingBT?'⟳ Calculando…':<><DollarSign className="w-4 h-4"/>Ejecutar Backtest</>}
          </button>
          {errorBT && <p className="text-xs text-red-400">{errorBT}</p>}
          {resultado && (
            <div className="space-y-3 animate-fade-up">
              <div className="grid grid-cols-2 gap-3">
                {[['Sorteos',resultado.sorteos],['Apostado',`$${resultado.total_apostado?.toLocaleString('es-UY')}`],
                  ['Ganado',`$${resultado.total_ganado?.toLocaleString('es-UY')}`],
                  ['Balance',`${resultado.balance>=0?'+':''}$${resultado.balance?.toLocaleString('es-UY')}`]
                ].map(([l,v])=>(
                  <div key={l} className="card p-3">
                    <p className="text-xs text-muted">{l}</p>
                    <p className="font-display text-xl font-bold" style={{color:'var(--text-primary)'}}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="card p-3 flex items-center justify-between"
                style={{borderLeft:`3px solid ${resultado.roi>=0?'#22C55E':'#EF4444'}`}}>
                <div>
                  <p className="text-xs text-muted">ROI</p>
                  <p className={`font-display text-3xl font-black ${resultado.roi>=0?'text-green-400':'text-red-400'}`}>
                    {resultado.roi>0?'+':''}{resultado.roi}%
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl p-3"
                style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)'}}>
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-secondary">Resultados históricos. El azar no puede predecirse.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────
export default function TombolaMain() {
  const navigate = useNavigate()
  const [k,         setK]         = useState(3)
  const [info,      setInfo]      = useState(null)
  const [marco,     setMarco]     = useState(null)
  const [loadMarco, setLoadMarco] = useState(false)
  const [tab,       setTab]       = useState('ranking')
  // Filtros temporales globales — afectan al marco combinatorio
  const [filtrosGlobal, setFiltrosGlobal] = useState({ rango:'todo', ultN:300, desde:'', hastaF:'' })

  useEffect(() => {
    getInfo().then(r => setInfo(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setMarco(null); setLoadMarco(true)
    getMarco(k, toParamsTombola(filtrosGlobal))
      .then(r => setMarco(r.data)).catch(() => {}).finally(() => setLoadMarco(false))
  }, [k, filtrosGlobal]) // eslint-disable-line

  const minFecha = toISO(info?.primera_fecha)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">

      {/* Header con links */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,107,53,0.15)' }}>
          <Dices className="w-5 h-5" style={{ color: 'var(--accent-ember)' }} />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Tómbola</h1>
          <p className="text-xs text-muted">
            {info ? `${info.total.toLocaleString('es-UY')} sorteos · ${info.nums_por_sorteo} números c/u` : 'Cargando…'}
          </p>
        </div>
        {/* Links rápidos */}
        <Link to="/quiniela" className="btn-ghost text-xs flex items-center gap-1.5"
          style={{ color: 'var(--text-muted)' }}>
          <BarChart2 className="w-3.5 h-3.5" /> Quiniela
        </Link>
      </div>

      {/* Último sorteo */}
      <div className="rounded-2xl p-px"
        style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.4) 0%, rgba(255,107,53,0.1) 100%)' }}>
        <div className="rounded-2xl px-3 pt-2 pb-3" style={{ background: 'var(--bg-surface)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent-ember)' }}>
            Último Sorteo Tómbola
          </p>
          <TombolaSorteoViewer
            totalSorteos={info?.total}
            minFecha={minFecha}
            maxFecha={HOY}
          />
        </div>
      </div>

      {/* Selector modalidad */}
      <SelectorK k={k} setK={setK} />

      {/* Filtros temporales para el marco combinatorio */}
      <FiltrosTemporal
        filtros={filtrosGlobal}
        setFiltros={setFiltrosGlobal}
        minFecha={minFecha}
        maxFecha={HOY}
      />

      {/* Marco combinatorio — se recalcula con los filtros */}
      <MarcoCombinatorioBanner marco={marco} loading={loadMarco} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
        {[
          { id:'ranking',     label:'Ranking',     Icon:TrendingUp  },
          { id:'laboratorio', label:'Laboratorio', Icon:FlaskConical},
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab===id?'text-black shadow-sm':'text-secondary hover:text-primary'
            }`}
            style={tab===id?{background:'var(--accent-ember)'}:{}}>
            <Icon className="w-4 h-4"/>{label}
          </button>
        ))}
      </div>

      {tab==='ranking'     && <TabRanking k={k} />}
      {tab==='laboratorio' && <TabLaboratorio k={k} minFecha={minFecha} maxFecha={HOY} />}
    </div>
  )
}
