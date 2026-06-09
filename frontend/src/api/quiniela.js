/**
 * api/quiniela.js
 * Todas las llamadas al backend de Quiniela en un solo lugar.
 * Usa el proxy de Vite: /api → http://localhost:8000
 */
import axios from 'axios'

const BACKEND = import.meta.env.VITE_API_URL || ''
const BASE = 'https://quiniapp-2.onrender.com/quiniela'



/** Construye los parámetros de filtro temporal en formato query */
function filtroParams(filtros = {}) {
  const p = {}
  if (filtros.idx_min     != null) p.idx_min     = filtros.idx_min
  if (filtros.idx_max     != null) p.idx_max     = filtros.idx_max
  if (filtros.desde)               p.desde       = filtros.desde
  if (filtros.hasta_fecha)         p.hasta_fecha = filtros.hasta_fecha
  if (filtros.ultimo_anio)         p.ultimo_anio = true
  if (filtros.ultimo_mes)          p.ultimo_mes  = true
  if (filtros.ultimos_n   != null) p.ultimos_n   = filtros.ultimos_n
  if (filtros.pos_exacta  != null) p.pos_exacta  = filtros.pos_exacta
  if (filtros.dia_semana?.length)  p.dia_semana  = Array.isArray(filtros.dia_semana) ? filtros.dia_semana.join(',') : filtros.dia_semana
  if (filtros.dia_mes?.length)     p.dia_mes     = Array.isArray(filtros.dia_mes)     ? filtros.dia_mes.join(',')     : filtros.dia_mes
  if (filtros.mes?.length)         p.mes         = Array.isArray(filtros.mes)         ? filtros.mes.join(',')         : filtros.mes
  return p
}

// ── Información general ───────────────────────────────────────────────
export const getInfo      = ()        => axios.get(`${BASE}/info`)
export const getSorteo    = (idx)     => axios.get(`${BASE}/sorteo/${idx}`)
export const getRecientes = (cant=20) => axios.get(`${BASE}/recientes`, { params: { cantidad: cant } })

// ── Análisis de número ────────────────────────────────────────────────
export const getAnalisisNumero = (numero, cifras, hasta, filtros={}) =>
  axios.get(`${BASE}/numero/${numero}`, {
    params: { cifras, hasta, ...filtroParams(filtros) },
  })

// ── Rankings ─────────────────────────────────────────────────────────
export const getRanking = (cifras, hasta, modo, top=20, filtros={}) =>
  axios.get(`${BASE}/ranking`, {
    params: { cifras, hasta, modo, top, ...filtroParams(filtros) },
  })

export const getGapsCortos = (cifras, hasta, top=20, filtros={}) =>
  axios.get(`${BASE}/gaps-cortos`, {
    params: { cifras, hasta, top, ...filtroParams(filtros) },
  })

export const getLideres = (cifras, hasta, top=20, orden='atraso') =>
  axios.get(`${BASE}/lideres`, { params: { cifras, hasta, top, orden } })

export const getRacha = (cifras, hasta, top=10, filtros={}) =>
  axios.get(`${BASE}/racha`, {
    params: { cifras, hasta, top, ...filtroParams(filtros) },
  })

// ── Salidas ───────────────────────────────────────────────────────────
export const getSalidas = (cifras, hasta, filtros={}) =>
  axios.get(`${BASE}/salidas`, {
    params: { cifras, hasta, ...filtroParams(filtros) },
  })

// ── Sugerir ───────────────────────────────────────────────────────────
export const getSugeridas = (cifras, hasta, top=5, ventana=300) =>
  axios.get(`${BASE}/sugerir`, { params: { cifras, hasta, top, ventana } })

// ── Backtest ─────────────────────────────────────────────────────────
export const getBacktest = (numero, cifras, hasta, apuesta, filtros={}) =>
  axios.get(`${BASE}/backtest/${numero}`, {
    params: { cifras, hasta, apuesta, ...filtroParams(filtros) },
  })

export const getSorteoPorFecha = (fecha) =>
  axios.get(`${BASE}/por-fecha`, { params: { fecha } })

export const getTopRoi = (cifras, hasta, top=10, filtros={}) =>
  axios.get(`${BASE}/top-roi`, {
    params: { cifras, hasta, top, ...filtroParams(filtros) },
  })
