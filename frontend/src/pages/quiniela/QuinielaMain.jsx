/**
 * pages/quiniela/QuinielaMain.jsx
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { RefreshCw, ChevronRight, Hash, Clock } from 'lucide-react'

import NumberCard   from '../../components/quiniela/NumberCard'
import SorteoViewer from '../../components/quiniela/SorteoViewer'
import FilterBar    from '../../components/ui/FilterBar'
import { SkeletonGrid, SkeletonCard } from '../../components/ui/Skeleton'
import ErrorMessage from '../../components/ui/ErrorMessage'

import { useFiltersQuiniela } from '../../hooks/useQuiniela'
import { getInfo, getRanking, getRacha, getGapsCortos } from '../../api/quiniela'

const MENSAJES = [
  'Los números no tienen memoria. Cada sorteo es independiente.',
  'La estadística describe el pasado — no predice el futuro.',
  'Jugar es entretenimiento. El azar no se puede controlar.',
  'Si el juego deja de ser divertido, es momento de parar.',
  'Ante cualquier problema con el juego: línea de ayuda 0800 4444.',
]
const getMensaje = () => MENSAJES[new Date().getDate() % MENSAJES.length]

// Convierte DD/MM/YY del dataset a YYYY-MM-DD para el input date
function toISO(fechaDDMMYY) {
  if (!fechaDDMMYY) return ''
  const [d, m, y] = fechaDDMMYY.split('/')
  return `20${y}-${m}-${d}`
}
// Fecha de hoy en YYYY-MM-DD
const HOY = new Date().toISOString().split('T')[0]

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <Icon className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
      <div>
        <p className="text-xs text-muted leading-none">{label}</p>
        <p className="text-xs font-bold font-mono-custom" style={{ color: 'var(--text-primary)' }}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  )
}

// Columna de números compacta
function ColNumeros({ titulo, items, cifras, onClickNumero, loading }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{titulo}</p>
      {loading ? (
        <div className="space-y-1">
          {Array.from({length:8}).map((_,i) => (
            <div key={i} className="skeleton h-8 rounded-lg" style={{animationDelay:`${i*40}ms`}} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {items.slice(0,20).map((item, i) => {
            const gColor = item.gap_actual <= 20 ? '#22C55E'
              : item.gap_actual <= 100 ? '#F59E0B' : '#EF4444'
            return (
              <button
                key={item.numero}
                onClick={() => onClickNumero(item.numero)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg
                  hover:bg-[var(--bg-elevated)] transition-colors animate-fade-up text-left"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  animationDelay: `${i * 25}ms`,
                  animationFillMode: 'both',
                }}
              >
                <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {item.numero}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-custom" style={{ color: 'var(--text-muted)' }}>
                    {item.salidas}×
                  </span>
                  <span className="text-xs font-mono-custom font-bold" style={{ color: gColor }}>
                    {item.gap_actual}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function QuinielaMain() {
  const navigate = useNavigate()
  const filters  = useFiltersQuiniela()

  const [info,       setInfo]       = useState(null)
  const [atrasados,  setAtrasados]  = useState([])
  const [salidores,  setSalidores]  = useState([])
  const [racha,      setRacha]      = useState([])
  const [regulares,  setRegulares]  = useState([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    getInfo().then(r => setInfo(r.data)).catch(() => {})
  }, [])

  // Usar ref para capturar siempre el estado actual de filters
  const filtersSnap = {
    cifras:   filters.cifras,
    hasta:    filters.hasta,
    diaSemana: filters.diaSemana,
    diaMes:    filters.diaMes,
    mes:       filters.mes,
    toParams:  filters.toParams,
    toParamsConPos: filters.toParamsConPos,
  }

  const cargarRanking = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = filters.toParamsConPos?.() ?? filters.toParams()
      console.log('[QuinielaMain] params enviados:', params)
      const [rA, rS, rR, rG] = await Promise.all([
        getRanking(filters.cifras, filters.hasta, 'atrasos',    20, params),
        getRanking(filters.cifras, filters.hasta, 'frecuencia', 20, params),
        getRacha(filters.cifras, filters.hasta, 10, params),
        getGapsCortos(filters.cifras, filters.hasta, 20, params),
      ])
      setAtrasados(rA.data)
      setSalidores(rS.data)
      setRacha(rR.data)
      setRegulares(rG.data)
    } catch (e) {
      console.error('[QuinielaMain] Error:', e.response?.status, e.response?.data, e.message)
      setError(e.response?.data?.detail || `Error ${e.response?.status || ''}: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [filters.cifras, filters.hasta, filters.diaSemana, filters.diaMes, filters.mes,
      filters.toParamsConPos, filters.toParams])

  // Recargar cuando cambian CUALQUIER filtro del context
  useEffect(() => {
    cargarRanking()
  }, [filters.cifras, filters.hasta, filters.rango, filters.ultN,
      filters.desde, filters.hastaF, filters.posExacta,
      filters.diaSemana, filters.diaMes, filters.mes]) // eslint-disable-line

  const irNumero = (n) => navigate(`/quiniela/numero/${n}`, { state: { cifras: filters.cifras } })

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 pb-24 md:pb-6 space-y-4">

      {/* Mensaje responsable */}
      <div className="flex items-center gap-2.5 rounded-xl px-3 py-2"
        style={{ background: 'var(--bg-card)', borderLeft: '3px solid var(--accent-cyan)' }}>
        <span style={{ color: 'var(--accent-cyan)' }}>ℹ</span>
        <p className="text-xs text-secondary italic">{getMensaje()}</p>
      </div>

      {/* Último sorteo DESTACADO */}
      <div className="rounded-2xl p-px"
        style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.35) 0%, rgba(255,107,53,0.2) 100%)' }}>
        <div className="rounded-2xl px-3 pt-2 pb-3" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-cyan)' }}>
              Sorteos Quiniela
            </p>
            <div className="flex gap-2">
              <StatChip icon={Hash}  label="Total"  value={info?.total?.toLocaleString('es-UY')} />
              <StatChip icon={Clock} label="Desde"  value={info?.primera_fecha} />
            </div>
          </div>
          <SorteoViewer
            totalSorteos={info?.total}
            cifras={filters.cifras}
            onNumeroClick={irNumero}
          />
        </div>
      </div>

      {/* Filtros reactivos */}
      <FilterBar filters={filters} onApply={cargarRanking} minFecha={toISO(info?.primera_fecha)} maxFecha={HOY} />

      {/* Header rankings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted" />}
          <p className="text-xs text-muted">
            {filters.cifras} cifra{filters.cifras > 1 ? 's' : ''} · Top {filters.hasta}
          </p>
        </div>
        <Link to="/quiniela/estadisticas"
          className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
          style={{ color: 'var(--accent-cyan)' }}>
          Estadísticas completas <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Error */}
      {error && <ErrorMessage message={error} onRetry={cargarRanking} />}

      {/* Grid de 4 columnas */}
      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ColNumeros titulo="Más Atrasados"  items={atrasados} cifras={filters.cifras} onClickNumero={irNumero} loading={loading} />
          <ColNumeros titulo="Más Salidores"  items={salidores} cifras={filters.cifras} onClickNumero={irNumero} loading={loading} />
          <ColNumeros titulo="En Racha"        items={racha}     cifras={filters.cifras} onClickNumero={irNumero} loading={loading} />
          <ColNumeros titulo="Más Regulares"   items={regulares} cifras={filters.cifras} onClickNumero={irNumero} loading={loading} />
        </div>
      )}

      <p className="text-xs text-muted text-center">
        Click en cualquier número para ver su análisis completo
      </p>
    </div>
  )
}
