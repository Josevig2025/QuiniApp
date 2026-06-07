/**
 * pages/quiniela/Estadisticas.jsx
 * Estadísticas completas de Quiniela.
 * Tabs: Atrasados | Salidores | Regulares | En Racha | Líderes | Análisis Número
 * Features: ordenar por columna, selector cantidad, links de navegación.
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate }  from 'react-router-dom'
import {
  ArrowLeft, ArrowUpDown, TrendingUp, Timer,
  Zap, Crown, Search, ArrowUp, ArrowDown,
} from 'lucide-react'

import FilterBar        from '../../components/ui/FilterBar'
import GapBadge         from '../../components/ui/GapBadge'
import ErrorMessage     from '../../components/ui/ErrorMessage'
import { SkeletonCard } from '../../components/ui/Skeleton'

import { useFiltersQuiniela } from '../../hooks/useQuiniela'
import {
  getRanking, getGapsCortos, getRacha, getLideres,
} from '../../api/quiniela'

// ── Tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'atrasados',   label: 'Atrasados',  Icon: Timer      },
  { id: 'salidores',   label: 'Salidores',  Icon: TrendingUp },
  { id: 'gaps_cortos', label: 'Regulares',  Icon: ArrowUpDown},
  { id: 'racha',       label: 'En Racha',   Icon: Zap        },
  { id: 'lideres',     label: 'Líderes',    Icon: Crown      },
  { id: 'numero',      label: 'Buscar Nº',  Icon: Search     },
]

// ── Máximos por cifras ────────────────────────────────────────────────
const MAX_TOP = { 1: 10, 2: 100, 3: 1000 }

// ── Icono de ordenamiento ─────────────────────────────────────────────
function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />
  return sortDir === 'desc'
    ? <ArrowDown className="w-3 h-3" style={{ color: 'var(--accent-cyan)' }} />
    : <ArrowUp   className="w-3 h-3" style={{ color: 'var(--accent-cyan)' }} />
}

// ── Header de columna clicable ────────────────────────────────────────
function ColHeader({ label, col, sortCol, sortDir, onSort }) {
  return (
    <th
      onClick={() => onSort(col)}
      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
      style={{ color: sortCol === col ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
      </div>
    </th>
  )
}

// ── Tabla genérica con ordenamiento ──────────────────────────────────
function TablaOrdenable({ headers, rows, loading, error, onRetry, sortCol, sortDir, onSort }) {
  if (error)   return <ErrorMessage message={error} onRetry={onRetry} />
  if (loading) return <SkeletonCard rows={12} />
  if (!rows?.length) return (
    <p className="text-center text-xs text-muted py-10">Sin datos para mostrar</p>
  )

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="px-3 py-3 text-left w-8 text-xs font-semibold text-muted">#</th>
              {headers.map(({ label, col }) => (
                col
                  ? <ColHeader key={col} label={label} col={col}
                      sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  : <th key={label} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      {label}
                    </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}
                className="transition-colors hover:bg-[var(--bg-elevated)] animate-fade-up"
                style={{
                  borderBottom: '1px solid var(--border)',
                  animationDelay: `${i * 15}ms`,
                  animationFillMode: 'both',
                }}
              >
                <td className="px-3 py-2.5 text-xs text-muted font-mono-custom">{i + 1}</td>
                {row}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab Buscar Número ─────────────────────────────────────────────────
function TabBuscarNumero({ cifras }) {
  const navigate = useNavigate()
  const [input, setInput] = useState('')

  const ir = () => {
    const n = input.trim()
    if (!n) return
    navigate(`/quiniela/numero/${n}`, { state: { cifras } })
  }

  const KEYS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', 'CE'],
  ]

  const onDigit = (digit) => {
    setInput(prev => (prev + digit).slice(0, cifras))
  }

  const onClear = () => {
    setInput(prev => prev.slice(0, -1))
  }

  const onClearAll = () => {
    setInput('')
  }

  return (
    <div className="card p-6 space-y-4 max-w-sm mx-auto mt-4">

      <p className="text-xs text-muted text-center uppercase tracking-wider">
        Ir directamente al análisis de un número
      </p>

      <div className="flex items-center justify-center gap-3">

        <input
          type="text"
          value={input}
          onChange={e =>
            setInput(
              e.target.value
                .replace(/[^0-9]/g, '')
                .slice(0, cifras)
            )
          }
          onKeyDown={e => e.key === 'Enter' && ir()}
          placeholder={
            cifras === 2
              ? '07'
              : cifras === 3
              ? '007'
              : '7'
          }
          className="field text-center font-display text-2xl"
          style={{
            width: '90px',
            height: '72px',
            color: 'var(--accent-cyan)',
          }}
          maxLength={cifras}
          autoFocus
        />

        <div
          className="rounded-xl p-2 space-y-1"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          {KEYS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'C') return onClear()
                    if (key === 'CE') return onClearAll()
                    onDigit(key)
                  }}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color:
                      key === 'C' || key === 'CE'
                        ? 'var(--accent-cyan)'
                        : 'var(--text-primary)',
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}

          <button
            onClick={ir}
            className="w-full h-8 rounded-lg text-xs font-bold"
            style={{
              background: 'var(--accent-cyan)',
              color: '#000',
            }}
          >
            OK
          </button>
        </div>

      </div>

      <p className="text-xs text-muted text-center">
        También podés hacer click en cualquier número de la tabla
      </p>

    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────
export default function Estadisticas() {
  const navigate = useNavigate()
  const filters  = useFiltersQuiniela()

  const [tab,     setTab]     = useState('atrasados')
  const [data,    setData]    = useState({})
  const [loading, setLoading] = useState({})
  const [errors,  setErrors]  = useState({})
  const [top,     setTop]     = useState(50)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const maxTop = MAX_TOP[filters.cifras] || 100

  // Ajustar top si supera el máximo al cambiar cifras
  useEffect(() => {
    if (top > maxTop) setTop(maxTop)
  }, [filters.cifras]) // eslint-disable-line

  // ── Ordenamiento ────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const sortData = (rows) => {
    if (!sortCol || !rows) return rows
    return [...rows].sort((a, b) => {
      const va = a[sortCol] ?? -Infinity
      const vb = b[sortCol] ?? -Infinity
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }

  // ── Fetch ────────────────────────────────────────────────────────────
  const cargar = useCallback(async (tabId = tab) => {
    if (tabId === 'numero') return
    setLoading(p => ({ ...p, [tabId]: true }))
    setErrors(p => ({ ...p, [tabId]: null }))
    const params = filters.toParamsConPos?.() ?? filters.toParams()
    try {
      let res
      switch (tabId) {
        case 'atrasados':   res = await getRanking(filters.cifras, filters.hasta, 'atrasos',    top, params); break
        case 'salidores':   res = await getRanking(filters.cifras, filters.hasta, 'frecuencia', top, params); break
        case 'gaps_cortos': res = await getGapsCortos(filters.cifras, filters.hasta, top, params); break
        case 'racha':       res = await getRacha(filters.cifras, filters.hasta, top, params); break
        case 'lideres':     res = await getLideres(filters.cifras, filters.hasta, top); break
      }
      setData(p => ({ ...p, [tabId]: res?.data }))
    } catch (e) {
      setErrors(p => ({ ...p, [tabId]: e.response?.data?.detail || 'Error al cargar' }))
    } finally {
      setLoading(p => ({ ...p, [tabId]: false }))
    }
  }, [tab, filters.cifras, filters.hasta, filters.toParams, top])

  // Recargar cuando cambia tab, top o filtros
  useEffect(() => {
    if (tab !== 'numero') {
      setData(p => ({ ...p, [tab]: null }))
      cargar(tab)
    }
  }, [tab, top, filters.cifras, filters.hasta]) // eslint-disable-line

  // ── Celda número clicable ────────────────────────────────────────────
  const celdaNumero = (numero) => (
    <td className="px-3 py-2.5">
      <button
        onClick={() => navigate(`/quiniela/numero/${numero}`, { state: { cifras: filters.cifras } })}
        className="font-display font-bold text-base hover:underline transition-colors"
        style={{ color: 'var(--text-primary)' }}
        title="Ver análisis completo"
      >
        {numero}
      </button>
    </td>
  )

  // ── Filas por tab ─────────────────────────────────────────────────────
  const buildRows = (tabId) => {
    const rows = sortData(data[tabId])
    if (!rows) return []

    const gColor = (v) =>
      v <= 20 ? 'text-green-400' : v <= 100 ? 'text-amber-400' : 'text-red-400'

    switch (tabId) {
      case 'atrasados':
      case 'salidores':
        return rows.map(r => [
          celdaNumero(r.numero),
          <td key="s"  className="px-3 py-2.5 font-mono-custom text-secondary">{r.salidas}</td>,
          <td key="ga" className={`px-3 py-2.5 font-mono-custom font-semibold ${gColor(r.gap_actual)}`}>{r.gap_actual}</td>,
          <td key="gp" className="px-3 py-2.5 font-mono-custom text-secondary">{r.gap_promedio}</td>,
          <td key="gm" className="px-3 py-2.5 font-mono-custom text-secondary">{r.gap_maximo}</td>,
        ])

      case 'gaps_cortos':
        return rows.map(r => [
          celdaNumero(r.numero),
          <td key="gp" className="px-3 py-2.5 font-mono-custom font-semibold" style={{ color: 'var(--accent-cyan)' }}>{r.gap_promedio}</td>,
          <td key="gm" className="px-3 py-2.5 font-mono-custom text-secondary">{r.gap_maximo}</td>,
          <td key="ga" className={`px-3 py-2.5 font-mono-custom ${gColor(r.gap_actual)}`}>{r.gap_actual}</td>,
          <td key="s"  className="px-3 py-2.5 font-mono-custom text-secondary">{r.salidas}</td>,
        ])

      case 'racha':
        return rows.map(r => [
          celdaNumero(r.numero),
          <td key="sc" className="px-3 py-2.5 font-mono-custom font-semibold" style={{ color: 'var(--accent-ember)' }}>{r.score}</td>,
          <td key="fr" className="px-3 py-2.5 font-mono-custom text-secondary">{r.freq_reciente}</td>,
          <td key="gpr" className="px-3 py-2.5 font-mono-custom text-secondary">{r.gap_prom_reciente}</td>,
          <td key="ga" className={`px-3 py-2.5 font-mono-custom ${gColor(r.gap_actual)}`}>{r.gap_actual}</td>,
        ])

      case 'lideres':
        return rows.map(r => [
          celdaNumero(r.numero),
          <td key="a" className="px-3 py-2.5 font-mono-custom font-semibold text-amber-400">{r.atraso}</td>,
          <td key="f" className="px-3 py-2.5 font-mono-custom text-secondary text-xs">{r.fecha}</td>,
        ])

      default: return []
    }
  }

  // ── Headers por tab ───────────────────────────────────────────────────
  const HEADERS = {
    atrasados:   [
      { label: 'Número',    col: null },
      { label: 'Salidas',   col: 'salidas'      },
      { label: 'Gap Act.',  col: 'gap_actual'   },
      { label: 'Gap Prom',  col: 'gap_promedio' },
      { label: 'Gap Máx',   col: 'gap_maximo'   },
    ],
    salidores:   [
      { label: 'Número',    col: null },
      { label: 'Salidas',   col: 'salidas'      },
      { label: 'Gap Act.',  col: 'gap_actual'   },
      { label: 'Gap Prom',  col: 'gap_promedio' },
      { label: 'Gap Máx',   col: 'gap_maximo'   },
    ],
    gaps_cortos: [
      { label: 'Número',    col: null },
      { label: 'Gap Prom ↑',col: 'gap_promedio' },
      { label: 'Gap Máx',   col: 'gap_maximo'   },
      { label: 'Gap Act.',  col: 'gap_actual'   },
      { label: 'Salidas',   col: 'salidas'      },
    ],
    racha:       [
      { label: 'Número',    col: null },
      { label: 'Score',     col: 'score'            },
      { label: 'Frec Rec',  col: 'freq_reciente'    },
      { label: 'Gap Rec',   col: 'gap_prom_reciente'},
      { label: 'Gap Act.',  col: 'gap_actual'       },
    ],
    lideres:     [
      { label: 'Número',    col: null },
      { label: 'Atraso',    col: 'atraso' },
      { label: 'Fecha',     col: null     },
    ],
  }

  const DESCRIPCIONES = {
    atrasados:   `Números con mayor tiempo sin aparecer. Click en columna para reordenar.`,
    salidores:   `Números con mayor frecuencia histórica. Click en columna para reordenar.`,
    gaps_cortos: `Números con menor gap promedio — los más regulares y constantes.`,
    racha:       `Score de actividad reciente: frecuencia + regularidad en últimas apariciones.`,
    lideres:     `Historial de cuándo salió el número más atrasado y con qué atraso.`,
    numero:      `Ingresá un número para ir directamente a su análisis completo.`,
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/quiniela')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Estadísticas
          </h1>
          <p className="text-xs text-muted">Quiniela Uruguay</p>
        </div>
        {/* Link rápido al Laboratorio */}
        <button
          onClick={() => navigate('/quiniela/laboratorio')}
          className="ml-auto btn-ghost text-xs flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          Laboratorio
        </button>
      </div>

      {/* Filtros */}
      <FilterBar
        filters={filters}
        onApply={() => {
          setData(p => ({ ...p, [tab]: null }))
          cargar(tab)
        }}
      />

      {/* Selector de cantidad */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted">Mostrar</span>
        {[20, 50, 100, ...(filters.cifras === 3 ? [500, 1000] : [])].map(n => (
          <button key={n} onClick={() => setTop(n)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono-custom transition-all ${
              top === n ? 'bg-cyan-DEFAULT/20 text-accent' : 'text-muted'
            }`}
            style={top === n ? { color: 'var(--accent-cyan)' } : {}}>
            {n}
          </button>
        ))}
        <span className="text-xs text-muted">(máx {maxTop} para {filters.cifras} cifra{filters.cifras > 1 ? 's' : ''})</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'var(--bg-card)' }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
              whitespace-nowrap transition-all flex-shrink-0 ${
              tab === id ? 'text-black shadow-sm' : 'text-secondary hover:text-primary'
            }`}
            style={tab === id ? { background: 'var(--accent-cyan)' } : {}}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Descripción */}
      <p className="text-xs text-secondary px-1">{DESCRIPCIONES[tab]}</p>

      {/* Contenido */}
      {tab === 'numero' ? (
        <TabBuscarNumero cifras={filters.cifras} />
      ) : (
        <TablaOrdenable
          headers={HEADERS[tab] || []}
          rows={buildRows(tab)}
          loading={loading[tab]}
          error={errors[tab]}
          onRetry={() => cargar(tab)}
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}

      {/* Footer con links */}
      <div className="flex items-center justify-between text-xs text-muted pt-2">
        <span>Click en cualquier número → análisis completo</span>
        <button onClick={() => navigate('/quiniela/laboratorio')}
          className="hover:text-accent transition-colors"
          style={{ color: 'var(--accent-cyan)' }}>
          Ir al Laboratorio →
        </button>
      </div>
    </div>
  )
}
