/**
 * api/tombola.js
 * Llamadas al backend de Tómbola.
 * Los filtros temporales se pasan como params: ultimos_n, desde, hasta_fecha
 */
import axios from 'axios'

const BASE = '/api/tombola'

// Construir params de filtro temporal
function filtroParams(filtros = {}) {
  const p = {}
  if (filtros.ultimos_n  != null) p.ultimos_n   = filtros.ultimos_n
  if (filtros.desde)               p.desde       = filtros.desde
  if (filtros.hasta_fecha)         p.hasta_fecha = filtros.hasta_fecha
  return p
}

export const getInfo     = ()     => axios.get(`${BASE}/info`)
export const getSorteo   = (idx)  => axios.get(`${BASE}/sorteo/${idx}`)
export const getMarco    = (k, filtros={}) => axios.get(`${BASE}/marco`, { params: { k, ...filtroParams(filtros) } })
export const getNumero   = (num, filtros={}) =>
  axios.get(`${BASE}/numero/${num}`, { params: filtroParams(filtros) })

export const getCombo    = (nums, filtros={}) =>
  axios.get(`${BASE}/combo`, { params: { nums: nums.join(','), ...filtroParams(filtros) } })

export const getBacktest = (nums, apuesta, filtros={}) =>
  axios.get(`${BASE}/backtest`, { params: { nums: nums.join(','), apuesta, ...filtroParams(filtros) } })

export const getRanking  = (k, top=20, modo='atrasos', filtros={}) =>
  axios.get(`${BASE}/ranking`, { params: { k, top, modo, ...filtroParams(filtros) } })

export const getSugeridas = (k, top=10, filtros={}) =>
  axios.get(`${BASE}/sugerir`, { params: { k, top, ...filtroParams(filtros) } })
