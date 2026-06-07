/**
 * pages/quiniela/AnalisisNumero.jsx
 * Análisis completo de un número.
 * Features: input manual, flechas adelante/atrás, número al azar,
 *           ROI con apuesta x1, Top ROI, día favorito, links de navegación.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Shuffle, RefreshCw,
  TrendingUp, FlaskConical, BarChart2,
} from 'lucide-react'

import FilterBar         from '../../components/ui/FilterBar'
import StatPanel         from '../../components/ui/StatPanel'
import GapBadge          from '../../components/ui/GapBadge'
import ErrorMessage      from '../../components/ui/ErrorMessage'
import { SkeletonCard }  from '../../components/ui/Skeleton'
import ChartGaps         from '../../components/quiniela/ChartGaps'
import ChartFreqPosicion from '../../components/quiniela/ChartFreqPosicion'
import SorteoModal       from '../../components/quiniela/SorteoModal'

import { useFiltersQuiniela }  from '../../hooks/useQuiniela'
import {
  getAnalisisNumero, getSorteo, getBacktest, getTopRoi,
} from '../../api/quiniela'

// ── Helpers de fecha ────────────────────────────────────────────────────
function toISO(fechaDDMMYY) {
  if (!fechaDDMMYY) return ''
  const [d, m, y] = fechaDDMMYY.split('/')
  return `20${y}-${m}-${d}`
}
const HOY = new Date().toISOString().split('T')[0]

// ── Días de la semana ─────────────────────────────────────────────────
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function parseFecha(fechaStr) {
  // DD/MM/YY → Date
  if (!fechaStr) return null
  const [d, m, y] = fechaStr.split('/')
  return new Date(`20${y}-${m}-${d}`)
}

// ── Panel de ROI ──────────────────────────────────────────────────────
function PanelRoi({ numero, cifras, hasta, filters, filtersKey }) {
  const [roi,     setRoi]     = useState(null)
  const [topRoi,  setTopRoi]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [mostrar, setMostrar] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    // Evaluar toParams en el momento exacto de ejecutar
    const params = typeof filters?.toParams === 'function'
      ? filters.toParamsConPos?.() ?? filters.toParams()
      : {}
    try {
      const [rBt, rTop] = await Promise.all([
        getBacktest(numero, cifras, hasta, 1, params),
        getTopRoi(cifras, hasta, 10, params),
      ])
      setRoi(rBt.data)
      setTopRoi(rTop.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al calcular ROI')
    } finally {
      setLoading(false)
    }
  }, [numero, cifras, hasta, filtersKey, filters]) // filtersKey fuerza recalculo

  // Resetear cuando cambian los filtros
  useEffect(() => {
    setMostrar(false)
    setRoi(null)
    setTopRoi(null)
  }, [filtersKey]) // eslint-disable-line

  if (!mostrar) return (
    <button onClick={() => { setMostrar(true); cargar() }}
      className="card w-full p-3 flex items-center justify-between hover:border-[var(--border-accent)] transition-colors">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-ember)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          ROI Histórico + Top mejores saldos
        </span>
      </div>
      <span className="text-xs text-muted">Calcular →</span>
    </button>
  )

  if (loading) return <SkeletonCard rows={4} />
  if (error)   return <ErrorMessage message={error} onRetry={cargar} />

  const positivo = roi?.roi >= 0

  return (
    <div className="space-y-3 animate-fade-up">

      {/* ROI del número actual */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            ROI Histórico — apuesta base ×1
          </p>
          <button onClick={cargar} className="btn-ghost p-1">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Sorteos',   roi?.sorteos],
            ['Ganado',    `${roi?.total_ganado?.toFixed(2)}×`],
            ['Balance',   `${roi?.balance >= 0 ? '+' : ''}${roi?.balance?.toFixed(2)}×`],
            ['ROI',       null],
          ].map(([label, val]) => (
            <div key={label} className="card p-3">
              <p className="text-xs text-muted">{label}</p>
              {label === 'ROI' ? (
                <p className={`font-display text-2xl font-black ${positivo ? 'text-green-400' : 'text-red-400'}`}>
                  {roi?.roi > 0 ? '+' : ''}{roi?.roi}%
                </p>
              ) : (
                <p className="font-mono-custom font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {val ?? '—'}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted">
          Multiplicador aplicado: ×{roi?.multiplicador} · Apostando $100 por sorteo → balance ${(roi?.balance * 100)?.toFixed(0)}
        </p>
      </div>

      {/* Top mejores y peores ROI */}
      {topRoi && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { titulo: '🏆 Top 10 Mejor ROI', lista: topRoi.top_mejores, color: 'text-green-400' },
            { titulo: '📉 Top 10 Peor ROI',  lista: topRoi.top_peores,  color: 'text-red-400'   },
          ].map(({ titulo, lista, color }) => (
            <div key={titulo} className="card overflow-hidden">
              <p className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wider"
                style={{ borderBottom: '1px solid var(--border)' }}>
                {titulo}
              </p>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {lista?.map((item, i) => (
                  <div key={item.numero}
                    className="flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-elevated)] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted w-4">{i + 1}</span>
                      <Link
                        to={`/quiniela/numero/${item.numero}`}
                        state={{ cifras }}
                        className="font-display font-bold text-sm hover:underline"
                        style={{ color: item.numero === numero ? 'var(--accent-cyan)' : 'var(--text-primary)' }}
                      >
                        {item.numero}
                        {item.numero === numero && <span className="ml-1 text-xs">◀ este</span>}
                      </Link>
                    </div>
                    <span className={`font-mono-custom text-xs font-bold ${color}`}>
                      {item.roi > 0 ? '+' : ''}{item.roi}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted text-center">
        ROI calculado con apuesta base ×1 por sorteo. Multiplicá por tu apuesta real para obtener el resultado en $$.
      </p>
    </div>
  )
}

// ── Panel día favorito ────────────────────────────────────────────────
function PanelDiaFavorito({ fechas }) {
  if (!fechas?.length) return null

  // Contar por día de semana y por día del mes (sobre TODAS las apariciones)
  const porDiaSemana = Array(7).fill(0)
  const porDiaMes    = Array(31).fill(0)

  fechas.forEach(fecha => {
    const dt = parseFecha(fecha)
    if (!dt) return
    porDiaSemana[dt.getDay()]++
    porDiaMes[dt.getDate() - 1]++
  })

  const maxDS  = Math.max(...porDiaSemana)
  const maxDM  = Math.max(...porDiaMes)
  const topDS  = porDiaSemana
    .map((v, i) => ({ dia: DIAS[i], count: v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
  const topDM  = porDiaMes
    .map((v, i) => ({ dia: i + 1, count: v }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="card p-4 space-y-3 animate-fade-up">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider">
        Días Favoritos
      </p>
      <div className="grid grid-cols-2 gap-4">
        {/* Por día de semana */}
        <div>
          <p className="text-xs text-muted mb-2">Por día de semana</p>
          <div className="space-y-1.5">
            {topDS.map(({ dia, count }) => (
              <div key={dia} className="flex items-center gap-2">
                <span className="text-xs w-20 text-secondary">{dia}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(count / maxDS) * 100}%`,
                      background: 'var(--accent-cyan)',
                    }} />
                </div>
                <span className="text-xs font-mono-custom text-muted w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Por día del mes */}
        <div>
          <p className="text-xs text-muted mb-2">Por día del mes</p>
          <div className="flex flex-wrap gap-1.5">
            {topDM.map(({ dia, count }) => (
              <div key={dia} className="flex flex-col items-center px-2 py-1.5 rounded-lg"
                style={{ background: 'var(--bg-elevated)' }}>
                <span className="text-xs text-muted">{dia}</span>
                <span className="font-mono-custom font-bold text-sm"
                  style={{ color: 'var(--accent-cyan)' }}>
                  {count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Universo de números según cifras ──────────────────────────────────
function universo(cifras) {
  if (cifras === 1) return Array.from({ length: 10  }, (_, i) => String(i))
  if (cifras === 2) return Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'))
  return Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, '0'))
}

// ── Página principal ──────────────────────────────────────────────────
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
                className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm
                  transition-all active:scale-95 hover:opacity-80"
                style={{
                  background: special ? 'rgba(0,229,255,0.1)' : 'var(--bg-card)',
                  color: special ? 'var(--accent-cyan)' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}>
                {key}
              </button>
            )
          })}
        </div>
      ))}
      <p className="text-xs text-muted text-center" style={{ fontSize: '0.65rem' }}>
        C=borrar · CE=limpiar
      </p>
    </div>
  )
}

export default function AnalisisNumero() {
  const { numero }  = useParams()
  const navigate    = useNavigate()
  const location    = useLocation()

  const filters = useFiltersQuiniela()
  useEffect(() => {
    if (location.state?.cifras) filters.setCifras(location.state.cifras)
  }, []) // eslint-disable-line

  const [inputNum,     setInputNum]     = useState(numero)
  const inputRef = useRef(null)
  const [datasetInfo,  setDatasetInfo]  = useState(null)
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [modalSorteo,  setModalSorteo]  = useState(null)
  const [loadingModal, setLoadingModal] = useState(false)

  // ── Fetch análisis ──────────────────────────────────────────────────
  const cargar = useCallback(async (num = numero) => {
    setLoading(true)
    setError(null)
    try {
      const params = filters.toParamsConPos?.() ?? filters.toParams()
      const r = await getAnalisisNumero(num, filters.cifras, filters.hasta, params)
      setData(r.data)
      setInputNum(num)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al cargar el análisis')
    } finally {
      setLoading(false)
    }
  }, [numero, filters.cifras, filters.hasta, filters.toParams])

  useEffect(() => {
    cargar(numero)
    // Cargar info del dataset para límites de calendario
    import('../../api/quiniela').then(({ getInfo }) => {
      getInfo().then(r => setDatasetInfo(r.data)).catch(() => {})
    })
  }, [numero]) // eslint-disable-line

  // ── Navegación entre números ────────────────────────────────────────
  const lista   = universo(filters.cifras)
  const idxAct  = lista.indexOf(numero)

  const irA = (num) => navigate(`/quiniela/numero/${num}`, { state: { cifras: filters.cifras } })
  const irAnterior  = () => idxAct > 0              && irA(lista[idxAct - 1])
  const irSiguiente = () => idxAct < lista.length - 1 && irA(lista[idxAct + 1])
  const irAzar      = () => {
    const aleatorio = lista[Math.floor(Math.random() * lista.length)]
    irA(aleatorio)
  }

  // ── Ir al número ingresado manualmente ─────────────────────────────
  const irManual = () => {
    const n = inputNum.trim().padStart(filters.cifras, '0')
    if (n !== numero) irA(n)
    else cargar(n)
  }

  // Numpad handlers
  const onDigit = (d) => {
    setInputNum(prev => {
      const next = (prev + d).slice(0, filters.cifras)
      // Navegar automáticamente cuando el número está completo
      if (next.length === filters.cifras) {
        const n = next.padStart(filters.cifras, '0')
        setTimeout(() => irA(n), 50)
      }
      return next
    })
  }
  const onClear    = () => setInputNum(prev => prev.slice(0, -1))
  const onClearAll = () => setInputNum('')

  // ── Modal sorteo ────────────────────────────────────────────────────
  const abrirSorteo = async (idx) => {
    setLoadingModal(true)
    try { const r = await getSorteo(idx); setModalSorteo(r.data) }
    catch {} finally { setLoadingModal(false) }
  }

  const gapActual    = data?.gap_actual
  const headerColor  = gapActual == null ? 'var(--text-primary)'
    : gapActual <= 20  ? '#22C55E'
    : gapActual <= 100 ? '#F59E0B' : '#EF4444'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">

      {/* Header Rediseñado */}
      {/* DASHBOARD PRO */}

      <div className="card p-6 md:p-8">

        {/* Número principal */}
        <div className="text-center">

          <p className="text-xs text-muted uppercase tracking-[0.3em] mb-3">
            Análisis del Número
          </p>

          <div
            className="font-display font-black leading-none animate-number-pop"
            style={{
              fontSize: 'clamp(5.5rem, 16vw, 9rem)',
              color: headerColor,
              textShadow: '0 0 30px rgba(0,229,255,0.18)',
            }}
          >
            {numero}
          </div>

          {gapActual != null && (
            <div className="mt-4 flex justify-center">
              <div
                className="px-4 py-2 rounded-xl flex items-center gap-2"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <span className="text-xs text-muted uppercase">
                  Gap Actual
                </span>

                <GapBadge
                  value={gapActual}
                  className="text-sm"
                />
              </div>
            </div>
          )}

        </div>

        {/* Navegación */}
        <div className="flex justify-center mt-6">
          <div
            className="flex items-center gap-2 p-2 rounded-2xl"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >

            <button
              onClick={() => navigate(-1)}
              className="btn-ghost p-2"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={irAnterior}
              disabled={idxAct <= 0}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={irSiguiente}
              disabled={idxAct >= lista.length - 1}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={irAzar}
              className="btn-ghost p-2"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => cargar(numero)}
              className="btn-ghost p-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>

          </div>
        </div>

      </div>

      {/* Selector + teclado */}

      <div className="card p-4">

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">

          <div
            className="flex flex-col items-center gap-3"
            style={{ minWidth: 120 }}
          >

            <span className="text-xs text-muted uppercase">
              Ingreso Manual
            </span>

            <input
              ref={inputRef}
              type="text"
              value={inputNum}
              onChange={e =>
                setInputNum(
                  e.target.value
                    .replace(/[^0-9]/g, '')
                    .slice(0, filters.cifras)
                )
              }
              onKeyDown={e =>
                e.key === 'Enter' && irManual()
              }
              placeholder={
                filters.cifras === 2
                  ? '00'
                  : filters.cifras === 3
                  ? '000'
                  : '0'
              }
              style={{
                width: 75,
                height: 58,
                fontSize: '1.8rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 'black',
                textAlign: 'center',
                borderRadius: 16,
                outline: 'none',
                background: inputNum
                  ? 'var(--bg-card)'
                  : 'var(--bg-elevated)',
                border: inputNum
                  ? '3px solid rgba(0,229,255,0.6)'
                  : '2px solid var(--border)',
                color: inputNum
                  ? 'var(--accent-cyan)'
                  : 'var(--text-muted)',
              }}
            />

            <button
              onClick={irManual}
              className="btn-ghost text-xs"
            >
              Ir →
            </button>

          </div>

          <Numpad
            onDigit={onDigit}
            onClear={onClear}
            onClearAll={onClearAll}
          />

        </div>

      </div>

      {/* Accesos rápidos */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        <button
          onClick={() => navigate('/quiniela/estadisticas')}
          className="card p-3 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <BarChart2 className="w-4 h-4" />
          <span>Estadísticas Generales</span>
        </button>

        <button
          onClick={() =>
            navigate('/quiniela/laboratorio', {
              state: {
                numero,
                cifras: filters.cifras,
              },
            })
          }
          className="card p-3 flex items-center gap-2 hover:opacity-80 transition-opacity"
          style={{
            borderColor: 'rgba(245,158,11,.35)',
          }}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Backtest de este número</span>
        </button>

      </div>

      {/* Links de navegación rápida */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => navigate('/quiniela/estadisticas')}
          className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>
          <BarChart2 className="w-3.5 h-3.5" /> Estadísticas
        </button>
        <button onClick={() => navigate('/quiniela/laboratorio', { state: { numero, cifras: filters.cifras } })}
          className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
          style={{ color: 'var(--accent-ember)' }}>
          <FlaskConical className="w-3.5 h-3.5" /> Backtest de este número →
        </button>
      </div>

      {/* Filtros */}
      <FilterBar filters={filters} onApply={() => cargar(numero)} minFecha={toISO(datasetInfo?.primera_fecha)} maxFecha={HOY} />

      {/* Contenido */}
      {error ? (
        <ErrorMessage message={error} onRetry={() => cargar(numero)} />
      ) : loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} rows={2} />)}
          </div>
          <SkeletonCard rows={6} />
        </div>
      ) : data?.total === 0 ? (
        <div className="card p-8 text-center space-y-2">
          <p className="font-display text-2xl text-muted">Sin apariciones</p>
          <p className="text-xs text-muted">
            El número <strong>{numero}</strong> no apareció en los primeros {filters.hasta} premios
            con el filtro seleccionado.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatPanel titulo="Apariciones" valor={data.total}                                       acento animDelay={0}   />
            <StatPanel titulo="Gap actual"  valor={data.gap_actual}                                  esGap  animDelay={60}  />
            <StatPanel titulo="Gap promedio" valor={data.gap_promedio != null ? data.gap_promedio.toFixed(1) : '—'}
              subtitulo="sorteos entre apariciones" animDelay={120} />
            <StatPanel titulo="Gap máximo"  valor={data.gap_maximo ?? '—'}
              subtitulo="mayor intervalo registrado" animDelay={180} />
          </div>

          {/* Gráfico gaps */}
          <div className="card p-4 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Historial de Gaps</p>
              <span className="text-xs text-muted font-mono-custom">{data.ultimos_gaps?.length} intervalos</span>
            </div>
            <ChartGaps gaps={data.ultimos_gaps} promedio={data.gap_promedio} />
            <p className="text-xs text-muted mt-2 text-center">Línea punteada = gap promedio histórico</p>
          </div>

          {/* Frecuencia por posición */}
          <div className="card p-4 animate-fade-up" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Frecuencia por Posición</p>
              <span className="text-xs text-muted">Premios 1° al {filters.hasta}°</span>
            </div>
            <ChartFreqPosicion freqPosicion={data.freq_posicion} />
          </div>

          {/* Posiciones favoritas */}
          {data.freq_posicion && Object.keys(data.freq_posicion).length > 0 && (
            <div className="card p-4 animate-fade-up" style={{ animationDelay: '260ms', animationFillMode: 'both' }}>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Posiciones Favoritas</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.freq_posicion)
                  .sort(([, a], [, b]) => b - a).slice(0, 8)
                  .map(([pos, frec]) => (
                    <div key={pos} className="flex flex-col items-center px-3 py-2 rounded-lg"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <span className="text-xs text-muted">{pos}°</span>
                      <span className="font-mono-custom font-bold text-sm"
                        style={{ color: 'var(--accent-cyan)' }}>{frec}×</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Día favorito */}
          <PanelDiaFavorito fechas={data.todas_fechas} />

          {/* ROI + Top mejores saldos */}
          <PanelRoi
            numero={numero}
            cifras={filters.cifras}
            hasta={filters.hasta}
            filters={filters}
            filtersKey={JSON.stringify(filters.toParamsConPos?.() ?? filters.toParams())}
          />

          {/* Últimas apariciones */}
          <div className="card animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Últimas Apariciones</p>
              {loadingModal && <span className="text-xs animate-pulse" style={{ color: 'var(--accent-cyan)' }}>Cargando…</span>}
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data.ultimas_apariciones?.length === 0 ? (
                <p className="px-4 py-6 text-xs text-center text-muted">Sin registros</p>
              ) : (
                data.ultimas_apariciones.slice().reverse().map((ap) => (
                  <button key={`${ap.idx}-${ap.pos}`}
                    onClick={() => abrirSorteo(ap.idx)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                      transition-colors hover:bg-[var(--bg-elevated)]">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-xs font-mono-custom" style={{ color: 'var(--accent-cyan)' }}>{ap.fecha}</p>
                      <p className="text-xs text-muted capitalize">{ap.turno?.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-xs text-muted">Posición</span>
                      <span className="text-xs font-semibold font-mono-custom px-2 py-0.5 rounded"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                        {ap.pos}°
                      </span>
                    </div>
                    <span className="text-muted text-xs">›</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <p className="text-xs text-muted text-center px-4">
            Los datos son estadística histórica. El azar no puede predecirse — cada sorteo es independiente.
          </p>
        </>
      )}

      {modalSorteo && (
        <SorteoModal sorteo={modalSorteo} cifras={filters.cifras} onClose={() => setModalSorteo(null)} />
      )}
    </div>
  )
}
