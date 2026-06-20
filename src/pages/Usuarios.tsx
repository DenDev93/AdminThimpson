import { useEffect, useState, useCallback } from 'react'
import DataTable from 'react-data-table-component'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Usuario {
  id: string
  nombre_completo: string | null
  email: string | null
  telefono: string | null
  rol: string
  activo: boolean
  sucursal_id: string | null
  sucursales?: { id: string; nombre: string }
  created_at: string
}

interface Sucursal { id: string; nombre: string; ciudad: string }

const ROL_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  super_admin:  { label: 'Super Admin',  bg: 'bg-purple-100', text: 'text-purple-700' },
  admin:        { label: 'Admin',        bg: 'bg-blue-100',   text: 'text-blue-700' },
  motorizado:   { label: 'Motorizado',   bg: 'bg-orange-100', text: 'text-orange-700' },
  cliente:      { label: 'Cliente',      bg: 'bg-green-100',  text: 'text-green-700' },
  propietario_negocio: { label: 'Negocio', bg: 'bg-yellow-100', text: 'text-yellow-700' },
}

const VACÍO = {
  nombre_completo: '', email: '', password: '', telefono: '',
  rol: 'admin', sucursal_id: '', activo: true,
}

const estiloTabla = {
  headCells: {
    style: { backgroundColor: '#0B1F22', color: '#FBB03B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '14px 16px' },
  },
  rows: { style: { fontSize: '13px' } },
  cells: { style: { padding: '12px 16px' } },
}

export default function Usuarios() {
  const { token, perfil: perfilAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState<typeof VACÍO & { nueva_password?: string }>(VACÍO)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busqueda)     params.set('q', busqueda)
      if (filtroRol)    params.set('rol', filtroRol)
      if (filtroActivo) params.set('activo', filtroActivo)
      const r = await apiFetch<any>(`/api/usuarios?${params}`, {}, token)
      setUsuarios(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally {
      setLoading(false)
    }
  }, [token, busqueda, filtroRol, filtroActivo])

  const cargarSucursales = useCallback(async () => {
    if (!token) return
    try {
      const r = await apiFetch<any>('/api/sucursales?todas=true', {}, token)
      setSucursales(r.data ?? [])
    } catch { /* silencio */ }
  }, [token])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { cargarSucursales() }, [cargarSucursales])

  const abrirCrear = () => { setEditando(null); setForm({ ...VACÍO }); setModalOpen(true) }
  const abrirEditar = (u: Usuario) => {
    setEditando(u)
    setForm({ nombre_completo: u.nombre_completo ?? '', email: u.email ?? '', password: '', telefono: u.telefono ?? '', rol: u.rol, sucursal_id: u.sucursal_id ?? '', activo: u.activo })
    setModalOpen(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setGuardando(true)
    try {
      if (editando) {
        const payload: any = { nombre_completo: form.nombre_completo, telefono: form.telefono, rol: form.rol, sucursal_id: form.sucursal_id || null, activo: form.activo }
        if (form.nueva_password) payload.nueva_password = form.nueva_password
        await apiFetch(`/api/usuarios/${editando.id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token)
        Swal.fire({ icon: 'success', title: 'Usuario actualizado', timer: 1800, showConfirmButton: false })
      } else {
        await apiFetch('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify({ ...form, sucursal_id: form.sucursal_id || null }),
        }, token)
        Swal.fire({ icon: 'success', title: '¡Usuario creado!', timer: 1800, showConfirmButton: false })
      }
      setModalOpen(false)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async (u: Usuario) => {
    const accion = u.activo ? 'desactivar' : 'activar'
    const result = await Swal.fire({
      icon: 'question', title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: u.nombre_completo ?? u.email ?? '',
      showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar',
      confirmButtonColor: u.activo ? '#dc2626' : '#16a34a', cancelButtonColor: '#6b7280',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/usuarios/${u.id}`, { method: 'PATCH', body: JSON.stringify({ activo: !u.activo }) }, token!)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const adminCount   = usuarios.filter(u => u.rol === 'admin' || u.rol === 'super_admin').length
  const motorizadoCount = usuarios.filter(u => u.rol === 'motorizado').length
  const clienteCount = usuarios.filter(u => u.rol === 'cliente').length
  const activoCount  = usuarios.filter(u => u.activo).length

  const columnas = [
    {
      name: 'Usuario',
      grow: 2,
      cell: (u: Usuario) => (
        <div className="py-1">
          <div className="font-semibold text-gray-900 text-sm">{u.nombre_completo ?? '—'}</div>
          <div className="text-xs text-gray-400">{u.email ?? 'Sin email'}</div>
        </div>
      ),
    },
    {
      name: 'Rol',
      cell: (u: Usuario) => {
        const r = ROL_CONFIG[u.rol] ?? { label: u.rol, bg: 'bg-gray-100', text: 'text-gray-600' }
        return <span className={`text-xs font-medium px-2 py-1 rounded-full ${r.bg} ${r.text}`}>{r.label}</span>
      },
    },
    {
      name: 'Sucursal',
      cell: (u: Usuario) => <span className="text-sm text-gray-600">{u.sucursales?.nombre ?? (u.sucursal_id ? '—' : 'Global')}</span>,
    },
    {
      name: 'Teléfono',
      cell: (u: Usuario) => <span className="text-sm">{u.telefono ?? '—'}</span>,
    },
    {
      name: 'Estado',
      cell: (u: Usuario) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
          {u.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      name: 'Acciones',
      right: true,
      minWidth: '160px',
      cell: (u: Usuario) => (
        <div className="flex gap-1.5">
          <button onClick={() => abrirEditar(u)}
            className="px-2.5 py-1.5 bg-thimpson-teal text-white text-xs rounded-lg hover:opacity-90">
            Editar
          </button>
          {u.id !== perfilAdmin?.id && (
            <button onClick={() => toggleActivo(u)}
              className={`px-2.5 py-1.5 text-white text-xs rounded-lg hover:opacity-90 ${u.activo ? 'bg-yellow-500' : 'bg-green-600'}`}>
              {u.activo ? 'Desactivar' : 'Activar'}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios del sistema</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de accesos y roles · {total} usuarios</p>
        </div>
        <button onClick={abrirCrear} className="flex items-center gap-2 bg-thimpson-teal text-thimpson-yellow font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 shadow-sm">
          <span className="text-lg leading-none">＋</span> Nuevo usuario
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, color: 'text-thimpson-teal', bg: 'bg-teal-50', icon: '👥' },
          { label: 'Admins', value: adminCount, color: 'text-purple-600', bg: 'bg-purple-50', icon: '🔐' },
          { label: 'Motorizados', value: motorizadoCount, color: 'text-orange-600', bg: 'bg-orange-50', icon: '🏍️' },
          { label: 'Activos', value: activoCount, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white shadow-sm`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre..."
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-thimpson-teal/50" />
          <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
            <option value="">Todos los roles</option>
            {Object.entries(ROL_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          {(busqueda || filtroRol || filtroActivo) && (
            <button onClick={() => { setBusqueda(''); setFiltroRol(''); setFiltroActivo('') }} className="text-sm text-gray-400 hover:text-gray-700">Limpiar ×</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable columns={columnas} data={usuarios} progressPending={loading}
          progressComponent={<div className="py-10 text-gray-400 text-sm flex flex-col items-center gap-2"><div className="w-7 h-7 border-2 border-thimpson-teal/30 border-t-thimpson-teal rounded-full animate-spin" />Cargando...</div>}
          noDataComponent={<div className="py-12 text-gray-400 text-sm text-center"><div className="text-4xl mb-2">👤</div><p>No hay usuarios registrados</p></div>}
          pagination customStyles={estiloTabla} highlightOnHover striped responsive />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-thimpson-teal px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-thimpson-yellow font-bold text-lg">{editando ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                <p className="text-white/60 text-sm mt-0.5">{editando ? editando.email : 'Completar datos de acceso'}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre completo *</label>
                <input type="text" required value={form.nombre_completo} onChange={e => set('nombre_completo', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
              </div>
              {!editando && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Correo electrónico *</label>
                    <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Contraseña * (mín. 6 caracteres)</label>
                    <input type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
                  </div>
                </>
              )}
              {editando && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nueva contraseña (opcional)</label>
                  <input type="password" minLength={6} value={form.nueva_password ?? ''} onChange={e => set('nueva_password', e.target.value)}
                    placeholder="Dejar vacío para no cambiar"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Teléfono</label>
                <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Rol *</label>
                  <select value={form.rol} onChange={e => set('rol', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                    {perfilAdmin?.rol === 'super_admin' && <option value="super_admin">Super Admin</option>}
                    <option value="admin">Admin</option>
                    <option value="motorizado">Motorizado</option>
                    <option value="cliente">Cliente</option>
                    <option value="propietario_negocio">Propietario Negocio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Sucursal</label>
                  <select value={form.sucursal_id} onChange={e => set('sucursal_id', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                    <option value="">Global (ninguna)</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
              {editando && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Estado activo</label>
                  <button type="button" onClick={() => set('activo', !form.activo)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-thimpson-teal text-thimpson-yellow font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
