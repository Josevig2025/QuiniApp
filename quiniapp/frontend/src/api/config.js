/**
 * api/config.js
 * URL base del backend.
 * En desarrollo: usa el proxy de Vite (/api → localhost:8000)
 * En producción: usa la variable de entorno VITE_API_URL
 */
export const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : '/api'
