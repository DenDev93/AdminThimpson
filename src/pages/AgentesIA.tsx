import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Modal from '@/components/Modal'

const MODELOS = ['claude-sonnet-4-20250514', 'claude-haiku-4-5', 'claude-3-5-sonnet-20241022']
const CANALES = ['web', 'whatsapp', 'app_movil', 'panel_admin']
const PROMPT_DEFAULT = 'Sos el asistente virtual de Servicio Express Thimpson en Ocotal, Nicaragua. Respondé en español, amable y conciso. Ayudás con delivery, mandados, encomiendas y compras.'

export default function AgentesIA() {
  const { token } = useAuth()
  const [agentes, setAgentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const r = await apiFetch<any>('/api/agentes-ia', {}, token)
      setAgentes(r.data ?? [])
    } catch { setAgentes([]) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', system_prompt: PROMPT_DEFAULT, modelo: 'claude-sonnet-4-20250514', activo: false, canal: 'web' })
    setModalOpen(true)
  }

  const abrirEditar = (a: any) => {
    setEditando(a)
    setForm({ nombre: a.nombre, descripcion: a.descripcion ?? '', system_prompt: a.system_prompt ?? '', modelo: a.modelo, activo: a.activo, canal: a.canal })
    setModalOpen(true)
  }

  const set = (k: string, v: any) => setForm({ ...form, [k]: v })

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setGuardando(true)
    try {
      if (!form.nombre?.trim()) { Swal.fire({ icon: 'error', title: 'Error', text: 'El nombre es requerido', confirmButtonColor: '#0B1F22' }); return }
      if (editando) {
        await apiFetch(`/api/agentes-ia/${editando.id}`, { method: 'PUT', body: JSON.stringify(form) }, token)
        Swal.fire({ icon: 'success', title: 'Agente actualizado', timer: 1800, showConfirmButton: false })
      } else {
        await apiFetch('/api/agentes-ia', { method: 'POST', body: JSON.stringify(form) }, token)
        Swal.fire({ icon: 'success', title: 'Agente creado', timer: 1800, showConfirmButton: false })
      }
      setModalOpen(false)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setGuardando(false) }
  }

  const toggleActivo = async (a: any) => {
    const result = await Swal.fire({
      icon: 'question', title: `¿${a.activo ? 'Desactivar' : 'Activar'} agente?`, text: a.nombre,
      showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar',
      confirmButtonColor: a.activo ? '#dc2626' : '#16a34a',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/agentes-ia/${a.id}`, { method: 'PUT', body: JSON.stringify({ activo: !a.activo }) }, token!)
      cargar()
    } catch (err: any) { Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' }) }
  }

  const eliminar = async (a: any) => {
    const result = await Swal.fire({
      icon: 'warning', title: '¿Eliminar agente?', text: a.nombre,
      showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/agentes-ia/${a.id}`, { method: 'DELETE' }, token!)
      cargar()
    } catch (err: any) { Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' }) }
  }

  const activos = agentes.filter(a => a.activo).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agentes de IA</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configura los agentes inteligentes del ecosistema · {agentes.length} agentes</p>
        </div>
        <button onClick={abrirCrear} className="flex items-center gap-2 bg-thimpson-teal text-thimpson-yellow font-semibold text-sm px-4 py-2.5 shadow-sm">
          <span className="text-lg leading-none">＋</span> Nuevo agente
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-teal-50 p-4 border border-white shadow-sm">
          <div className="flex justify-between mb-1"><span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</span><span className="text-xl">🤖</span></div>
          <div className="text-3xl font-bold text-thimpson-teal">{agentes.length}</div>
        </div>
        <div className="bg-green-50 p-4 border border-white shadow-sm">
          <div className="flex justify-between mb-1"><span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Activos</span><span className="text-xl">✅</span></div>
          <div className="text-3xl font-bold text-green-600">{activos}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Cargando agentes...</div>
      ) : agentes.length === 0 ? (
        <div className="bg-white border border-gray-100 p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin agentes configurados</h3>
          <p className="text-gray-500 text-sm mb-6">Creá tu primer agente de IA para el ecosistema Thimpson.</p>
          <button onClick={abrirCrear} className="bg-thimpson-yellow text-thimpson-teal font-bold text-sm px-8 py-3 shadow-md">
            Crear agente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agentes.map(a => (
            <div key={a.id} className={`bg-white border shadow-sm p-5 ${a.activo ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{a.nombre}</h3>
                  {a.descripcion && <p className="text-sm text-gray-500 mt-0.5">{a.descripcion}</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 ${a.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 uppercase tracking-wide">{a.modelo}</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 uppercase tracking-wide">Canal: {a.canal}</span>
              </div>
              {a.system_prompt && (
                <p className="text-xs text-gray-400 bg-gray-50 p-2 line-clamp-2 mb-3">{a.system_prompt}</p>
              )}
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button onClick={() => abrirEditar(a)} className="px-3 py-1.5 bg-thimpson-teal text-white text-xs hover:opacity-90">Editar</button>
                <button onClick={() => toggleActivo(a)} className={`px-3 py-1.5 text-white text-xs hover:opacity-90 ${a.activo ? 'bg-yellow-500' : 'bg-green-600'}`}>
                  {a.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => eliminar(a)} className="px-3 py-1.5 bg-red-500 text-white text-xs hover:opacity-90">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar agente' : 'Nuevo agente de IA'}>
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre *</label>
            <input type="text" required value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Descripción</label>
            <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Breve descripción del propósito del agente"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Modelo</label>
              <select value={form.modelo} onChange={e => set('modelo', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none bg-white">
                {MODELOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Canal</label>
              <select value={form.canal} onChange={e => set('canal', e.target.value)}
                className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none bg-white">
                {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">System Prompt</label>
            <textarea value={form.system_prompt} onChange={e => set('system_prompt', e.target.value)} rows={6}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 resize-none font-mono" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Activo</label>
            <button type="button" onClick={() => set('activo', !form.activo)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" disabled={guardando}
              className="flex-1 bg-thimpson-teal text-thimpson-yellow font-semibold py-2.5 hover:opacity-90 disabled:opacity-50 text-sm">
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear agente'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
