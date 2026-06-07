/**
 * App.jsx
 * Router principal de QuiniApp.
 * Define todas las rutas y el layout global (Header + BottomNav).
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'

import Header       from './components/ui/Header'
import SplashScreen from './components/ui/SplashScreen'
import BottomNav  from './components/ui/BottomNav'

import Home            from './pages/Home'
import QuinielaMain    from './pages/quiniela/QuinielaMain'
import AnalisisNumero  from './pages/quiniela/AnalisisNumero'
import Estadisticas    from './pages/quiniela/Estadisticas'
import Laboratorio     from './pages/quiniela/Laboratorio'
import TombolaMain     from './pages/tombola/TombolaMain'
import RedoblonaMain   from './pages/redoblona/RedoblonaMain'
import { QuinielaProvider } from './context/QuinielaContext'
import { ConfigProvider }   from './context/ConfigContext'
import Configuracion        from './pages/Configuracion'
import Placeholder     from './pages/Placeholder'

export default function App() {
  return (
    <ConfigProvider>
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

          {/* Splash de bienvenida — una vez por día */}
          <SplashScreen />

          {/* Header global */}
          <Header />

          {/* Contenido de cada ruta */}
          <main className="flex-1">
            <Routes>
              {/* Inicio */}
              <Route path="/"   element={<Home />} />

              {/* Quiniela — comparte filtros via QuinielaProvider */}
              <Route path="/quiniela" element={<QuinielaProvider />}>
                <Route index                        element={<QuinielaMain />} />
                <Route path="estadisticas"          element={<Estadisticas />} />
                <Route path="numero/:numero"        element={<AnalisisNumero />} />
                <Route path="laboratorio"           element={<Laboratorio />} />
              </Route>

              {/* Tómbola — próximamente */}
              <Route path="/tombola"                   element={<TombolaMain />} />
              <Route path="/tombola/estadisticas"      element={<Placeholder titulo="Estadísticas Tómbola" />} />
              <Route path="/tombola/laboratorio"       element={<Placeholder titulo="Laboratorio Tómbola" />} />

              {/* Redoblona — próximamente */}
              <Route path="/redoblona"                 element={<RedoblonaMain />} />

              {/* Configuración */}
              <Route path="/configuracion"             element={<Configuracion />} />

              {/* 404 */}
              <Route path="*"                          element={<Placeholder titulo="Página no encontrada" />} />
            </Routes>
          </main>

          {/* Navegación inferior mobile */}
          <BottomNav />
        </div>
      </BrowserRouter>
    </ThemeProvider>
    </ConfigProvider>
  )
}
