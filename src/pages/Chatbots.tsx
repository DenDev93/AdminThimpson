import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Modal from '@/components/Modal'

const MODELOS = ['claude-sonnet-4-20250514', 'claude-haiku-4-5', 'claude-3-5-sonnet-20241022']
const CANALES = ['whatsapp', 'web', 'app_movil']

export default function Chatbots() {
  const { token } = useAuth()
  const [chatbots, setChatbots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const r = await apiFetch<any>('/api/chatbots', {}, token)
      setChatbots(r.data ?? [])
    } catch { setChatbots([]) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', welcome_message: '', system_prompt: '', modelo: 'claude-haiku-4-5', activo: false, canal: 'whatsapp', whatsapp_numero: '' })
    setModalOpen(true)
  }

  const abrirEditar = (c: any) => {
    setEditando(c)
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? '', welcome_message: c.welcome_message ?? '', system_prompt: c.system_prompt ?? '', modelo: c.modelo, activo: c.activo, canal: c.canal, whatsapp_numero: c.whatsapp_numero ?? '' })
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
        await apiFetch(`/api/chatbots/${editando.id}`, { method: 'PUT', body: JSON.stringify(form) }, token)
        Swal.fire({ icon: 'success', title: 'Chatbot actualizado', timer: 1800, showConfirmButton: false })
      } else {
        await apiFetch('/api/chatbots', { method: 'POST', body: JSON.stringify(form) }, token)
        Swal.fire({ icon: 'success', title: 'Chatbot creado', timer: 1800, showConfirmButton: false })
      }
      setModalOpen(false)
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setGuardando(false) }
  }

  const toggleActivo = async (c: any) => {
    const result = await Swal.fire({
      icon: 'question', title: `¿${c.activo ? 'Desactivar' : 'Activar'} chatbot?`, text: c.nombre,
      showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar',
      confirmButtonColor: c.activo ? '#dc2626' : '#16a34a',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/chatbots/${c.id}`, { method: 'PUT', body: JSON.stringify({ activo: !c.activo }) }, token!)
      cargar()
    } catch (err: any) { Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' }) }
  }

  const eliminar = async (c: any) => {
    const result = await Swal.fire({
      icon: 'warning', title: '¿Eliminar chatbot?', text: c.nombre,
      showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/chatbots/${c.id}`, { method: 'DELETE' }, token!)
      cargar()
    } catch (err: any) { Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' }) }
  }

  const activos = chatbots.filter(c => c.activo).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chatbots</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configura los chatbots de atención automatizada · {chatbots.length} chatbots</p>
        </div>
        <button onClick={abrirCrear} className="flex items-center gap-2 bg-thimpson-teal text-thimpson-yellow font-semibold text-sm px-4 py-2.5 shadow-sm">
          <span className="text-lg leading-none">＋</span> Nuevo chatbot
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-teal-50 p-4 border border-white shadow-sm">
          <div className="flex justify-between mb-1"><span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</span><span className="text-xl">💬</span></div>
          <div className="text-3xl font-bold text-thimpson-teal">{chatbots.length}</div>
        </div>
        <div className="bg-green-50 p-4 border border-white shadow-sm">
          <div className="flex justify-between mb-1"><span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Activos</span><span className="text-xl">✅</span></div>
          <div className="text-3xl font-bold text-green-600">{activos}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Cargando chatbots...</div>
      ) : chatbots.length === 0 ? (
        <div className="bg-white border border-gray-100 p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin chatbots configurados</h3>
          <p className="text-gray-500 text-sm mb-6">Creá tu primer chatbot para atención automatizada.</p>
          <button onClick={abrirCrear} className="bg-thimpson-yellow text-thimpson-teal font-bold text-sm px-8 py-3 shadow-md">
            Crear chatbot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chatbots.map(c => (
            <div key={c.id} className={`bg-white border shadow-sm p-5 ${c.activo ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{c.nombre}</h3>
                  {c.descripcion && <p className="text-sm text-gray-500 mt-0.5">{c.descripcion}</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 uppercase tracking-wide">{c.modelo}</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 uppercase tracking-wide">Canal: {c.canal}</span>
                {c.whatsapp_numero && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 uppercase tracking-wide">📱 {c.whatsapp_numero}</span>}
              </div>
              {c.welcome_message && (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-2 mb-1">"{c.welcome_message}"</p>
              )}
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button onClick={() => abrirEditar(c)} className="px-3 py-1.5 bg-thimpson-teal text-white text-xs hover:opacity-90">Editar</button>
                <button onClick={() => toggleActivo(c)} className={`px-3 py-1.5 text-white text-xs hover:opacity-90 ${c.activo ? 'bg-yellow-500' : 'bg-green-600'}`}>
                  {c.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => eliminar(c)} className="px-3 py-1.5 bg-red-500 text-white text-xs hover:opacity-90">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar chatbot' : 'Nuevo chatbot'}>
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre *</label>
            <input type="text" required value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Descripción</label>
            <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Propósito del chatbot" className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
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
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Número WhatsApp (si aplica)</label>
            <input type="text" value={form.whatsapp_numero} onChange={e => set('whatsapp_numero', e.target.value)}
              placeholder="50587654321" className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Mensaje de bienvenida</label>
            <textarea value={form.welcome_message} onChange={e => set('welcome_message', e.target.value)} rows={2}
              placeholder="¡Hola! Soy el asistente automático de Thimpson Express..."
              className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">System Prompt</label>
            <textarea value={form.system_prompt} onChange={e => set('system_prompt', e.target.value)} rows={5}
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
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear chatbot'}
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
