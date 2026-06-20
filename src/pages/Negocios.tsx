import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Modal from '@/components/Modal'

export default function Negocios() {
  const { token } = useAuth()
  const [negocios, setNegocios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    if (!token) return
    try {
      const r = await apiFetch<any>('/api/negocios?por_pagina=50', {}, token)
      setNegocios(r.data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = negocios.filter(n =>
    !busqueda ||
    n.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const activos = negocios.filter(n => n.activo).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Negocios</h1>
          <p className="text-gray-500 text-sm mt-0.5">{negocios.length} registrados · {activos} activos</p>
        </div>
        <input
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar negocio..."
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-thimpson-teal/40 w-52"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Negocio', 'Categoría', 'Teléfono', 'Dirección', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Cargando negocios...</td></tr>
              )}
              {!loading && filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                    {busqueda ? 'Sin resultados para la búsqueda' : 'No hay negocios registrados'}
                  </td>
                </tr>
              )}
              {filtrados.map(n => (
                <tr key={n.id} onClick={() => setSelected(n)}
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{n.nombre}</p>
                    {n.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{n.descripcion}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{n.categoria ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{n.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{n.direccion ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge-estado ${n.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {n.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.nombre ?? 'Negocio'}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">{selected.nombre}</h3>
                {selected.categoria && <p className="text-gray-500 text-sm capitalize mt-0.5">{selected.categoria}</p>}
              </div>
              <span className={`badge-estado ${selected.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {selected.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {selected.descripcion && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3.5">{selected.descripcion}</p>
            )}

            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: '📞', label: 'Teléfono', value: selected.telefono },
                { icon: '📍', label: 'Dirección', value: selected.direccion },
                { icon: '⏰', label: 'Horario', value: selected.horario },
                { icon: '🌐', label: 'Sitio web', value: selected.sitio_web },
              ].map(f => f.value && (
                <div key={f.label} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                  <span className="text-base mt-0.5">{f.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{f.label}</p>
                    <p className="text-sm text-gray-800 font-medium mt-0.5">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-right">
              Registrado el {new Date(selected.created_at).toLocaleDateString('es-NI')}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
