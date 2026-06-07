/**
 * context/ConfigContext.jsx
 * Estado global de configuración de apariencia.
 * Persiste en localStorage entre sesiones.
 * 
 * Para modificar opciones disponibles ver: CONFIGURACION_PARAMETROS.txt
 */
import { createContext, useContext, useState, useEffect } from 'react'

// ── TIPOGRAFÍAS DISPONIBLES ───────────────────────────────────────────
// Para agregar/cambiar: editar este objeto y agregar la fuente en index.html
export const TIPOGRAFIAS = {
  techno: {
    id:      'techno',
    label:   'Techno',
    sub:     'Orbitron + DM Sans',
    display: '"Orbitron", monospace',
    body:    '"DM Sans", sans-serif',
    google:  'Orbitron:wght@400;600;700;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600',
  },
  legible: {
    id:      'legible',
    label:   'Legible',
    sub:     'Inter — ideal para visión reducida',
    display: '"Inter", sans-serif',
    body:    '"Inter", sans-serif',
    google:  'Inter:wght@300;400;500;600;700;800',
  },
  mixta: {
    id:      'mixta',
    label:   'Mixta',
    sub:     'Rajdhani + Outfit',
    display: '"Rajdhani", sans-serif',
    body:    '"Outfit", sans-serif',
    google:  'Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700',
  },
}

// ── PALETAS DISPONIBLES ───────────────────────────────────────────────
// Para agregar/cambiar: editar este objeto
export const PALETAS = {
  cyan: {
    id:      'cyan',
    label:   'Cyan',
    sub:     'Eléctrico — paleta por defecto',
    preview: ['#00E5FF', '#FF6B35', '#0D0F14'],
    vars: {
      '--accent-cyan':     '#00E5FF',
      '--accent-cyan-dim': '#00B8CC',
      '--accent-ember':    '#FF6B35',
      '--accent-ember-dim':'#CC5228',
      // light mode overrides
      '--accent-cyan-light':     '#0099BB',
      '--accent-ember-light':    '#E05520',
    },
  },
  esmeralda: {
    id:      'esmeralda',
    label:   'Esmeralda',
    sub:     'Verde + Dorado',
    preview: ['#00E676', '#FFD600', '#0A0F0D'],
    vars: {
      '--accent-cyan':     '#00E676',
      '--accent-cyan-dim': '#00B85A',
      '--accent-ember':    '#FFD600',
      '--accent-ember-dim':'#CCA800',
      '--accent-cyan-light':     '#008C47',
      '--accent-ember-light':    '#B89000',
    },
  },
  violeta: {
    id:      'violeta',
    label:   'Violeta',
    sub:     'Púrpura + Naranja',
    preview: ['#C084FC', '#FB923C', '#0F0A14'],
    vars: {
      '--accent-cyan':     '#C084FC',
      '--accent-cyan-dim': '#A855F7',
      '--accent-ember':    '#FB923C',
      '--accent-ember-dim':'#EA7116',
      '--accent-cyan-light':     '#7C3AED',
      '--accent-ember-light':    '#EA580C',
    },
  },
}

// ── DEFAULTS ──────────────────────────────────────────────────────────
const DEFAULT_TIPOGRAFIA = 'techno'
const DEFAULT_PALETA     = 'cyan'

// ── CONTEXT ───────────────────────────────────────────────────────────
const ConfigContext = createContext(null)

export function ConfigProvider({ children }) {
  const [tipografia, setTipografiaState] = useState(
    () => localStorage.getItem('quiniapp-tipografia') || DEFAULT_TIPOGRAFIA
  )
  const [paleta, setPaletaState] = useState(
    () => localStorage.getItem('quiniapp-paleta') || DEFAULT_PALETA
  )

  // Aplicar tipografía al :root
  const aplicarTipografia = (id) => {
    const t = TIPOGRAFIAS[id] || TIPOGRAFIAS[DEFAULT_TIPOGRAFIA]
    document.documentElement.style.setProperty('--font-display', t.display)
    document.documentElement.style.setProperty('--font-body',    t.body)
    // Cargar la fuente Google si no está ya cargada
    const linkId = `gfont-${id}`
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id   = linkId
      link.rel  = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${t.google}&display=swap`
      document.head.appendChild(link)
    }
  }

  // Aplicar paleta al :root
  const aplicarPaleta = (id, isDark) => {
    const p = PALETAS[id] || PALETAS[DEFAULT_PALETA]
    const root = document.documentElement
    // En dark mode usar vars normales, en light las _light si existen
    Object.entries(p.vars).forEach(([key, val]) => {
      if (key.endsWith('-light')) return // skip light-only vars aquí
      if (!isDark) {
        const lightKey = key + '-light'
        const lightVal = p.vars[lightKey]
        root.style.setProperty(key, lightVal || val)
      } else {
        root.style.setProperty(key, val)
      }
    })
  }

  const setTipografia = (id) => {
    setTipografiaState(id)
    localStorage.setItem('quiniapp-tipografia', id)
    aplicarTipografia(id)
  }

  const setPaleta = (id) => {
    setPaletaState(id)
    localStorage.setItem('quiniapp-paleta', id)
    const isDark = document.documentElement.classList.contains('dark')
    aplicarPaleta(id, isDark)
  }

  // Aplicar al montar
  useEffect(() => {
    aplicarTipografia(tipografia)
    const isDark = document.documentElement.classList.contains('dark')
    aplicarPaleta(paleta, isDark)
  }, []) // eslint-disable-line

  // Re-aplicar paleta cuando cambia el tema
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      aplicarPaleta(paleta, isDark)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [paleta]) // eslint-disable-line

  return (
    <ConfigContext.Provider value={{ tipografia, setTipografia, paleta, setPaleta }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}
