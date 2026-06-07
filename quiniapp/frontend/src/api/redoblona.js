/**
 * api/redoblona.js
 * Llamadas al backend de Redoblona.
 */
import axios from 'axios'

import { API_BASE } from './config'
const BASE = `${API_BASE}/redoblona`

export const getAnalizar = (n1, r1, n2, r2, cifras, params = {}) =>
  axios.get(`${BASE}/analizar`, { params: { n1, r1, n2, r2, cifras, ...params } })

export const getRanking = (r1, r2, cifras, top, modo, params = {}) =>
  axios.get(`${BASE}/ranking`, { params: { r1, r2, cifras, top, modo, ...params } })

export const getSugeridas = (r1, r2, cifras, top, ventana) =>
  axios.get(`${BASE}/sugerir`, { params: { r1, r2, cifras, top, ventana } })
