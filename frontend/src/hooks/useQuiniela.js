/**
 * hooks/useQuiniela.js
 * Hook de filtros de Quiniela.
 * Usa el QuinielaContext global para persistir entre pantallas.
 * Si no hay context disponible (ej: fuera de rutas /quiniela),
 * cae en estado local como fallback.
 */
import { useState, useCallback, useContext } from 'react'
import { QuinielaContext } from '../context/QuinielaContext'

export function useFiltersQuiniela() {
  // Intentar usar el context global primero
  const ctx = useContext(QuinielaContext)
  if (ctx) return ctx

  // Fallback: estado local (no debería ocurrir dentro de rutas /quiniela)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [cifras,    setCifras]    = useState(3)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [hasta,     setHasta]     = useState(20)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [rango,     setRango]     = useState('todo')
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [ultN,      setUltN]      = useState(300)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [desde,     setDesde]     = useState('')
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [hastaF,    setHastaF]    = useState('')

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const toParams = useCallback(() => {
    switch (rango) {
      case 'anio':   return { ultimo_anio: true }
      case 'mes':    return { ultimo_mes:  true }
      case 'n':      return { ultimos_n: ultN }
      case 'custom': {
        const p = {}
        if (desde)  p.desde       = desde
        if (hastaF) p.hasta_fecha = hastaF
        return p
      }
      default: return {}
    }
  }, [rango, ultN, desde, hastaF])

  return {
    cifras, setCifras, hasta, setHasta,
    rango, setRango, ultN, setUltN,
    desde, setDesde, hastaF, setHastaF,
    diaSemana: [], diaMes: [],
    toParams,
  }
}

export function useApiCall(apiFn) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      setData(res.data)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error desconocido'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  return { data, loading, error, execute }
}
