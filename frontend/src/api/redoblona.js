/**
 * api/redoblona.js
 * Llamadas al backend de Redoblona.
 */
import axios from 'axios'

const BACKEND = import.meta.env.VITE_API_URL || ''
const BASE = `${BACKEND}/api/redoblona`

export const getAnalizar = (n1, r1, n2, r2, cifras, params = {}) =>
  axios.get(`${BASE}/analizar`, { params: { n1, r1, n2, r2, cifras, ...params } })

export const getRanking = (r1, r2, cifras, top, modo, params = {}) =>
  axios.get(`${BASE}/ranking`, { params: { r1, r2, cifras, top, modo, ...params } })

export const getSugeridas = (r1, r2, cifras, top, ventana) =>
  axios.get(`${BASE}/sugerir`, { params: { r1, r2, cifras, top, ventana } })
