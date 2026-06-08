/**
 * components/ui/BottomNav.jsx
 * Barra de navegación inferior para mobile.
 * Solo visible en pantallas pequeñas (md:hidden).
 */
import { Link, useLocation } from 'react-router-dom'
import { Home, BarChart2, Dices, Settings } from 'lucide-react'

const TABS = [
  { to: '/',         label: 'Inicio',   Icon: Home      },
  { to: '/quiniela', label: 'Quiniela', Icon: BarChart2 },
  { to: '/tombola',  label: 'Tómbola',  Icon: Dices     },
  { to: '/configuracion', label: 'Config', Icon: Settings },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex">
        {TABS.map(({ to, label, Icon }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ color: active ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
