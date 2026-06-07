/**
 * context/QuinielaContext.jsx
 * Estado global de filtros de Quiniela.
 * Persiste entre pantallas durante la sesión.
 * Se resetea solo cuando el usuario cambia un filtro manualmente.
 */
import { createContext, useContext, useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'

export const QuinielaContext = createContext(null)

export function QuinielaProvider() {
  const [cifras,  setCifras]  = useState(3)   // default 3 cifras
  const [hasta,   setHasta]   = useState(20)
  const [rango,   setRango]   = useState('todo')
  const [ultN,    setUltN]    = useState(300)
  const [desde,   setDesde]   = useState('')
  const [hastaF,  setHastaF]  = useState('')
  const [diaSemana,  setDiaSemana]  = useState([])
  const [diaMes,     setDiaMes]     = useState([])
  const [posExacta,  setPosExacta]  = useState(null)   // null = todos los premios

  const toParams = useCallback(() => {
    const p = {}
    switch (rango) {
      case 'anio':   p.ultimo_anio = true; break
      case 'mes':    p.ultimo_mes  = true; break
      case 'n':      p.ultimos_n   = ultN; break
      case 'custom':
        if (desde)  p.desde       = desde
        if (hastaF) p.hasta_fecha = hastaF
        break
      default: break
    }
    // Filtros avanzados
    if (diaSemana?.length) p.dia_semana = diaSemana.join(',')
    if (diaMes?.length)    p.dia_mes    = diaMes.join(',')
    return p
  }, [rango, ultN, desde, hastaF, diaSemana, diaMes])

  // Agregar pos_exacta a cualquier llamada que lo necesite
  const toParamsConPos = useCallback(() => {
    const p = toParams()
    if (posExacta !== null) p.pos_exacta = posExacta
    return p
  }, [toParams, posExacta])

  const value = {
    cifras,  setCifras,
    hasta,   setHasta,
    rango,   setRango,
    ultN,    setUltN,
    desde,   setDesde,
    hastaF,  setHastaF,
    diaSemana,  setDiaSemana,
    diaMes,     setDiaMes,
    posExacta,  setPosExacta,
    toParams,
    toParamsConPos,
  }

  return (
    <QuinielaContext.Provider value={value}>
      <Outlet />
    </QuinielaContext.Provider>
  )
}

export function useQuinielaContext() {
  const ctx = useContext(QuinielaContext)
  if (!ctx) throw new Error('useQuinielaContext debe usarse dentro de QuinielaProvider')
  return ctx
}
