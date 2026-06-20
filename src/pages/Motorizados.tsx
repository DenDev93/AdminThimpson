import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Modal from '@/components/Modal'

export default function Motorizados() {
  const { token } = useAuth()
  const [motorizados, setMotorizados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'disponible' | 'no_disponible'>('todos')

  const cargar = useCallback(async () => {
    if (!token) return
    try {
      const r = await apiFetch<any>('/api/motorizados?por_pagina=50', {}, token)
      setMotorizados(r.data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const toggleDisponible = async (m: any) => {
    if (!token) return
    setGuardando(true)
    try {
      await apiFetch(`/api/motorizados/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ disponible: !m.disponible }),
      }, token)
      await cargar()
      setSelected(null)
    } finally {
      setGuardando(false)
    }
  }

  const filtrados = motorizados.filter(m => {
    if (filtro === 'disponible') return m.disponible
    if (filtro === 'no_disponible') return !m.disponible
    return true
  })

  const disponibles = motorizados.filter(m => m.disponible).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Motorizados</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {motorizados.length} registrados · <span className="text-green-600 font-medium">{disponibles} disponibles</span> · {motorizados.length - disponibles} ocupados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'todos', label: 'Todos' },
          { key: 'disponible', label: 'Disponibles' },
          { key: 'no_disponible', label: 'No disponibles' },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === f.key ? 'bg-thimpson-teal text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full" />
              <div className="flex-1">
                <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}

        {!loading && filtrados.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-400 text-sm">
            No hay motorizados {filtro !== 'todos' ? `(${filtro.replace('_', ' ')})` : 'registrados'}
          </div>
        )}

        {filtrados.map(m => (
          <div key={m.id} onClick={() => setSelected(m)}
            className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 bg-thimpson-teal/10 text-thimpson-teal rounded-full flex items-center justify-center font-bold text-base group-hover:bg-thimpson-teal group-hover:text-white transition-colors">
                {(m.nombre_completo ?? '?')[0].toUpperCase()}
              </div>
              <span className={`badge-estado ${m.disponible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {m.disponible ? 'Disponible' : 'No disponible'}
              </span>
            </div>

            <p className="font-semibold text-gray-900 text-sm">{m.nombre_completo}</p>
            {m.telefono && <p className="text-gray-500 text-xs mt-0.5">{m.telefono}</p>}

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-3 text-xs text-gray-400">
              {m.vehiculo && <span>🏍️ {m.vehiculo}</span>}
              {m.placa && <span>{m.placa}</span>}
              {m.zona && <span>📍 {m.zona}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal detalle */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Motorizado">
        {selected && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-thimpson-teal/10 text-thimpson-teal rounded-full flex items-center justify-center font-bold text-2xl">
                {(selected.nombre_completo ?? '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-base">{selected.nombre_completo}</p>
                {selected.telefono && <p className="text-gray-500 text-sm">{selected.telefono}</p>}
                <span className={`badge-estado mt-1 ${selected.disponible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {selected.disponible ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </div>

            {/* Datos */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Cédula', value: selected.cedula },
                { label: 'Vehículo', value: selected.vehiculo },
                { label: 'Placa', value: selected.placa },
                { label: 'Zona', value: selected.zona },
              ].map(f => f.value && (
                <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Botón toggle */}
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => toggleDisponible(selected)}
                disabled={guardando}
                className={`w-full text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                  selected.disponible
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-thimpson-teal text-white hover:opacity-90'
                }`}>
                {guardando ? 'Guardando...' : selected.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
