import { useEffect, useState, useCallback } from 'react'
import DataTable from 'react-data-table-component'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Modal from '@/components/Modal'

const CATEGORIAS = [
  'Comida', 'Bebidas', 'Ropa', 'Calzado', 'Electrónicos', 'Farmacia',
  'Supermercado', 'Ferretería', 'Mascotas', 'Belleza', 'Regalos', 'Deportes',
  'Librería', 'Jardinería', 'Hogar', 'Juguetes', 'Servicios', 'Otro',
]

const estiloTabla = {
  headCells: {
    style: { backgroundColor: '#0B1F22', color: '#FBB03B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '14px 16px' },
  },
  rows: { style: { fontSize: '13px' } },
  cells: { style: { padding: '12px 16px' } },
}

export default function Negocios() {
  const { token } = useAuth()
  const [negocios, setNegocios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busqueda) params.set('q', busqueda)
      params.set('por_pagina', '100')
      const r = await apiFetch<any>(`/api/negocios?${params}`, {}, token)
      setNegocios(r.data ?? [])
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setLoading(false) }
  }, [token, busqueda])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = negocios.filter(n => {
    if (filtroEstado === 'pendiente') return !n.verificado
    if (filtroEstado === 'activo') return n.activo && n.verificado
    if (filtroEstado === 'inactivo') return !n.activo
    return true
  })

  const pendientes = negocios.filter(n => !n.verificado).length
  const activos = negocios.filter(n => n.activo && n.verificado).length
  const inactivos = negocios.filter(n => !n.activo).length

  const abrirEditar = (n: any) => {
    setEditando(n)
    setForm({
      nombre: n.nombre ?? '', descripcion: n.descripcion ?? '', categoria: n.categoria ?? '',
      telefono: n.telefono ?? '', direccion: n.direccion ?? '', activo: n.activo, verificado: n.verificado,
    })
    setModalOpen(true)
  }
  const set = (k: string, v: any) => setForm({ ...form, [k]: v })

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editando) return
    setGuardando(true)
    try {
      await apiFetch(`/api/negocios/${editando.id}`, { method: 'PUT', body: JSON.stringify(form) }, token)
      Swal.fire({ icon: 'success', title: 'Negocio actualizado', timer: 1800, showConfirmButton: false })
      setModalOpen(false)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setGuardando(false) }
  }

  const toggleVerificado = async (n: any) => {
    const accion = n.verificado ? 'rechazar' : 'aprobar'
    const result = await Swal.fire({
      icon: 'question', title: `¿${accion === 'aprobar' ? 'Aprobar' : 'Rechazar'} negocio?`,
      text: n.nombre, showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar',
      confirmButtonColor: n.verificado ? '#dc2626' : '#16a34a',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/negocios/${n.id}`, { method: 'PUT', body: JSON.stringify({ verificado: !n.verificado }) }, token!)
      Swal.fire({ icon: 'success', title: n.verificado ? 'Negocio rechazado' : '¡Negocio aprobado!', timer: 1800, showConfirmButton: false })
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const toggleActivo = async (n: any) => {
    const accion = n.activo ? 'desactivar' : 'activar'
    const result = await Swal.fire({
      icon: 'question', title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} negocio?`,
      text: n.nombre, showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar',
      confirmButtonColor: n.activo ? '#dc2626' : '#16a34a',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/negocios/${n.id}`, { method: 'PUT', body: JSON.stringify({ activo: !n.activo }) }, token!)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const eliminar = async (n: any) => {
    const result = await Swal.fire({
      icon: 'warning', title: '¿Eliminar negocio?',
      text: `Se eliminará "${n.nombre}" permanentemente.`, showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/negocios/${n.id}`, { method: 'DELETE' }, token!)
      Swal.fire({ icon: 'success', title: 'Negocio eliminado', timer: 1800, showConfirmButton: false })
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const columnas = [
    {
      name: 'Negocio',
      grow: 2,
      cell: (n: any) => (
        <div className="py-1">
          <div className="font-semibold text-gray-900 text-sm">{n.nombre}</div>
          {n.descripcion && <div className="text-xs text-gray-400 truncate max-w-[250px]">{n.descripcion}</div>}
        </div>
      ),
    },
    {
      name: 'Categoría',
      cell: (n: any) => <span className="text-sm capitalize text-gray-600">{n.categoria ?? '—'}</span>,
    },
    {
      name: 'Teléfono',
      cell: (n: any) => <span className="text-sm">{n.telefono ?? '—'}</span>,
    },
    {
      name: 'Verificado',
      cell: (n: any) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${n.verificado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {n.verificado ? 'Sí' : 'Pendiente'}
        </span>
      ),
    },
    {
      name: 'Estado',
      cell: (n: any) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${n.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
          {n.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      name: 'Acciones',
      right: true,
      minWidth: '200px',
      cell: (n: any) => (
        <div className="flex gap-1">
          <button onClick={() => abrirEditar(n)} title="Editar"
            className="w-8 h-8 flex items-center justify-center bg-thimpson-teal/10 text-thimpson-teal rounded-lg hover:bg-thimpson-teal/20 transition-colors text-lg">
            ✏️
          </button>
          <button onClick={() => toggleVerificado(n)} title={n.verificado ? 'Rechazar' : 'Aprobar'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-lg ${n.verificado ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
            {n.verificado ? '❌' : '✅'}
          </button>
          <button onClick={() => toggleActivo(n)} title={n.activo ? 'Desactivar' : 'Activar'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-lg ${n.activo ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
            {n.activo ? '⏻' : '▶️'}
          </button>
          <button onClick={() => eliminar(n)} title="Eliminar"
            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors text-lg">
            🗑️
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Negocios Afiliados</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión del Marketplace · {negocios.length} registrados</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes', value: pendientes, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏳' },
          { label: 'Aprobados', value: activos, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
          { label: 'Inactivos', value: inactivos, color: 'text-gray-600', bg: 'bg-gray-50', icon: '🚫' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} p-4 border border-white shadow-sm`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre..."
            className="flex-1 min-w-[200px] border border-gray-200 px-3 py-2 text-sm outline-none focus:border-thimpson-teal/50" />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="border border-gray-200 px-3 py-2 text-sm outline-none bg-white">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes de aprobar</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          {(busqueda || filtroEstado) && (
            <button onClick={() => { setBusqueda(''); setFiltroEstado('') }} className="text-sm text-gray-400 hover:text-gray-700">Limpiar ×</button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <DataTable columns={columnas} data={filtrados} progressPending={loading}
          progressComponent={<div className="py-10 text-gray-400 text-sm flex flex-col items-center gap-2"><div className="w-7 h-7 border-2 border-thimpson-teal/30 border-t-thimpson-teal animate-spin" />Cargando...</div>}
          noDataComponent={<div className="py-12 text-gray-400 text-sm text-center"><div className="text-4xl mb-2">🏪</div><p>No hay negocios registrados</p></div>}
          pagination customStyles={estiloTabla} highlightOnHover striped responsive />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando?.nombre ?? 'Editar negocio'}>
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre *</label>
            <input type="text" required value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Categoría</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none bg-white">
                <option value="">Sin categoría</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Teléfono</label>
              <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Dirección</label>
            <input type="text" value={form.direccion} onChange={e => set('direccion', e.target.value)}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Verificado</label>
              <button type="button" onClick={() => set('verificado', !form.verificado)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.verificado ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.verificado ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Activo</label>
              <button type="button" onClick={() => set('activo', !form.activo)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" disabled={guardando}
              className="flex-1 bg-thimpson-teal text-thimpson-yellow font-semibold py-2.5 hover:opacity-90 disabled:opacity-50 text-sm">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
