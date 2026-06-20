import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificaciones } from '@/hooks/useNotificaciones'

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

export default function Sidebar() {
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

  return (
    <aside className="main-sidebar">
      {/* Brand */}
      <a href="/dashboard" className="brand-link">
        <div className="brand-logo">T</div>
        <div>
          <div className="brand-text">Thimpson</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Panel Admin
          </div>
        </div>
      </a>

      {/* Nav */}
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

      {/* User panel */}
      <div className="user-panel">
        <div className="navbar-avatar" style={{ width: 36, height: 36, marginBottom: 8, background: '#FBB03B', color: '#0B1F22', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {(perfil?.nombre_completo ?? 'A').charAt(0).toUpperCase()}
        </div>
        <div className="user-panel-name">{perfil?.nombre_completo ?? 'Administrador'}</div>
        <div className="user-panel-info">
          {perfil?.rol === 'super_admin' ? 'Super Admin · Global' : (perfil as any)?.sucursales?.nombre ?? 'Administrador'}
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          style={{ marginTop: 10, background: 'transparent', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5, transition: 'color 150ms' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.4)')}>
          ⎋ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
