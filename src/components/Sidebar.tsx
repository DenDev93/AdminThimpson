import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificaciones } from '@/contexts/NotificacionesContext'

interface TreeItem { to: string; label: string; icon?: string }
interface NavGroup {
  header: string
  items: {
    icon: string
    label: string
    badge?: () => number
    to?: string
    children?: TreeItem[]
  }[]
}

function NavTree({ icon, label, badge, to, children }: NavGroup['items'][number]) {
  const [open, setOpen] = useState(false)

  if (to && !children) {
    return (
      <li className="nav-item">
        <NavLink to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span className="nav-icon">{icon}</span>
          <span>{label}</span>
          {badge && badge() > 0 && (
            <span className="nav-badge">{badge() > 99 ? '99+' : badge()}</span>
          )}
        </NavLink>
      </li>
    )
  }

  return (
    <li className="nav-item">
      <button onClick={() => setOpen(o => !o)} className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
        <span className="nav-icon">{icon}</span>
        <span>{label}</span>
        <span className={`nav-arrow${open ? ' open' : ''}`}>▶</span>
      </button>
      <ul className={`nav-treeview${open ? ' open' : ''}`}>
        {children?.map(c => (
          <li key={c.to} className="nav-item">
            <NavLink to={c.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">{c.icon ?? '◦'}</span>
              <span>{c.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </li>
  )
}

export default function Sidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; collapsed?: boolean; onClose?: () => void }) {
  const { perfil, logout } = useAuth()
  const { noLeidas } = useNotificaciones()
  const navigate = useNavigate()

  const grupos: NavGroup[] = [
    {
      header: 'Principal',
      items: [
        { icon: '⊞', label: 'Dashboard', to: '/dashboard' },
        { icon: '🔔', label: 'Notificaciones', to: '/notificaciones', badge: () => noLeidas },
      ],
    },
    {
      header: 'Operaciones',
      items: [
        { icon: '📦', label: 'Solicitudes', to: '/solicitudes' },
        { icon: '🏍️', label: 'Motorizados', to: '/motorizados' },
        { icon: '🏪', label: 'Negocios', to: '/negocios' },
      ],
    },
    {
      header: 'Recursos Humanos',
      items: [
        { icon: '👷', label: 'Empleados', to: '/empleados' },
        {
          icon: '💵', label: 'Nómina',
          children: [
            { to: '/nomina', label: 'Períodos de nómina', icon: '📋' },
          ],
        },
      ],
    },
    {
      header: 'Usuarios',
      items: [
        { icon: '👤', label: 'Gestión de usuarios', to: '/usuarios' },
        { icon: '⭐', label: 'Suscriptores', to: '/suscriptores' },
        { icon: '🛒', label: 'Clientes', to: '/clientes' },
      ],
    },
    {
      header: 'Comercial',
      items: [
        { icon: '🚚', label: 'Servicios', to: '/servicios' },
        { icon: '💰', label: 'Ganancias', to: '/ganancias' },
      ],
    },
    {
      header: 'Tecnología',
      items: [
        { icon: '🤖', label: 'Agentes IA', to: '/agentes-ia' },
        { icon: '💬', label: 'Chatbots', to: '/chatbots' },
      ],
    },
    {
      header: 'Configuración',
      items: [
        { icon: '📄', label: 'CMS / Contenido', to: '/cms' },
        { icon: '📍', label: 'Sucursales', to: '/sucursales' },
      ],
    },
  ]

  const handleNav = (to: string) => {
    navigate(to)
    onClose?.()
  }

  return (
    <aside className={`main-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand-link" onClick={() => handleNav('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo">T</div>
        <div>
          <div className="brand-text">Thimpson</div>
          <div className="brand-sub">Panel Admin</div>
        </div>
      </div>

      <div className="sidebar">
        <nav>
          {grupos.map(g => (
            <div key={g.header}>
              <p className="nav-header">{g.header}</p>
              <ul className="nav-sidebar">
                {g.items.map(item => (
                  <NavTree key={item.label} {...item} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="user-panel">
        <div className="user-avatar">
          {(perfil?.nombre_completo ?? 'A').charAt(0).toUpperCase()}
        </div>
        <div className="user-panel-name">{perfil?.nombre_completo ?? 'Administrador'}</div>
        <div className="user-panel-info">
          {perfil?.rol === 'super_admin' ? 'Super Admin · Global' : (perfil as any)?.sucursales?.nombre ?? 'Administrador'}
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="logout-btn">
          ⎋ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}