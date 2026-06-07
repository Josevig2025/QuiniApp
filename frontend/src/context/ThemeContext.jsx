/**
 * context/ThemeContext.jsx
 * Maneja dark/light mode.
 * Persiste la preferencia en localStorage.
 * Aplica la clase 'dark' o 'light' en <html>.
 */
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Leer preferencia guardada, o usar dark por defecto
    return localStorage.getItem('quiniapp-theme') || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    localStorage.setItem('quiniapp-theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Hook de acceso rápido */
export function useTheme() {
  return useContext(ThemeContext)
}
