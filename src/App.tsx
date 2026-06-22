import { useState } from 'react'
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
import Clientes from '@/pages/Clientes'
import Suscriptores from '@/pages/Suscriptores'
import AgentesIA from '@/pages/AgentesIA'
import Chatbots from '@/pages/Chatbots'

function Topbar({ onToggleSidebar, onCollapse, collapsed }: { onToggleSidebar: () => void; onCollapse: () => void; collapsed: boolean }) {
  const { perfil } = useAuth()
  const inicial = (perfil?.nombre_completo ?? 'A').charAt(0).toUpperCase()
  return (
    <header className="main-header">
      <div className="main-header-left">
        <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <span /><span /><span />
        </button>
        <button className={`collapse-btn ${collapsed ? 'is-collapsed' : ''}`} onClick={onCollapse} aria-label="Collapse sidebar" title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}>
          ◀
        </button>
      </div>
      <div className="navbar-search">
        <span style={{ color: '#999', fontSize: 14 }}>🔍</span>
        <input placeholder="Buscar..." />
      </div>
      <div className="navbar-end">
        <div className="navbar-icon-btn" title="Notificaciones">🔔</div>
        <div className="navbar-divider" />
        <div className="navbar-user">
          <div className="navbar-avatar">{inicial}</div>
          <div className="navbar-user-info">
            <div className="navbar-user-name">{perfil?.nombre_completo ?? 'Administrador'}</div>
            <div className="navbar-user-rol">{perfil?.rol === 'super_admin' ? 'Super Admin' : 'Administrador'}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="main-footer">
      <span>© {new Date().getFullYear()} Servicio Express Thimpson</span>
      <span className="main-footer-version">v2.0.0</span>
    </footer>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar mobileOpen={sidebarOpen} collapsed={collapsed} onClose={() => setSidebarOpen(false)} />
      <div className="content-wrapper">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} onCollapse={() => setCollapsed(o => !o)} collapsed={collapsed} />
        <div className="page-enter">{children}</div>
        <Footer />
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
      <Route path="/dashboard"      element={<ProtectedPage><Dashboard /></ProtectedPage>} />
      <Route path="/solicitudes"    element={<ProtectedPage><Solicitudes /></ProtectedPage>} />
      <Route path="/motorizados"    element={<ProtectedPage><Motorizados /></ProtectedPage>} />
      <Route path="/negocios"       element={<ProtectedPage><Negocios /></ProtectedPage>} />
      <Route path="/cms"            element={<ProtectedPage><CMS /></ProtectedPage>} />
      <Route path="/ganancias"      element={<ProtectedPage><Ganancias /></ProtectedPage>} />
      <Route path="/notificaciones" element={<ProtectedPage><Notificaciones /></ProtectedPage>} />
      <Route path="/empleados"      element={<ProtectedPage><Empleados /></ProtectedPage>} />
      <Route path="/nomina"         element={<ProtectedPage><Nomina /></ProtectedPage>} />
      <Route path="/usuarios"       element={<ProtectedPage><Usuarios /></ProtectedPage>} />
      <Route path="/sucursales"     element={<ProtectedPage><Sucursales /></ProtectedPage>} />
      <Route path="/servicios"      element={<ProtectedPage><Servicios /></ProtectedPage>} />
      <Route path="/suscriptores"   element={<ProtectedPage><Suscriptores /></ProtectedPage>} />
      <Route path="/clientes"       element={<ProtectedPage><Clientes /></ProtectedPage>} />
      <Route path="/agentes-ia"     element={<ProtectedPage><AgentesIA /></ProtectedPage>} />
      <Route path="/chatbots"       element={<ProtectedPage><Chatbots /></ProtectedPage>} />
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