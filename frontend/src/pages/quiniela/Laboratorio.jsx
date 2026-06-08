/**
 * pages/quiniela/Laboratorio.jsx
 * Laboratorio de Quiniela: Backtesting y Sugerencias de jugada.
 *
 * Secciones:
 *   1. Tabs: Backtest | Sugeridas
 *   2. Backtest: elegir número, cifras, premios, monto, período → resultado económico
 *   3. Sugeridas: candidatos por frecuencia reciente + atraso moderado
 */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, FlaskConical, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'

import FilterBar        from '../../components/ui/FilterBar'
import GapBadge         from '../../components/ui/GapBadge'
import ErrorMessage     from '../../components/ui/ErrorMessage'
import { SkeletonCard } from '../../components/ui/Skeleton'

import { useFiltersQuiniela } from '../../hooks/useQuiniela'
import { getBacktest, getSugeridas } from '../../api/quiniela'

// ── Tabla de pagos de referencia (informativa) ────────────────────────
const PAGOS_REF = {
  1: { 1: 7,   5: 1.4,  10: 0.7,  20: 0.35 },
  2: { 1: 70,  5: 14,   10: 7,    20: 3.5  },
  3: { 1: 500, 5: 100,  10: 50,   20: 25   },
}

function PagosTable({ cifras, hasta }) {
  const pagos = PAGOS_REF[cifras] || {}
  const rangos = Object.entries(pagos).filter(([r]) => Number(r) <= hasta)
  return (
    <div className="flex flex-wrap gap-2">
      {rangos.map(([rango, mult]) => (
        <div
          key={rango}
          className="flex flex-col items-center px-3 py-2 rounded-lg"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <span className="text-xs text-muted">Top {rango}</span>
          <span className="font-mono-custom font-bold text-sm" style={{ color: 'var(--accent-cyan)' }}>
            ×{mult}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Panel de resultado del backtest ──────────────────────────────────
function ResultadoBacktest({ resultado }) {
  if (!resultado) return null

  const { numero, sorteos, total_apostado, total_ganado, balance, roi, multiplicador, premios_detalle } = resultado
  const positivo = balance >= 0

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Resumen económico */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Sorteos',       valor: sorteos.toLocaleString('es-UY'),           color: false },
          { label: 'Total apostado', valor: `$${total_apostado.toLocaleString('es-UY')}`, color: false },
          { label: 'Total ganado',   valor: `$${total_ganado.toLocaleString('es-UY')}`,   color: false },
          { label: 'Balance',        valor: `${positivo ? '+' : ''}$${balance.toLocaleString('es-UY')}`,
            color: positivo ? 'text-green-400' : 'text-red-400' },
        ].map(({ label, valor, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className={`font-display text-xl font-bold ${color || ''}`}
               style={!color ? { color: 'var(--text-primary)' } : {}}>
              {valor}
            </p>
          </div>
        ))}
      </div>

      {/* ROI destacado */}
      <div
        className="card p-4 flex items-center justify-between"
        style={{ borderLeft: `3px solid ${positivo ? '#22C55E' : '#EF4444'}` }}
      >
        <div>
          <p className="text-xs text-muted">ROI (retorno sobre inversión)</p>
          <p className={`font-display text-3xl font-black ${positivo ? 'text-green-400' : 'text-red-400'}`}>
            {roi > 0 ? '+' : ''}{roi}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Multiplicador aplicado</p>
          <p className="font-mono-custom font-bold text-lg" style={{ color: 'var(--accent-cyan)' }}>
            ×{multiplicador}
          </p>
        </div>
      </div>

      {/* Detalle de premios por posición */}
      {Object.keys(premios_detalle).length > 0 && (
        <div className="card p-4">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Premios por posición</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(premios_detalle)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([pos, veces]) => (
                <div
                  key={pos}
                  className="flex flex-col items-center px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <span className="text-xs text-muted">Pos {pos}°</span>
                  <span className="font-mono-custom font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {veces}×
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div
        className="flex items-start gap-2 rounded-xl p-3"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-secondary">
          El backtesting muestra resultados <strong>históricos</strong>. 
          El rendimiento pasado no garantiza resultados futuros. 
          Cada sorteo es un evento independiente.
        </p>
      </div>
    </div>
  )
}

// ── Panel de sugeridas ────────────────────────────────────────────────
function PanelSugeridas({ sugeridas, cifras, onVerNumero }) {
  if (!sugeridas?.length) return (
    <p className="text-center text-xs text-muted py-8">Sin candidatos para los filtros seleccionados</p>
  )

  return (
    <div className="space-y-2">
      {sugeridas.map((s, i) => (
        <button
          key={s.numero}
          onClick={() => onVerNumero(s.numero)}
          className="w-full card-clickable p-4 flex items-center gap-4 animate-fade-up"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
        >
          {/* Ranking */}
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            {i + 1}
          </span>

          {/* Número */}
          <span className="font-display text-2xl font-black" style={{ color: 'var(--accent-cyan)' }}>
            {s.numero}
          </span>

          {/* Stats */}
          <div className="flex gap-4 flex-1 justify-end">
            <div className="text-right">
              <p className="text-xs text-muted">Frec reciente</p>
              <p className="font-mono-custom font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {s.freq_reciente}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Atraso</p>
              <GapBadge value={s.atraso} />
            </div>
          </div>

          <span className="text-muted text-sm flex-shrink-0">›</span>
        </button>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────
// ── Numpad ───────────────────────────────────────────────────────────
function Numpad({ onDigit, onClear, onClearAll, cifras }) {
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

export default function Laboratorio() {
  const navigate = useNavigate()
  const location  = useLocation()

  const filters  = useFiltersQuiniela()

  const [tab,    setTab]    = useState('backtest')

  // ── Estado Backtest ─────────────────────────────────────────────────
  const [numero, setNumero] = useState('')
  const [apuesta,    setApuesta]    = useState(100)
  const [resultado,  setResultado]  = useState(null)
  const [loadingBT,  setLoadingBT]  = useState(false)
  const [errorBT,    setErrorBT]    = useState(null)
  const inputRef = useRef(null)

  // ── Estado Sugeridas ────────────────────────────────────────────────
  const [ventana,    setVentana]    = useState(300)
  const [topN,       setTopN]       = useState(10)
  const [sugeridas,  setSugeridas]  = useState(null)
  const [loadingSug, setLoadingSug] = useState(false)
  const [errorSug,   setErrorSug]   = useState(null)

  // Leer número precargado desde AnalisisNumero — después de todos los estados
  useEffect(() => {
    const st = location.state
    if (!st) return
    if (st.numero) setNumero(String(st.numero))
    if (st.cifras) filters.setCifras(st.cifras)
    setTab('backtest')
  }, []) // eslint-disable-line

  // Backtest automático cuando cambia número o apuesta
  useEffect(() => {
    const num = numero.trim()
    if (!num || num.length < filters.cifras) { setResultado(null); return }
    ejecutarBacktest()
  }, [numero, apuesta]) // eslint-disable-line

  // ── Ejecutar backtest ───────────────────────────────────────────────
  const ejecutarBacktest = useCallback(async () => {
    const num = numero.trim()
    if (!num) { setErrorBT('Ingresá un número para analizar'); return }

    setLoadingBT(true)
    setErrorBT(null)
    setResultado(null)
    try {
      const params = filters.toParamsConPos?.() ?? filters.toParams()
      const r = await getBacktest(num, filters.cifras, filters.hasta, apuesta, params)
      setResultado(r.data)
    } catch (e) {
      setErrorBT(e.response?.data?.detail || 'Error al ejecutar el backtest')
    } finally {
      setLoadingBT(false)
    }
  }, [numero, apuesta, filters.cifras, filters.hasta, filters.toParams])

  // Numpad handlers
  const onDigit = (d) => {
    setNumero(prev => {
      if (prev.length >= filters.cifras) return prev
      return prev + d
    })
  }
  const onClear = () => setNumero(prev => prev.slice(0, -1))
  const onClearAll = () => { setNumero(''); setResultado(null) }

  // ── Cargar sugeridas ────────────────────────────────────────────────
  const cargarSugeridas = useCallback(async () => {
    setLoadingSug(true)
    setErrorSug(null)
    try {
      const r = await getSugeridas(filters.cifras, filters.hasta, topN, ventana)
      setSugeridas(r.data.candidatos)
    } catch (e) {
      setErrorSug(e.response?.data?.detail || 'Error al cargar sugerencias')
    } finally {
      setLoadingSug(false)
    }
  }, [filters.cifras, filters.hasta, topN, ventana])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/quiniela')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Laboratorio
            </h1>
            <p className="text-xs text-muted">Quiniela Uruguay</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--bg-card)' }}
      >
        {[
          { id: 'backtest',  label: 'Backtest',   Icon: DollarSign  },
          { id: 'sugeridas', label: 'Sugeridas',  Icon: TrendingUp  },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
              text-sm font-semibold transition-all ${
              tab === id ? 'text-black shadow-sm' : 'text-secondary hover:text-primary'
            }`}
            style={tab === id ? { background: 'var(--accent-cyan)' } : {}}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filtros (compartidos) ─────────────────────────────────────── */}
      <FilterBar filters={filters} />

      {/* ════════════════════════════════════════════════════════════════
          TAB: BACKTEST
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'backtest' && (
        <div className="space-y-4">

          {/* Referencia de pagos */}
          <div className="card p-4">
            <p className="text-xs text-muted uppercase tracking-wider mb-2">
              Multiplicadores de pago — {filters.cifras} cifra{filters.cifras > 1 ? 's' : ''}
            </p>
            <PagosTable cifras={filters.cifras} hasta={filters.hasta} />
          </div>

          {/* Formulario */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Configurar simulación
            </p>

            {/* Número + Numpad */}
            <div className="flex gap-4 items-start">
              <div className="flex flex-col gap-3 flex-1">
                <div>
                  <label className="text-xs text-secondary block mb-1.5">
                    Número a testear
                    {loadingBT && <span className="ml-2 text-muted animate-pulse">Calculando…</span>}
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={numero}
                    onChange={e => setNumero(e.target.value.replace(/[^0-9]/g,'').slice(0, filters.cifras))}
                    placeholder={filters.cifras === 2 ? '07' : filters.cifras === 3 ? '007' : '7'}
                    style={{
                      width: 96, height: 80, fontSize: '2.2rem',
                      fontFamily: 'var(--font-display)', fontWeight: 'bold',
                      textAlign: 'center', borderRadius: 16, outline: 'none',
                      background: numero ? 'var(--bg-card)' : 'var(--bg-elevated)',
                      border: numero ? '2px solid rgba(0,229,255,0.5)' : '2px solid var(--border)',
                      color: numero ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    }}
                  />
                </div>

                {/* Apuesta */}
                <div>
                  <label className="text-xs text-secondary block mb-1.5">Apuesta por sorteo ($)</label>
                  <div className="flex gap-2 flex-wrap">
                    {[50, 100, 200, 500].map(m => (
                      <button key={m} onClick={() => setApuesta(m)}
                        className="px-3 py-1.5 rounded-lg text-sm font-mono-custom transition-all"
                        style={apuesta === m
                          ? { background: 'rgba(0,229,255,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,229,255,0.4)' }
                          : { color: 'var(--text-secondary)', border: '1px solid transparent' }}>
                        ${m}
                      </button>
                    ))}
                    <input type="number" value={apuesta} min={1}
                      onChange={e => setApuesta(Number(e.target.value))}
                      className="field w-24" placeholder="otro" />
                  </div>
                </div>
              </div>

              {/* Numpad */}
              <Numpad onDigit={onDigit} onClear={onClear} onClearAll={onClearAll} cifras={filters.cifras} />
            </div>
          </div>

          {/* Error */}
          {errorBT && <ErrorMessage message={errorBT} onRetry={ejecutarBacktest} />}

          {/* Resultado */}
          {resultado && !loadingBT && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-3 px-1">
                Resultado — número {resultado.numero}
              </p>
              <ResultadoBacktest resultado={resultado} />
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: SUGERIDAS
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'sugeridas' && (
        <div className="space-y-4">

          {/* Disclaimer importante */}
          <div
            className="flex items-start gap-2 rounded-xl p-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-secondary">
              Las sugerencias son candidatos basados en <strong>estadística histórica</strong> —
              frecuencia reciente y atraso moderado. No predicen el futuro.
              Cada sorteo es un evento aleatorio independiente.
            </p>
          </div>

          {/* Configuración */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Parámetros
            </p>

            {/* Ventana de sorteos */}
            <div>
              <label className="text-xs text-secondary block mb-1.5">
                Ventana de análisis (últimos N sorteos)
              </label>
              <div className="flex gap-2 flex-wrap">
                {[100, 200, 300, 500].map(v => (
                  <button
                    key={v}
                    onClick={() => setVentana(v)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono-custom transition-all ${
                      ventana === v
                        ? 'bg-cyan-DEFAULT/20 text-accent border border-cyan-DEFAULT/40'
                        : 'text-secondary border border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad de sugerencias */}
            <div>
              <label className="text-xs text-secondary block mb-1.5">
                Cantidad de candidatos
              </label>
              <div className="flex gap-2">
                {[5, 10, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setTopN(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono-custom transition-all ${
                      topN === n
                        ? 'bg-cyan-DEFAULT/20 text-accent border border-cyan-DEFAULT/40'
                        : 'text-secondary border border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={cargarSugeridas}
              disabled={loadingSug}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loadingSug
                ? <><span className="animate-spin">⟳</span> Buscando…</>
                : <><TrendingUp className="w-4 h-4" /> Buscar Candidatos</>
              }
            </button>
          </div>

          {/* Error */}
          {errorSug && <ErrorMessage message={errorSug} onRetry={cargarSugeridas} />}

          {/* Resultados */}
          {loadingSug && <SkeletonCard rows={5} />}

          {sugeridas && !loadingSug && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-3 px-1">
                {sugeridas.length} candidato{sugeridas.length !== 1 ? 's' : ''} encontrado{sugeridas.length !== 1 ? 's' : ''}
              </p>
              <PanelSugeridas
                sugeridas={sugeridas}
                cifras={filters.cifras}
                onVerNumero={(n) => navigate(`/quiniela/numero/${n}`, { state: { cifras: filters.cifras } })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
