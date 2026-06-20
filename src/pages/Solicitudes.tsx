import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import supabase from '@/lib/supabase'
import Modal from '@/components/Modal'

const ESTADOS = ['todos', 'pendiente', 'confirmada', 'asignada', 'en_camino', 'entregada', 'cancelada']

const COLORES: Record<string, string> = {
  pendiente:  'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-blue-100 text-blue-800',
  asignada:   'bg-purple-100 text-purple-800',
  en_camino:  'bg-orange-100 text-orange-800',
  entregada:  'bg-green-100 text-green-800',
  cancelada:  'bg-red-100 text-red-800',
}

const SIGUIENTE: Record<string, string> = {
  pendiente:  'confirmada',
  confirmada: 'asignada',
  asignada:   'en_camino',
  en_camino:  'entregada',
}

const LABEL_SIGUIENTE: Record<string, string> = {
  pendiente:  'Confirmar',
  confirmada: 'Asignar motorizado',
  asignada:   'Marcar en camino',
  en_camino:  'Marcar entregada',
}

export default function Solicitudes() {
  const { token, perfil } = useAuth()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [motorizados, setMotorizados] = useState<any[]>([])
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    const q = filtro !== 'todos' ? `?estado=${filtro}&por_pagina=50` : '?por_pagina=50'
    try {
      const [solRes, motRes] = await Promise.all([
        apiFetch<any>(`/api/solicitudes${q}`, {}, token),
        apiFetch<any>('/api/motorizados?disponible=true', {}, token),
      ])
      setSolicitudes(solRes.data ?? [])
      setMotorizados(motRes.data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, filtro])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!supabase) return
    const esSuperAdmin = perfil?.rol === 'super_admin'
    if (!esSuperAdmin && !perfil?.sucursal_id) return
    const channelOpts = esSuperAdmin
      ? { event: '*' as const, schema: 'public', table: 'solicitudes_servicio' }
      : { event: '*' as const, schema: 'public', table: 'solicitudes_servicio', filter: `sucursal_id=eq.${perfil?.sucursal_id}` }
    const canal = supabase.channel('sol_realtime').on('postgres_changes', channelOpts, cargar).subscribe()
    return () => { supabase?.removeChannel(canal) }
  }, [perfil?.sucursal_id, perfil?.rol, cargar])

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!selected || !token) return
    setGuardando(true)
    try {
      await apiFetch(`/api/solicitudes/${selected.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      }, token)
      setSelected((prev: any) => ({ ...prev, estado: nuevoEstado }))
      await cargar()
    } finally {
      setGuardando(false)
    }
  }

  const asignarMotorizado = async (motorizadoId: string) => {
    if (!selected || !token || !motorizadoId) return
    setGuardando(true)
    try {
      await apiFetch(`/api/solicitudes/${selected.id}/asignar`, {
        method: 'PATCH',
        body: JSON.stringify({ motorizado_id: motorizadoId }),
      }, token)
      await cargar()
    } finally {
      setGuardando(false)
    }
  }

  const filtradas = solicitudes.filter(s =>
    !busqueda ||
    s.origen_direccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.destino_direccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.tipo_servicio?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const conteoEstado = (e: string) => solicitudes.filter(s => s.estado === e).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Solicitudes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtradas.length} resultados</p>
        </div>
        <span className="text-xs text-green-500 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Tiempo real
        </span>
      </div>

      {/* Filtros de estado */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {ESTADOS.map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === e
                ? 'bg-thimpson-teal text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {e === 'todos' ? 'Todos' : e.replace('_', ' ')}
            {e !== 'todos' && conteoEstado(e) > 0 && (
              <span className={`ml-1.5 px-1 py-0.5 rounded text-xs ${filtro === e ? 'bg-white/20' : 'bg-gray-100'}`}>
                {conteoEstado(e)}
              </span>
            )}
          </button>
        ))}
        <input
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar dirección, tipo..."
          className="ml-auto px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-thimpson-teal/40 w-52"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Tipo', 'Origen', 'Destino', 'Estado', 'Motorizado', 'Precio', 'Hora'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Cargando solicitudes...</td></tr>
              )}
              {!loading && filtradas.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No hay solicitudes</td></tr>
              )}
              {filtradas.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)}
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 capitalize whitespace-nowrap">{s.tipo_servicio}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{s.origen_direccion ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{s.destino_direccion ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`badge-estado ${COLORES[s.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.estado?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.motorizados?.nombre_completo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                    {s.precio_final ? `C$${s.precio_final}` : s.precio_estimado ? `~C$${s.precio_estimado}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(s.created_at).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle */}
      <Modal open={!!selected} onClose={() => setSelected(null)}
        title={`${selected?.tipo_servicio?.replace('_', ' ') ?? 'Solicitud'} · ${selected?.estado?.replace('_', ' ') ?? ''}`}>
        {selected && (
          <div className="space-y-4">

            {/* Estado + precio */}
            <div className="flex items-center gap-3">
              <span className={`badge-estado ${COLORES[selected.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                {selected.estado?.replace('_', ' ')}
              </span>
              {(selected.precio_final || selected.precio_estimado) && (
                <span className="text-sm font-semibold text-gray-800">
                  {selected.precio_final ? `C$${selected.precio_final}` : `~C$${selected.precio_estimado} estimado`}
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(selected.created_at).toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>

            {/* Direcciones */}
            <div className="space-y-2">
              <div className="flex gap-3 bg-gray-50 rounded-xl p-3.5">
                <span className="text-green-500 mt-0.5">●</span>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Origen</p>
                  <p className="text-sm font-medium text-gray-900">{selected.origen_direccion}</p>
                  {selected.origen_referencia && <p className="text-xs text-gray-500 mt-0.5">{selected.origen_referencia}</p>}
                </div>
              </div>
              {selected.destino_direccion && (
                <div className="flex gap-3 bg-gray-50 rounded-xl p-3.5">
                  <span className="text-red-400 mt-0.5">●</span>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Destino</p>
                    <p className="text-sm font-medium text-gray-900">{selected.destino_direccion}</p>
                    {selected.destino_referencia && <p className="text-xs text-gray-500 mt-0.5">{selected.destino_referencia}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Notas */}
            {selected.notas && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3.5">
                <p className="text-xs text-yellow-700 font-medium mb-1">Notas del cliente</p>
                <p className="text-sm text-gray-700">{selected.notas}</p>
              </div>
            )}

            {/* Motorizado actual */}
            {selected.motorizados && (
              <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3.5">
                <span className="text-lg">🏍️</span>
                <div>
                  <p className="text-xs text-purple-600 font-medium">Motorizado asignado</p>
                  <p className="text-sm font-medium text-gray-900">{selected.motorizados.nombre_completo}</p>
                  {selected.motorizados.telefono && <p className="text-xs text-gray-500">{selected.motorizados.telefono}</p>}
                </div>
              </div>
            )}

            {/* Asignar motorizado */}
            {['confirmada', 'asignada'].includes(selected.estado) && motorizados.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Asignar motorizado</p>
                <select
                  defaultValue={selected.motorizado_id ?? ''}
                  onChange={e => asignarMotorizado(e.target.value)}
                  disabled={guardando}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/40 bg-white">
                  <option value="">Seleccionar motorizado disponible...</option>
                  {motorizados.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nombre_completo} · {m.telefono}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Acciones */}
            {!['cancelada', 'entregada'].includes(selected.estado) && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {SIGUIENTE[selected.estado] && (
                  <button onClick={() => cambiarEstado(SIGUIENTE[selected.estado])} disabled={guardando}
                    className="flex-1 bg-thimpson-teal text-white text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    {guardando ? 'Guardando...' : LABEL_SIGUIENTE[selected.estado]}
                  </button>
                )}
                <button onClick={() => cambiarEstado('cancelada')} disabled={guardando}
                  className="px-4 text-red-500 border border-red-200 text-sm font-medium py-2.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
