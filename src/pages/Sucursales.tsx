import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Sucursal {
  id: string
  nombre: string
  ciudad: string
  departamento: string | null
  pais: string
  direccion: string | null
  telefono_claro: string | null
  telefono_tigo: string | null
  whatsapp: string | null
  email: string | null
  activo: boolean
  created_at: string
}

const VACÍO: Partial<Sucursal> = {
  nombre: '', ciudad: '', departamento: '', pais: 'Nicaragua',
  direccion: '', telefono_claro: '', telefono_tigo: '', whatsapp: '', email: '', activo: true,
}

export default function Sucursales() {
  const { token, perfil } = useAuth()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Sucursal | null>(null)
  const [form, setForm] = useState<Partial<Sucursal>>(VACÍO)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const r = await apiFetch<any>('/api/sucursales?todas=true', {}, token)
      setSucursales(r.data ?? [])
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => { setEditando(null); setForm({ ...VACÍO }); setModalOpen(true) }
  const abrirEditar = (s: Sucursal) => { setEditando(s); setForm({ ...s }); setModalOpen(true) }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setGuardando(true)
    try {
      if (editando) {
        await apiFetch(`/api/sucursales/${editando.id}`, { method: 'PATCH', body: JSON.stringify(form) }, token)
        Swal.fire({ icon: 'success', title: 'Sucursal actualizada', timer: 1800, showConfirmButton: false })
      } else {
        await apiFetch('/api/sucursales', { method: 'POST', body: JSON.stringify(form) }, token)
        Swal.fire({ icon: 'success', title: '¡Sucursal creada!', timer: 1800, showConfirmButton: false })
      }
      setModalOpen(false)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setGuardando(false) }
  }

  const toggleActivo = async (s: Sucursal) => {
    const result = await Swal.fire({
      icon: 'question',
      title: s.activo ? '¿Desactivar sucursal?' : '¿Activar sucursal?',
      text: s.nombre,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: s.activo ? '#dc2626' : '#16a34a',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/sucursales/${s.id}`, { method: 'PATCH', body: JSON.stringify({ activo: !s.activo }) }, token!)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const campos = [
    { name: 'nombre', label: 'Nombre de la sucursal *', type: 'text', required: true, span: 2 },
    { name: 'ciudad', label: 'Ciudad *', type: 'text', required: true },
    { name: 'departamento', label: 'Departamento', type: 'text' },
    { name: 'pais', label: 'País', type: 'text' },
    { name: 'direccion', label: 'Dirección', type: 'text', span: 2 },
    { name: 'telefono_claro', label: 'Teléfono Claro', type: 'tel' },
    { name: 'telefono_tigo', label: 'Teléfono Tigo', type: 'tel' },
    { name: 'whatsapp', label: 'WhatsApp', type: 'tel' },
    { name: 'email', label: 'Email', type: 'email' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sucursales</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de puntos de servicio · {sucursales.length} registradas</p>
        </div>
        {perfil?.rol === 'super_admin' && (
          <button onClick={abrirCrear} className="flex items-center gap-2 bg-thimpson-teal text-thimpson-yellow font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 shadow-sm">
            <span className="text-lg leading-none">＋</span> Nueva sucursal
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400 text-sm flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-thimpson-teal/30 border-t-thimpson-teal rounded-full animate-spin" />
          Cargando sucursales...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sucursales.map(s => (
            <div key={s.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${s.activo ? 'border-gray-100' : 'border-red-100 opacity-70'}`}>
              {/* Header de la card */}
              <div className="bg-thimpson-teal px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-thimpson-yellow font-bold text-base">{s.nombre}</h3>
                    <p className="text-white/60 text-sm mt-0.5">{s.ciudad}{s.departamento ? `, ${s.departamento}` : ''}, {s.pais}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.activo ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
                    {s.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              {/* Cuerpo */}
              <div className="p-5 space-y-2.5">
                {s.direccion && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5">📍</span>
                    <span>{s.direccion}</span>
                  </div>
                )}
                {(s.telefono_claro || s.telefono_tigo) && (
                  <div className="flex flex-wrap gap-3">
                    {s.telefono_claro && (
                      <a href={`tel:${s.telefono_claro}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        <span>📞</span> Claro: {s.telefono_claro}
                      </a>
                    )}
                    {s.telefono_tigo && (
                      <a href={`tel:${s.telefono_tigo}`} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                        <span>📞</span> Tigo: {s.telefono_tigo}
                      </a>
                    )}
                  </div>
                )}
                {s.whatsapp && (
                  <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-green-600 hover:underline">
                    <span>💬</span> WhatsApp: {s.whatsapp}
                  </a>
                )}
                {s.email && (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:underline">
                    <span>✉️</span> {s.email}
                  </a>
                )}
              </div>

              {/* Acciones */}
              <div className="px-5 pb-4 flex gap-2">
                <button onClick={() => abrirEditar(s)} title="Editar"
                  className="flex-1 py-2 bg-thimpson-teal/10 text-thimpson-teal text-sm font-semibold rounded-lg hover:bg-thimpson-teal/20 transition-colors flex items-center justify-center gap-2">
                  ✏️ Editar
                </button>
                {perfil?.rol === 'super_admin' && (
                  <button onClick={() => toggleActivo(s)} title={s.activo ? 'Desactivar' : 'Activar'}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${s.activo ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {s.activo ? '⏻' : '▶️'} {s.activo ? 'Desactivar' : 'Activar'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {sucursales.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-sm">No hay sucursales registradas</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="bg-thimpson-teal px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-thimpson-yellow font-bold text-lg">{editando ? 'Editar sucursal' : 'Nueva sucursal'}</h2>
                <p className="text-white/60 text-sm mt-0.5">{editando ? editando.nombre : 'Registrar nuevo punto de servicio'}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {campos.map(c => (
                  <div key={c.name} className={c.span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{c.label}</label>
                    <input type={c.type} required={c.required} value={(form as any)[c.name] ?? ''}
                      onChange={e => set(c.name, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-thimpson-teal text-thimpson-yellow font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear sucursal'}
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
