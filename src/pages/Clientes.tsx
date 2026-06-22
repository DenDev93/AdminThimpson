import { useEffect, useState, useCallback } from 'react'
import DataTable from 'react-data-table-component'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Modal from '@/components/Modal'

const estiloTabla = {
  headCells: {
    style: { backgroundColor: '#0B1F22', color: '#FBB03B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '14px 16px' },
  },
  rows: { style: { fontSize: '13px' } },
  cells: { style: { padding: '12px 16px' } },
}

export default function Clientes() {
  const { token } = useAuth()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [detalle, setDetalle] = useState<any>(null)

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busqueda) params.set('q', busqueda)
      params.set('por_pagina', '100')
      const r = await apiFetch<any>(`/api/clientes?${params}`, {}, token)
      setClientes(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setLoading(false) }
  }, [token, busqueda])

  useEffect(() => { cargar() }, [cargar])

  const abrirDetalle = async (c: any) => {
    setSelected(c)
    setDetalle(null)
    try {
      const r = await apiFetch<any>(`/api/clientes/${c.id}`, {}, token!)
      setDetalle(r.data)
    } catch { setDetalle(null) }
  }

  const totalGastado = clientes.reduce((acc, c) => acc + (c.stats?.total_gastado ?? 0), 0)
  const totalSolicitudes = clientes.reduce((acc, c) => acc + (c.stats?.total_solicitudes ?? 0), 0)
  const activos = clientes.filter(c => c.activo).length

  const columnas = [
    {
      name: 'Cliente',
      grow: 2,
      cell: (c: any) => (
        <div className="py-1">
          <div className="font-semibold text-gray-900 text-sm">{c.nombre_completo ?? '—'}</div>
        </div>
      ),
    },
    {
      name: 'Teléfono',
      cell: (c: any) => <span className="text-sm">{c.telefono ?? '—'}</span>,
    },
    {
      name: 'Pedidos',
      cell: (c: any) => <span className="text-sm font-medium">{c.stats?.total_solicitudes ?? 0}</span>,
    },
    {
      name: 'Completados',
      cell: (c: any) => <span className="text-sm">{c.stats?.completadas ?? 0}</span>,
    },
    {
      name: 'Total gastado',
      cell: (c: any) => <span className="text-sm font-semibold text-thimpson-teal">C${(c.stats?.total_gastado ?? 0).toFixed(2)}</span>,
    },
    {
      name: 'Registro',
      cell: (c: any) => <span className="text-xs text-gray-400">{c.created_at ? new Date(c.created_at).toLocaleDateString('es-NI') : '—'}</span>,
    },
    {
      name: 'Acciones',
      right: true,
      cell: (c: any) => (
        <button onClick={() => abrirDetalle(c)} title="Ver detalle"
          className="w-8 h-8 flex items-center justify-center bg-thimpson-teal/10 text-thimpson-teal rounded-lg hover:bg-thimpson-teal/20 transition-colors text-lg">
          👁️
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Base de clientes registrados · {total} total</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, color: 'text-thimpson-teal', bg: 'bg-teal-50', icon: '👥' },
          { label: 'Activos', value: activos, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
          { label: 'Pedidos', value: totalSolicitudes, color: 'text-blue-600', bg: 'bg-blue-50', icon: '📦' },
          { label: 'Gastado', value: `C$${totalGastado.toFixed(2)}`, color: 'text-purple-600', bg: 'bg-purple-50', icon: '💰' },
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
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-thimpson-teal/50" />
      </div>

      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <DataTable columns={columnas} data={clientes} progressPending={loading}
          progressComponent={<div className="py-10 text-gray-400 text-sm flex flex-col items-center gap-2"><div className="w-7 h-7 border-2 border-thimpson-teal/30 border-t-thimpson-teal animate-spin" />Cargando...</div>}
          noDataComponent={<div className="py-12 text-gray-400 text-sm text-center"><div className="text-4xl mb-2">👤</div><p>No hay clientes registrados</p></div>}
          pagination customStyles={estiloTabla} highlightOnHover striped responsive />
      </div>

      <Modal open={!!selected} onClose={() => { setSelected(null); setDetalle(null) }} title={selected?.nombre_completo ?? 'Cliente'} size="lg">
        {detalle ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">ID</p>
                <p className="text-sm font-medium mt-1 text-xs font-mono">{detalle.id?.slice(0, 8) ?? '—'}</p>
              </div>
              <div className="bg-gray-50 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Teléfono</p>
                <p className="text-sm font-medium mt-1">{detalle.telefono ?? '—'}</p>
              </div>
              <div className="bg-gray-50 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Registro</p>
                <p className="text-sm font-medium mt-1">{detalle.created_at ? new Date(detalle.created_at).toLocaleDateString('es-NI') : '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3">
                <p className="text-xs text-blue-600 uppercase tracking-wide">Total pedidos</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{detalle.stats?.total_solicitudes ?? 0}</p>
              </div>
              <div className="bg-green-50 p-3">
                <p className="text-xs text-green-600 uppercase tracking-wide">Completados</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{detalle.stats?.completadas ?? 0}</p>
              </div>
              <div className="bg-purple-50 p-3">
                <p className="text-xs text-purple-600 uppercase tracking-wide">Total gastado</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">C${(detalle.stats?.total_gastado ?? 0).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Historial de pedidos</h3>
              {detalle.solicitudes?.length > 0 ? (
                <div className="space-y-2">
                  {detalle.solicitudes.slice(0, 10).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between bg-gray-50 p-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">{s.tipo_servicio ?? 'Servicio'}</span>
                        <span className="text-gray-400 ml-2">{s.created_at ? new Date(s.created_at).toLocaleDateString('es-NI') : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 ${s.estado === 'entregado' || s.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {s.estado}
                        </span>
                        <span className="font-semibold text-thimpson-teal">C${Number(s.precio_total ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Este cliente no ha realizado pedidos aún.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">Cargando detalle...</div>
        )}
      </Modal>
    </div>
  )
}
