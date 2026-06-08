/**
 * components/ui/Header.jsx
 * Header global con logo, navegación desktop y toggle de tema.
 */
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, BarChart2, FlaskConical, Home, Settings } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const NAV = [
  { to: '/',                  label: 'Inicio',      icon: Home        },
  { to: '/quiniela',          label: 'Quiniela',    icon: BarChart2   },
  { to: '/tombola',           label: 'Tómbola',     icon: BarChart2   },
  { to: '/quiniela/laboratorio', label: 'Lab',      icon: FlaskConical },
  { to: '/configuracion',         label: 'Config',   icon: Settings    },
]

export default function Header() {
  const { isDark, toggle } = useTheme()
  const location = useLocation()

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <header
      className="sticky top-0 z-40 w-full border-b"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-black font-display text-xs font-bold"
            style={{ background: 'var(--accent-cyan)' }}
          >
            Q
          </div>
          <span className="font-display text-sm font-bold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
            QUINI<span style={{ color: 'var(--accent-cyan)' }}>APP</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                isActive(to)
                  ? 'text-accent bg-cyan-DEFAULT/10'
                  : 'text-secondary hover:text-primary'
              }`}
              style={{ color: isActive(to) ? 'var(--accent-cyan)' : undefined }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="btn-ghost p-2 rounded-full"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark
              ? <Sun  className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-blue-400"  />
            }
          </button>
        </div>
      </div>
    </header>
  )
}
