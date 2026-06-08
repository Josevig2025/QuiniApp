/**
 * pages/redoblona/RedoblonaMain.jsx
 * Redoblona — pares de números en el mismo sorteo.
 * Sin filtro de cifras (siempre 2 cifras).
 * Con filtros temporales y calendarios limitados.
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, TrendingUp, Search, Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

import GapBadge         from '../../components/ui/GapBadge'
import ErrorMessage     from '../../components/ui/ErrorMessage'
import { SkeletonCard } from '../../components/ui/Skeleton'

import { getAnalizar, getRanking, getSugeridas } from '../../api/redoblona'
import { getInfo } from '../../api/quiniela'

const CIFRAS = 2   // Redoblona siempre usa 2 cifras


// ── Tabla de pagos Redoblona ──────────────────────────────────────────
// Filas = posición del primer número (r1), Columnas = posición del segundo (r2)
const PAGOS_REDOBLONA = {
  1:  { 5:980.0,  6:816.7,  7:700.0,  8:612.5,  9:544.4,  10:490.0, 11:445.5, 12:408.3, 13:376.9, 14:350.0, 15:326.7, 16:306.3, 17:288.2, 18:272.2, 19:257.9 },
  2:  { 5:490.0,  6:408.3,  7:350.0,  8:306.3,  9:272.2,  10:245.0, 11:222.7, 12:204.2, 13:188.5, 14:175.0, 15:163.3, 16:153.1, 17:144.1, 18:136.1, 19:128.9, 20:122.5 },
  3:  { 5:326.7,  6:272.2,  7:233.3,  8:204.2,  9:181.5,  10:163.3, 11:148.5, 12:136.1, 13:125.6, 14:116.7, 15:108.9, 16:102.1, 17:96.1,  18:90.7,  19:86.0,  20:81.7 },
  4:  { 5:245.0,  6:204.2,  7:175.0,  8:153.1,  9:136.1,  10:122.5, 11:111.4, 12:102.1, 13:94.2,  14:87.5,  15:81.7,  16:76.6,  17:72.1,  18:68.1,  19:64.5,  20:61.3 },
  5:  { 5:196.0,  6:163.3,  7:140.0,  8:122.5,  9:108.9,  10:98.0,  11:89.1,  12:81.7,  13:75.4,  14:70.0,  15:65.3,  16:61.3,  17:57.6,  18:54.4,  19:51.6,  20:49.0 },
  6:  { 6:136.1,  7:116.7,  8:102.1,  9:90.7,   10:81.7,  11:74.2,  12:68.1,  13:62.8,  14:58.3,  15:54.4,  16:51.0,  17:48.0,  18:45.4,  19:43.0,  20:40.8 },
  7:  { 6:100.0,  7:87.5,   8:77.8,   9:70.0,   10:63.6,  11:58.3,  12:53.8,  13:50.0,  14:46.7,  15:43.8,  16:41.2,  17:38.9,  18:36.8,  19:35.0 },
  8:  { 6:76.6,   7:68.1,   8:61.3,   9:55.7,   10:51.0,  11:47.1,  12:43.8,  13:40.8,  14:38.3,  15:36.0,  16:34.0,  17:32.2,  18:30.6 },
  9:  { 6:60.5,   7:54.4,   8:49.5,   9:45.4,   10:41.9,  11:38.9,  12:36.3,  13:34.0,  14:32.0,  15:30.2,  16:28.7,  17:27.2 },
  10: { 6:49.0,   7:44.5,   8:40.8,   9:37.7,   10:35.0,  11:32.7,  12:30.6,  13:28.8,  14:27.2,  15:25.8,  16:24.5 },
  11: { 6:40.5,   7:37.1,   8:34.3,   9:31.8,   10:29.7,  11:27.8,  12:26.2,  13:24.7,  14:23.4,  15:22.3 },
  12: { 6:34.0,   7:31.4,   8:29.2,   9:27.2,   10:25.5,  11:24.0,  12:22.7,  13:21.5,  14:20.4 },
  13: { 6:29.0,   7:26.9,   8:25.1,   9:23.6,   10:22.2,  11:20.9,  12:19.8,  13:18.8 },
  14: { 6:25.0,   7:23.3,   8:21.9,   9:20.6,   10:19.4,  11:18.4,  12:17.5 },
  15: { 6:21.8,   7:20.4,   8:19.2,   9:18.1,   10:17.2,  11:16.3 },
  16: { 6:19.1,   7:18.0,   8:17.0,   9:16.1,   10:15.3 },
  17: { 6:17.0,   7:16.0,   8:15.2,   9:14.4 },
  18: { 6:15.1,   7:14.3,   8:13.6 },
  19: { 6:13.6,   7:12.9 },
  20: { 6:12.3 },
}

// ── Filtros temporales ────────────────────────────────────────────────
function FiltrosTemporal({ filtros, setFiltros, minFecha, maxFecha }) {
  const [expandido, setExpandido] = useState(false)
  const PERIODOS = [
    { value: 'todo',   label: 'Todo'     },
    { value: 'anio',   label: 'Últ. año' },
    { value: 'mes',    label: 'Últ. mes' },
    { value: 'n',      label: 'Últ. N'   },
    { value: 'custom', label: 'Fechas'   },
  ]

  return (
    <div className="card p-3 space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-2 items-end">
        {/* Rango premios */}
        {/* Posición exacta N1 y N2 */}
        <div>
          <p className="text-xs text-muted mb-1">N1 — posición exacta</p>
          <select value={filtros.r1} onChange={e => setFiltros(f => ({...f, r1: Number(e.target.value)}))}
            className="field text-xs py-1">
            {Array.from({length:20},(_,i)=>i+1).map(v => (
              <option key={v} value={v}>{v}° Premio</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">N2 — posición exacta</p>
          <select value={filtros.r2} onChange={e => setFiltros(f => ({...f, r2: Number(e.target.value)}))}
            className="field text-xs py-1">
            {Array.from({length:20},(_,i)=>i+1).map(v => (
              <option key={v} value={v}>{v}° Premio</option>
            ))}
          </select>
        </div>
        {/* Período */}
        <div>
          <p className="text-xs text-muted mb-1">Período</p>
          <div className="flex gap-1 flex-wrap">
            {PERIODOS.map(op => (
              <button key={op.value}
                onClick={() => setFiltros(f => ({...f, rango: op.value}))}
                className={`px-2.5 py-1.5 text-xs rounded-lg font-semibold transition-all border ${
                  filtros.rango === op.value
                    ? 'border-cyan-DEFAULT/40 bg-cyan-DEFAULT/15'
                    : 'border-transparent text-muted hover:border-[var(--border)]'
                }`}
                style={filtros.rango === op.value ? { color: 'var(--accent-cyan)' } : {}}>
                {op.label}
              </button>
            ))}
          </div>
        </div>
        {filtros.rango === 'n' && (
          <div>
            <p className="text-xs text-muted mb-1">Cantidad</p>
            <input type="number" defaultValue={filtros.ultN} min={10} max={10500}
              onBlur={e => { const v = Number(e.target.value); if (v >= 10) setFiltros(f => ({...f, ultN: v})) }}
              onKeyDown={e => { if (e.key === 'Enter') { const v = Number(e.target.value); if (v >= 10) setFiltros(f => ({...f, ultN: v})) } }}
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
    </div>
  )
}

function toParams(filtros) {
  const p = {}
  switch (filtros.rango) {
    case 'anio':   p.ultimos_n = 730;  break  // ~2 años de sorteos
    case 'mes':    p.ultimos_n = 60;   break  // ~2 meses
    case 'n':      p.ultimos_n = filtros.ultN; break
    case 'custom':
      if (filtros.desde)  p.desde       = filtros.desde
      if (filtros.hastaF) p.hasta_fecha = filtros.hastaF
      break
    // 'todo': sin params
  }
  return p
}

// ── Fila par ──────────────────────────────────────────────────────────
function ParRow({ par, onSelect, idx }) {
  return (
    <tr onClick={() => onSelect(par.n1, par.n2)}
      className="cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors animate-fade-up"
      style={{ borderBottom: '1px solid var(--border)', animationDelay: `${idx*20}ms`, animationFillMode: 'both' }}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-base" style={{ color: 'var(--accent-cyan)' }}>{par.n1}</span>
          <span className="text-muted text-xs">+</span>
          <span className="font-display font-bold text-base" style={{ color: 'var(--accent-ember)' }}>{par.n2}</span>
        </div>
      </td>
      <td className="px-4 py-2.5 font-mono-custom text-secondary">{par.apariciones}</td>
      <td className="px-4 py-2.5"><GapBadge value={par.gap_actual} /></td>
      <td className="px-4 py-2.5 font-mono-custom text-secondary">{par.gap_promedio}</td>
      <td className="px-4 py-2.5 font-mono-custom text-secondary">{par.gap_maximo}</td>
    </tr>
  )
}

// ── Tab Ranking ───────────────────────────────────────────────────────
function TabRanking({ filtros, onSelectPar, onNav }) {
  const [modo,    setModo]    = useState('frecuencia')
  const [top,     setTop]     = useState(10)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await getRanking(filtros.r1, filtros.r2, CIFRAS, top, modo, toParams(filtros))
      setData(r.data); setSortCol(null)
    } catch (e) { setError(e.response?.data?.detail || 'Error al cargar') }
    finally { setLoading(false) }
  }, [filtros, top, modo])

  // Cargar automáticamente al montar y cuando cambian filtros
  useEffect(() => { cargar() }, [filtros.r1, filtros.r2, filtros.rango, filtros.ultN, filtros.desde, filtros.hastaF, top, modo]) // eslint-disable-line

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(col); setSortDir('desc') }
  }
  const sortedData = () => {
    if (!data || !sortCol) return data || []
    return [...data].sort((a, b) => {
      const va = a[sortCol] ?? -Infinity
      const vb = b[sortCol] ?? -Infinity
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }
  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="opacity-30 ml-1">⇅</span>
    return <span className="ml-1" style={{ color: 'var(--accent-cyan)' }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  return (
    <div className="space-y-3">
      {/* Controles — reactivos */}
      <div className="flex flex-wrap gap-2 items-center">
        {['frecuencia','atrasos'].map(m => (
          <button key={m} onClick={() => setModo(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={modo === m
              ? { background: 'rgba(0,229,255,0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,229,255,0.4)' }
              : { color: 'var(--text-secondary)', border: '1px solid transparent' }}>
            {m === 'frecuencia' ? 'Más frecuentes' : 'Más atrasados'}
          </button>
        ))}
        <div className="flex gap-1 ml-auto items-center">
          <span className="text-xs text-muted">Top</span>
          {[10,20,50,100].map(n => (
            <button key={n} onClick={() => setTop(n)}
              className="px-2.5 py-1 rounded-lg text-xs transition-all"
              style={top===n ? { color: 'var(--accent-cyan)', background: 'rgba(0,229,255,0.1)' } : { color: 'var(--text-muted)' }}>
              {n}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-muted animate-pulse">Cargando…</span>}
      </div>
      {error && <ErrorMessage message={error} onRetry={cargar} />}
      {loading && <SkeletonCard rows={8} />}
      {!loading && data?.length === 0 && (
        <p className="text-center text-xs text-muted py-8">Sin pares para los filtros seleccionados</p>
      )}
      {!loading && sortedData().length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted">Par</th>
                  {[
                    { label: 'Coincidencias', col: 'apariciones'  },
                    { label: 'Gap Actual',    col: 'gap_actual'   },
                    { label: 'Gap Prom',      col: 'gap_promedio' },
                    { label: 'Gap Máx',       col: 'gap_maximo'   },
                  ].map(({ label, col }) => (
                    <th key={col} onClick={() => handleSort(col)}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase cursor-pointer select-none"
                      style={{ color: sortCol === col ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {label}<SortIcon col={col} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData().map((par, i) => (
                  <ParRow key={`${par.n1}-${par.n2}`} par={par} onSelect={onSelectPar} idx={i} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted text-center py-2">Click en un par para analizarlo · Click en columna para ordenar</p>
        </div>
      )}
      <div className="flex justify-end pt-1">
        <button onClick={() => onNav?.('analizar')}
          className="text-xs hover:opacity-80 transition-opacity flex items-center gap-1"
          style={{ color: '#A78BFA' }}>
          Ir a Analizar →
        </button>
      </div>
    </div>
  )
}

// ── Tab Analizar ──────────────────────────────────────────────────────
// ── Numpad ───────────────────────────────────────────────────────────
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
                onClick={() => key === 'C' ? onClear() : key === 'CE' ? onClearAll() : onDigit(key)}
                className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all active:scale-95 hover:opacity-80"
                style={{
                  background: special ? 'rgba(167,139,250,0.15)' : 'var(--bg-card)',
                  color: special ? '#A78BFA' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}>
                {key}
              </button>
            )
          })}
        </div>
      ))}
      <p className="text-xs text-muted text-center" style={{ fontSize: '0.65rem' }}>C=borrar · CE=limpiar</p>
    </div>
  )
}


// ── Tabla de pagos iluminada ──────────────────────────────────────────
// Filas = posición N1 (1-20), Columnas = posición N2 (1-20)
// Solo se muestran celdas con premio válido
function TablaPagos({ r1, r2 }) {
  // Columnas disponibles según fila r1
  const colsDisp = {
    1: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
    2: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    3: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    4: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    5: [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    6: [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    7: [6,7,8,9,10,11,12,13,14,15,16,17,18,19],
    8: [6,7,8,9,10,11,12,13,14,15,16,17,18],
    9: [6,7,8,9,10,11,12,13,14,15,16,17],
    10:[6,7,8,9,10,11,12,13,14,15,16],
    11:[6,7,8,9,10,11,12,13,14,15],
    12:[6,7,8,9,10,11,12,13,14],
    13:[6,7,8,9,10,11,12,13],
    14:[6,7,8,9,10,11,12],
    15:[6,7,8,9,10,11],
    16:[6,7,8,9,10],
    17:[6,7,8,9],
    18:[6,7,8],
    19:[6,7],
    20:[6],
  }
  const pago = PAGOS_REDOBLONA[r1]?.[r2]
  const cols = r1 ? (colsDisp[r1] || []) : []

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', minWidth: 180, maxWidth: 240 }}>

      {/* Header con pago actual */}
      <div className="px-3 py-2 text-center"
        style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs text-muted uppercase tracking-wider">Premio</p>
        <p className="font-display font-black text-2xl mt-0.5"
          style={{ color: pago != null ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
          {pago != null ? `×${pago}` : '—'}
        </p>
        {pago != null && (
          <p className="text-xs text-muted mt-0.5">
            N1 pos.{r1} · N2 pos.{r2}
          </p>
        )}
      </div>

      {/* Grilla de celdas */}
      <div className="p-2">
        {!r1 ? (
          <p className="text-xs text-muted text-center py-2">Ingresá posiciones</p>
        ) : (
          <>
            <p className="text-xs text-muted mb-1.5 text-center">
              N1 en pos.{r1} — N2 posible en:
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              {cols.map(c => {
                const activo = c === r2
                const val = PAGOS_REDOBLONA[r1]?.[c]
                return (
                  <div key={c}
                    className="flex flex-col items-center rounded-lg px-1.5 py-1 transition-all"
                    style={{
                      background: activo ? 'rgba(0,229,255,0.2)' : 'var(--bg-elevated)',
                      border: activo ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                      minWidth: 36,
                    }}>
                    <span className="text-xs font-mono-custom"
                      style={{ color: activo ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {c}°
                    </span>
                    <span className="font-mono-custom font-bold text-xs"
                      style={{ color: activo ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize:'0.65rem' }}>
                      ×{val}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}


function TabAnalizar({ filtros, preN1='', preN2='', onNav }) {
  const [n1, setN1] = useState(preN1)
  const [n2, setN2] = useState(preN2)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [foco,    setFoco]    = useState(0)   // 0=N1, 1=N2
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const refs = [ref1, ref2]

  // Actualizar cuando viene de ranking/sugeridas
  useEffect(() => {
    if (preN1) setN1(preN1)
    if (preN2) setN2(preN2)
  }, [preN1, preN2])

  // Analizar automáticamente cuando hay ambos números
  useEffect(() => {
    if (!n1.trim() || !n2.trim()) { setData(null); return }
    setLoading(true); setError(null)
    getAnalizar(n1.trim(), filtros.r1, n2.trim(), filtros.r2, CIFRAS, toParams(filtros))
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Error'))
      .finally(() => setLoading(false))
  }, [n1, n2, filtros.r1, filtros.r2, filtros.rango, filtros.ultN, filtros.desde, filtros.hastaF]) // eslint-disable-line

  const handleN = (idx, val) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 2)
    if (idx === 0) setN1(clean)
    else setN2(clean)
    // Avanzar al siguiente cuadro con 2 dígitos
    if (clean.length === 2 && idx === 0) {
      setFoco(1)
      setTimeout(() => ref2.current?.focus(), 50)
    }
  }

  // Numpad handlers
  const getVal = () => foco === 0 ? n1 : n2
  const setVal = (v) => foco === 0 ? setN1(v) : setN2(v)
  const onDigit = (d) => { const cur = getVal(); if (cur.length < 2) handleN(foco, cur + d) }
  const onClear = () => {
    const cur = getVal()
    if (cur.length > 0) handleN(foco, cur.slice(0, -1))
    else if (foco === 1) { setFoco(0); setTimeout(() => ref1.current?.focus(), 50) }
  }
  const onClearAll = () => { setN1(''); setN2(''); setData(null); setFoco(0); setTimeout(() => ref1.current?.focus(), 50) }

  const inputStyle = (active, val, color) => ({
    width: 72, height: 72, fontSize: '1.8rem', textAlign: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 'bold',
    borderRadius: 16, outline: 'none',
    background: val ? 'var(--bg-card)' : 'var(--bg-elevated)',
    border: active ? `3px solid ${color}` : val ? `2px solid ${color}55` : '2px solid var(--border)',
    color: val ? color : 'var(--text-muted)',
    boxShadow: active ? `0 0 0 4px ${color}22` : 'none',
    transition: 'all 0.15s',
  })

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-4">
        {/* Cuadros + Numpad */}
        <div className="flex gap-4 items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <label className="text-xs text-secondary">N1 (Top {filtros.r1})</label>
                <input ref={ref1} type="text" inputMode="numeric"
                  value={n1} onChange={e => handleN(0, e.target.value)}
                  onFocus={() => setFoco(0)} placeholder="—"
                  style={inputStyle(foco===0, n1, 'var(--accent-cyan)')} maxLength={2} />
              </div>
              <span className="text-muted font-bold text-2xl mt-4">+</span>
              <div className="flex flex-col items-center gap-1">
                <label className="text-xs text-secondary">N2 (Top {filtros.r2})</label>
                <input ref={ref2} type="text" inputMode="numeric"
                  value={n2} onChange={e => handleN(1, e.target.value)}
                  onFocus={() => setFoco(1)} placeholder="—"
                  style={inputStyle(foco===1, n2, '#A78BFA')} maxLength={2} />
              </div>
            </div>
            {loading && <span className="text-xs text-muted animate-pulse">Calculando…</span>}
          </div>
          <div className="flex flex-col gap-3">
            <Numpad onDigit={onDigit} onClear={onClear} onClearAll={onClearAll} />
            <TablaPagos r1={n1 ? filtros.r1 : null} r2={n2 ? filtros.r2 : null} />
          </div>
        </div>
      </div>
      <div className="flex justify-between pt-1">
        <button onClick={() => onNav?.('ranking')}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: '#A78BFA' }}>
          ← Volver al Ranking
        </button>
        <button onClick={() => onNav?.('sugeridas')}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: '#A78BFA' }}>
          Ver Sugeridas →
        </button>
      </div>
      {error && <ErrorMessage message={error} />}
      {loading && <SkeletonCard rows={4} />}
      {data && !loading && (
        <div className="space-y-4 animate-fade-up">
          <div className="card p-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="font-display text-4xl font-black" style={{ color: 'var(--accent-cyan)' }}>{data.n1}</span>
              <span className="text-muted text-2xl">+</span>
              <span className="font-display text-4xl font-black" style={{ color: 'var(--accent-ember)' }}>{data.n2}</span>
            </div>
            <div className="flex gap-4">
              <div><p className="text-xs text-muted">Coincidencias</p>
                <p className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.apariciones}</p></div>
              <div><p className="text-xs text-muted">Gap actual</p>
                <GapBadge value={data.gap_actual} className="text-sm mt-1" /></div>
            </div>
          </div>
          {data.apariciones > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[['Gap promedio',data.gap_promedio??'—'],['Gap máximo',data.gap_maximo??'—'],['Gap actual',data.gap_actual]].map(([l,v])=>(
                  <div key={l} className="card p-3">
                    <p className="text-xs text-muted">{l}</p>
                    <p className="font-mono-custom font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{v}</p>
                  </div>
                ))}
              </div>
              {data.ultimas_ocurrencias?.length > 0 && (
                <div className="card overflow-hidden">
                  <p className="px-4 py-3 text-xs font-semibold text-muted uppercase" style={{ borderBottom: '1px solid var(--border)' }}>
                    Últimas coincidencias
                  </p>
                  {data.ultimas_ocurrencias.slice().reverse().map((oc,i)=>(
                    <div key={i} className="flex items-center gap-4 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-28">
                        <p className="text-xs font-mono-custom" style={{ color: 'var(--accent-cyan)' }}>{oc.fecha}</p>
                        <p className="text-xs text-muted capitalize">{oc.turno?.toLowerCase()}</p>
                      </div>
                      <div className="flex gap-4 text-xs font-mono-custom text-secondary">
                        <span>N1 pos. <strong>{oc.pos1}°</strong></span>
                        <span>N2 pos. <strong>{oc.pos2}°</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="card p-6 text-center">
              <p className="text-secondary text-sm">Este par nunca coincidió en los rangos seleccionados.</p>
              <p className="text-xs text-muted mt-2">Probá ampliando los rangos de premios.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab Sugeridas ─────────────────────────────────────────────────────
function TabSugeridas({ filtros, onSelectPar, onNav }) {
  const [ventana, setVentana] = useState(300)
  const [top,     setTop]     = useState(10)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await getSugeridas(filtros.r1, filtros.r2, CIFRAS, top, ventana)
      setData(r.data.candidatos)
    } catch (e) { setError(e.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }, [filtros.r1, filtros.r2, top, ventana])

  // Reactivo — carga automáticamente al cambiar filtros o parámetros
  useEffect(() => { cargar() }, [filtros.r1, filtros.r2, top, ventana]) // eslint-disable-line

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl p-3"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-secondary">Candidatos por frecuencia reciente y atraso moderado. Solo estadística histórica.</p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <p className="text-xs text-muted mb-1">Ventana</p>
          <div className="flex gap-1">
            {[100,200,300,500].map(v => (
              <button key={v} onClick={() => setVentana(v)}
                className="px-2.5 py-1.5 rounded-lg text-xs transition-all"
                style={ventana===v ? { color:'var(--accent-cyan)', background:'rgba(0,229,255,0.1)' } : { color:'var(--text-muted)' }}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Cantidad</p>
          <div className="flex gap-1">
            {[5,10,20].map(n => (
              <button key={n} onClick={() => setTop(n)}
                className="px-2.5 py-1.5 rounded-lg text-xs transition-all"
                style={top===n ? { color:'var(--accent-cyan)', background:'rgba(0,229,255,0.1)' } : { color:'var(--text-muted)' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        {loading && <span className="text-xs text-muted animate-pulse ml-2">Cargando…</span>}
      </div>
      <div className="flex justify-between pt-1">
        <button onClick={() => onNav?.('analizar')}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: '#A78BFA' }}>
          ← Ir a Analizar
        </button>
      </div>
      {error && <ErrorMessage message={error} onRetry={cargar} />}
      {loading && <SkeletonCard rows={5} />}
      {data && !loading && (
        data.length === 0
          ? <p className="text-center text-xs text-muted py-8">Sin candidatos</p>
          : <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#','Par','Coincidencias','Gap Actual','Gap Prom'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.map((par,i)=>(
                    <tr key={`${par.n1}-${par.n2}`} onClick={()=>onSelectPar(par.n1,par.n2)}
                      className="cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-2.5 text-xs text-muted">{i+1}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold" style={{ color: 'var(--accent-cyan)' }}>{par.n1}</span>
                          <span className="text-muted text-xs">+</span>
                          <span className="font-display font-bold" style={{ color: 'var(--accent-ember)' }}>{par.n2}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono-custom text-secondary">{par.apariciones}</td>
                      <td className="px-4 py-2.5"><GapBadge value={par.gap_actual} /></td>
                      <td className="px-4 py-2.5 font-mono-custom text-secondary">{par.gap_promedio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────
export default function RedoblonaMain() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('ranking')
  const [preN1, setPreN1] = useState('')
  const [preN2, setPreN2] = useState('')
  const [datasetInfo, setDatasetInfo] = useState(null)

  const [filtros, setFiltros] = useState({
    r1: 5, r2: 5, rango: 'todo', ultN: 300, desde: '', hastaF: ''
  })

  useEffect(() => {
    getInfo().then(r => setDatasetInfo(r.data)).catch(() => {})
  }, [])

  function toISO(f) {
    if (!f) return ''
    const [d,m,y] = f.split('/')
    return `20${y}-${m}-${d}`
  }
  const HOY = new Date().toISOString().split('T')[0]

  const irAAnalizar = (n1, n2) => { setPreN1(n1); setPreN2(n2); setTab('analizar') }

  const TABS = [
    { id: 'ranking',   label: 'Ranking',   Icon: TrendingUp },
    { id: 'analizar',  label: 'Analizar',  Icon: Search     },
    { id: 'sugeridas', label: 'Sugeridas', Icon: Zap        },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="btn-ghost p-2">
          <Layers className="w-5 h-5" style={{ color: '#A78BFA' }} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Redoblona</h1>
          <p className="text-xs text-muted">Pares de números · 2 cifras · {datasetInfo?.total?.toLocaleString('es-UY')} sorteos</p>
        </div>
      </div>

      {/* Filtros */}
      <FiltrosTemporal
        filtros={filtros}
        setFiltros={setFiltros}
        minFecha={toISO(datasetInfo?.primera_fecha)}
        maxFecha={HOY}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg
              text-xs font-semibold transition-all ${tab===id?'text-black shadow-sm':'text-secondary hover:text-primary'}`}
            style={tab===id ? { background: '#A78BFA' } : {}}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {tab==='ranking'   && <TabRanking   filtros={filtros} onSelectPar={irAAnalizar} onNav={setTab} />}
      {tab==='analizar'  && <TabAnalizar  filtros={filtros} preN1={preN1} preN2={preN2} onNav={setTab} />}
      {tab==='sugeridas' && <TabSugeridas filtros={filtros} onSelectPar={irAAnalizar} onNav={setTab} />}
    </div>
  )
}
