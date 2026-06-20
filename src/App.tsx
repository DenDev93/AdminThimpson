import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { NotificacionesProvider } from '@/contexts/NotificacionesContext'
import Sidebar from '@/components/Sidebar'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Solicitudes from '@/pages/Solicitudes'
import Motorizados from '@/pages/Motorizados'
import Negocios from '@/pages/Negocios'
import CMS from '@/pages/CMS'
import Ganancias from '@/pages/Ganancias'
import Notificaciones from '@/pages/Notificaciones'
import Empleados from '@/pages/Empleados'
import Nomina from '@/pages/Nomina'
import Usuarios from '@/pages/Usuarios'
import Sucursales from '@/pages/Sucursales'
import Servicios from '@/pages/Servicios'
import Proximos from '@/pages/Proximos'

function Topbar() {
  const { perfil } = useAuth()
  const inicial = (perfil?.nombre_completo ?? 'A').charAt(0).toUpperCase()
  return (
    <header className="main-header">
      {/* Search bar */}
      <div className="navbar-search" style={{ flex: '0 0 auto', width: 280 }}>
        <span style={{ color: '#999', fontSize: 14 }}>🔍</span>
        <input placeholder="Buscar..." />
      </div>

      <div className="navbar-end">
        {/* Notifications */}
        <div className="navbar-icon-btn" title="Notificaciones">
          🔔
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: '#e0e0e0' }} />

        {/* User */}
        <div className="navbar-user">
          <div className="navbar-avatar">{inicial}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.2 }}>
              {perfil?.nombre_completo ?? 'Administrador'}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>
              {perfil?.rol === 'super_admin' ? 'Super Admin' : 'Administrador'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrapper">
      <Sidebar />
      <div className="content-wrapper">
        <Topbar />
        <div className="page-enter">{children}</div>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0B1F22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(251,176,59,.3)',
          borderTopColor: '#FBB03B',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: 'rgba(251,176,59,.6)', fontSize: 13 }}>Verificando sesión...</div>
      </div>
    </div>
  )
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return <RequireAuth><Layout>{children}</Layout></RequireAuth>
}

function AppRoutes() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      {/* Existentes */}
      <Route path="/dashboard"      element={<ProtectedPage><Dashboard /></ProtectedPage>} />
      <Route path="/solicitudes"    element={<ProtectedPage><Solicitudes /></ProtectedPage>} />
      <Route path="/motorizados"    element={<ProtectedPage><Motorizados /></ProtectedPage>} />
      <Route path="/negocios"       element={<ProtectedPage><Negocios /></ProtectedPage>} />
      <Route path="/cms"            element={<ProtectedPage><CMS /></ProtectedPage>} />
      <Route path="/ganancias"      element={<ProtectedPage><Ganancias /></ProtectedPage>} />
      <Route path="/notificaciones" element={<ProtectedPage><Notificaciones /></ProtectedPage>} />
      {/* Nuevos — RRHH */}
      <Route path="/empleados"      element={<ProtectedPage><Empleados /></ProtectedPage>} />
      <Route path="/nomina"         element={<ProtectedPage><Nomina /></ProtectedPage>} />
      {/* Próximos módulos — placeholder */}
      <Route path="/usuarios"       element={<ProtectedPage><Usuarios /></ProtectedPage>} />
      <Route path="/sucursales"     element={<ProtectedPage><Sucursales /></ProtectedPage>} />
      <Route path="/servicios"      element={<ProtectedPage><Servicios /></ProtectedPage>} />
      <Route path="/suscriptores"   element={<ProtectedPage><Proximos titulo="Suscriptores" icono="⭐" desc="Gestión de planes de suscripción y membresías premium." /></ProtectedPage>} />
      <Route path="/clientes"       element={<ProtectedPage><Proximos titulo="Clientes" icono="🛒" desc="Base de clientes con historial de pedidos y estadísticas." /></ProtectedPage>} />
      <Route path="/agentes-ia"     element={<ProtectedPage><Proximos titulo="Agentes de IA" icono="🤖" desc="Configura y monitorea los agentes inteligentes del ecosistema Thimpson." /></ProtectedPage>} />
      <Route path="/chatbots"       element={<ProtectedPage><Proximos titulo="Chatbots" icono="💬" desc="Configura los chatbots de WhatsApp, web y app para atención automatizada." /></ProtectedPage>} />
      {/* Catch-all */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificacionesProvider>
          <AppRoutes />
        </NotificacionesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
