import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  tipo_precio: 'fijo' | 'manual'
  precio_base: number
  precio_por_km: number | null
  icono: string | null
  orden: number
  activo: boolean
  sucursal_id: string | null
}

const ICONOS = ['🚚', '📦', '🛒', '🍔', '💊', '👔', '🛵', '🏪', '🔧', '📋']

const VACÍO: Partial<Servicio> = {
  nombre: '', descripcion: '', tipo_precio: 'fijo',
  precio_base: 0, precio_por_km: 0, icono: '🚚', orden: 1, activo: true,
}

export default function Servicios() {
  const { token } = useAuth()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [form, setForm] = useState<Partial<Servicio>>(VACÍO)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const r = await apiFetch<any>('/api/catalogo-servicios?activo=false', {}, token)
      setServicios(r.data ?? [])
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => { setEditando(null); setForm({ ...VACÍO, orden: servicios.length + 1 }); setModalOpen(true) }
  const abrirEditar = (s: Servicio) => { setEditando(s); setForm({ ...s }); setModalOpen(true) }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setGuardando(true)
    try {
      if (editando) {
        await apiFetch(`/api/catalogo-servicios/${editando.id}`, { method: 'PATCH', body: JSON.stringify(form) }, token)
        Swal.fire({ icon: 'success', title: 'Servicio actualizado', timer: 1800, showConfirmButton: false })
      } else {
        await apiFetch('/api/catalogo-servicios', { method: 'POST', body: JSON.stringify(form) }, token)
        Swal.fire({ icon: 'success', title: '¡Servicio creado!', timer: 1800, showConfirmButton: false })
      }
      setModalOpen(false)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setGuardando(false) }
  }

  const toggleActivo = async (s: Servicio) => {
    try {
      await apiFetch(`/api/catalogo-servicios/${s.id}`, { method: 'PATCH', body: JSON.stringify({ activo: !s.activo }) }, token!)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catálogo de servicios</h1>
          <p className="text-gray-500 text-sm mt-0.5">Servicios de entrega disponibles · {servicios.length} configurados</p>
        </div>
        <button onClick={abrirCrear} className="flex items-center gap-2 bg-thimpson-teal text-thimpson-yellow font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 shadow-sm">
          <span className="text-lg leading-none">＋</span> Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400 text-sm flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-thimpson-teal/30 border-t-thimpson-teal rounded-full animate-spin" />
          Cargando servicios...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servicios.map(s => (
            <div key={s.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${!s.activo ? 'opacity-60 border-red-100' : 'border-gray-100'}`}>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-thimpson-teal/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {s.icono ?? '🚚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base truncate">{s.nombre}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.activo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{s.descripcion ?? 'Sin descripción'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="bg-thimpson-yellow/10 rounded-lg px-3 py-1.5">
                    <div className="text-xs text-gray-500">Precio base</div>
                    <div className="font-bold text-thimpson-teal">
                      C${Number(s.precio_base).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  {s.precio_por_km && s.precio_por_km > 0 && (
                    <div className="bg-blue-50 rounded-lg px-3 py-1.5">
                      <div className="text-xs text-gray-500">Por km</div>
                      <div className="font-bold text-blue-600">
                        C${Number(s.precio_por_km).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg px-3 py-1.5">
                    <div className="text-xs text-gray-500">Tipo precio</div>
                    <div className="font-medium text-gray-700 text-sm">{s.tipo_precio === 'fijo' ? 'Fijo' : 'Manual'}</div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4 flex gap-2 border-t border-gray-50 pt-3">
                <button onClick={() => abrirEditar(s)}
                  className="flex-1 py-2 bg-thimpson-teal text-thimpson-yellow text-sm font-semibold rounded-lg hover:opacity-90">
                  Editar
                </button>
                <button onClick={() => toggleActivo(s)}
                  className={`px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 ${s.activo ? 'bg-red-500' : 'bg-green-600'}`}>
                  {s.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}

          {servicios.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">
              <div className="text-4xl mb-2">🚚</div>
              <p className="text-sm mb-3">No hay servicios configurados</p>
              <button onClick={abrirCrear} className="text-thimpson-teal font-medium text-sm hover:underline">Crear primer servicio</button>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-thimpson-teal px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-thimpson-yellow font-bold text-lg">{editando ? 'Editar servicio' : 'Nuevo servicio'}</h2>
                <p className="text-white/60 text-sm mt-0.5">Configura el catálogo de entrega</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              {/* Icono selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Icono</label>
                <div className="flex flex-wrap gap-2">
                  {ICONOS.map(ic => (
                    <button key={ic} type="button" onClick={() => set('icono', ic)}
                      className={`w-10 h-10 text-xl rounded-lg transition-all ${form.icono === ic ? 'bg-thimpson-teal ring-2 ring-thimpson-yellow' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre del servicio *</label>
                <input type="text" required value={form.nombre ?? ''} onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Delivery Express, Envío de documentos..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Descripción</label>
                <textarea rows={3} value={form.descripcion ?? ''} onChange={e => set('descripcion', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 resize-none"
                  placeholder="Describe brevemente el servicio..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Tipo de precio</label>
                  <select value={form.tipo_precio ?? 'fijo'} onChange={e => set('tipo_precio', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                    <option value="fijo">Precio fijo</option>
                    <option value="manual">Precio manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Orden en lista</label>
                  <input type="number" min="1" value={form.orden ?? 1} onChange={e => set('orden', parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Precio base (C$) *</label>
                  <input type="number" min="0" step="0.01" required value={form.precio_base ?? 0}
                    onChange={e => set('precio_base', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Precio por km (C$)</label>
                  <input type="number" min="0" step="0.01" value={form.precio_por_km ?? 0}
                    onChange={e => set('precio_por_km', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-thimpson-teal text-thimpson-yellow font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear servicio'}
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
