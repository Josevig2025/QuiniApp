/**
 * components/ui/FilterBar.jsx
 * Filtros reactivos — sin botón Aplicar.
 * Cada cambio dispara onApply con debounce de 600ms.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DIAS_MES    = Array.from({ length: 31 }, (_, i) => i + 1)
const PERIODOS    = [
  { value: 'todo',   label: 'Todo'     },
  { value: 'anio',   label: 'Últ. año' },
  { value: 'mes',    label: 'Últ. mes' },
  { value: 'n',      label: 'Últ. N'   },
  { value: 'custom', label: 'Fechas'   },
]

function Chip({ active, onClick, children, small = false }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg font-semibold transition-all border ${
        small ? 'px-1.5 py-1 text-xs min-w-[26px]' : 'px-2.5 py-1.5 text-xs'
      } ${active
        ? 'border-cyan-DEFAULT/40 bg-cyan-DEFAULT/15'
        : 'border-transparent text-muted hover:border-[var(--border)] hover:text-secondary'
      }`}
      style={active ? { color: 'var(--accent-cyan)', borderColor: 'rgba(0,229,255,0.4)' } : {}}
    >
      {children}
    </button>
  )
}

export default function FilterBar({ filters, onApply, minFecha, maxFecha }) {
  const {
    cifras, setCifras,
    hasta,  setHasta,
    rango,  setRango,
    ultN,   setUltN,
    desde,  setDesde,
    hastaF, setHastaF,
    posExacta,  setPosExacta,
  } = filters

  const [expandido, setExpandido] = useState(false)

  // Usar setters del context si existen, si no estado local como fallback
  const diaSemana    = filters.diaSemana    || []
  const diaMes       = filters.diaMes       || []
  const mes          = filters.mes          || []
  const setDiaSemana = filters.setDiaSemana || (() => {})
  const setDiaMes    = filters.setDiaMes    || (() => {})
  const setMes       = filters.setMes       || (() => {})

  // Ref siempre apunta a la función onApply más reciente
  const onApplyRef = useRef(onApply)
  useEffect(() => { onApplyRef.current = onApply }, [onApply])

  const timerRef = useRef(null)
  const disparar = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onApplyRef.current?.()
    }, 600)
  }, [])

  // Disparar en cada cambio de filtro
  useEffect(() => { disparar() }, [cifras, hasta, rango, ultN, posExacta, JSON.stringify(diaSemana), JSON.stringify(diaMes), JSON.stringify(mes)]) // eslint-disable-line

  // Para fechas: disparar cuando cambia cualquiera (no requerir ambas)
  useEffect(() => {
    if (rango === 'custom') disparar()
  }, [desde, hastaF]) // eslint-disable-line

  const toggleDS = (i) => setDiaSemana(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  const toggleDM = (d) => setDiaMes(p =>    p.includes(d) ? p.filter(x => x !== d) : [...p, d])
  const toggleM  = (m) => setMes(p =>       p.includes(m) ? p.filter(x => x !== m) : [...p, m])
  const hayAvanzados = diaSemana.length > 0 || diaMes.length > 0 || mes.length > 0

  return (
    <div className="card p-3 space-y-3">

      {/* Fila principal */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 items-end">

        {/* Cifras */}
        <div>
          <p className="text-xs text-muted mb-1">Cifras</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(c => (
              <Chip key={c} active={cifras === c} onClick={() => setCifras(c)}>{c}</Chip>
            ))}
          </div>
        </div>

        {/* Premios hasta / Posición exacta — mutuamente excluyentes */}
        <div>
          <p className="text-xs text-muted mb-1">
            {posExacta ? 'Posición exacta' : 'Premios hasta'}
          </p>
          <div className="flex gap-1.5 items-center">
            {/* Selector de premios — deshabilitado si hay posición exacta */}
            <select
              value={posExacta ? '' : hasta}
              disabled={!!posExacta}
              onChange={e => {
                setHasta(Number(e.target.value))
                setPosExacta?.(null)
              }}
              className="field text-xs py-1"
              style={{ opacity: posExacta ? 0.4 : 1 }}
            >
              {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(v => (
                <option key={v} value={v}>{v === 1 ? '1° Premio' : `Top ${v}`}</option>
              ))}
            </select>

            <span className="text-xs text-muted">ó</span>

            {/* Selector de posición exacta — deshabilitado si hay rango */}
            <select
              value={posExacta ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? null : Number(e.target.value)
                setPosExacta?.(val)
                // Al elegir posición exacta, "hasta" se fija en esa posición
                if (val !== null) setHasta(val)
              }}
              className="field text-xs py-1"
              title="Posición exacta"
            >
              <option value="">Pos. exacta</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(p => (
                <option key={p} value={p}>{p === 1 ? '1° exacto' : `${p}° exacto`}</option>
              ))}
            </select>

            {/* Botón limpiar posición exacta */}
            {posExacta && (
              <button
                onClick={() => setPosExacta?.(null)}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ color: 'var(--accent-ember)', background: 'rgba(255,107,53,0.1)' }}
                title="Volver a rango"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Período */}
        <div>
          <p className="text-xs text-muted mb-1">Período</p>
          <div className="flex gap-1 flex-wrap">
            {PERIODOS.map(op => (
              <Chip key={op.value} active={rango === op.value} onClick={() => setRango(op.value)}>
                {op.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* N sorteos */}
        {rango === 'n' && (
          <div>
            <p className="text-xs text-muted mb-1">Cantidad</p>
            <input type="number" value={ultN} min={10} max={10500}
              onChange={e => setUltN(Number(e.target.value))}
              className="field w-20 text-xs" />
          </div>
        )}

        {/* Rango de fechas */}
        {rango === 'custom' && (
          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <p className="text-xs text-muted mb-1">Desde</p>
              <input type="date" value={desde}
                onChange={e => setDesde(e.target.value)}
                min={minFecha} max={maxFecha}
                className="field text-xs py-1"
                style={{ colorScheme: 'dark', width: 140 }} />
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Hasta</p>
              <input type="date" value={hastaF}
                onChange={e => setHastaF(e.target.value)}
                min={minFecha} max={maxFecha}
                className="field text-xs py-1"
                style={{ colorScheme: 'dark', width: 140 }} />
            </div>
          </div>
        )}
      </div>

      {/* Toggle avanzados */}
      <button onClick={() => setExpandido(p => !p)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors">
        {expandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Filtros avanzados
        {hayAvanzados && (
          <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'var(--accent-cyan)', color: '#000' }}>
            {diaSemana.length + diaMes.length + mes.length}
          </span>
        )}
      </button>

      {expandido && (
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs text-muted">Día de la semana</p>
              {diaSemana.length > 0 && (
                <button onClick={() => setDiaSemana([])} className="text-xs underline text-muted">Todos</button>
              )}
            </div>
            <div className="flex gap-1 flex-wrap">
              {DIAS_SEMANA.map((d, i) => (
                <Chip key={d} active={diaSemana.includes(i)} onClick={() => toggleDS(i)}>{d}</Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs text-muted">Día del mes</p>
              {diaMes.length > 0 && (
                <button onClick={() => setDiaMes([])} className="text-xs underline text-muted">Todos</button>
              )}
            </div>
            <div className="flex gap-1 flex-wrap">
              {DIAS_MES.map(d => (
                <Chip key={d} active={diaMes.includes(d)} onClick={() => toggleDM(d)} small>{d}</Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs text-muted">Mes del año</p>
              {mes.length > 0 && (
                <button onClick={() => setMes([])} className="text-xs underline text-muted">Todos</button>
              )}
            </div>
            <div className="flex gap-1 flex-wrap">
              {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((nm, i) => (
                <Chip key={nm} active={mes.includes(i+1)} onClick={() => toggleM(i+1)}>{nm}</Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
