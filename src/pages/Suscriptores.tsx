import { useEffect, useState, useCallback } from 'react'
import DataTable from 'react-data-table-component'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

const estiloTabla = {
  headCells: {
    style: { backgroundColor: '#0B1F22', color: '#FBB03B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '14px 16px' },
  },
  rows: { style: { fontSize: '13px' } },
  cells: { style: { padding: '12px 16px' } },
}

export default function Suscriptores() {
  const { token } = useAuth()
  const [suscriptores, setSuscriptores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busqueda) params.set('q', busqueda)
      const r = await apiFetch<any>(`/api/suscriptores?${params}`, {}, token)
      setSuscriptores(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally { setLoading(false) }
  }, [token, busqueda])

  useEffect(() => { cargar() }, [cargar])

  const columnas = [
    {
      name: 'Nombre',
      grow: 2,
      cell: (s: any) => <div className="font-semibold text-gray-900 text-sm py-1">{s.nombre || '—'}</div>,
    },
    {
      name: 'Cédula',
      cell: (s: any) => <span className="text-sm text-gray-600">{s.cedula || '—'}</span>,
    },
    {
      name: 'Email',
      cell: (s: any) => <span className="text-sm text-gray-600">{s.email || '—'}</span>,
    },
    {
      name: 'Teléfono',
      cell: (s: any) => <span className="text-sm">{s.telefono || '—'}</span>,
    },
    {
      name: 'Fecha suscripción',
      cell: (s: any) => <span className="text-xs text-gray-400">{s.fecha ? new Date(s.fecha).toLocaleDateString('es-NI') : '—'}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Suscriptores</h1>
          <p className="text-gray-500 text-sm mt-0.5">Personas registradas para recibir ofertas y novedades · {total} suscriptores</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-4 shadow-sm">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email, cédula o teléfono..."
          className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-thimpson-teal/50" />
      </div>

      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <DataTable columns={columnas} data={suscriptores} progressPending={loading}
          progressComponent={<div className="py-10 text-gray-400 text-sm flex flex-col items-center gap-2"><div className="w-7 h-7 border-2 border-thimpson-teal/30 border-t-thimpson-teal animate-spin" />Cargando...</div>}
          noDataComponent={<div className="py-12 text-gray-400 text-sm text-center"><div className="text-4xl mb-2">⭐</div><p>No hay suscriptores registrados</p></div>}
          pagination customStyles={estiloTabla} highlightOnHover striped responsive />
      </div>
    </div>
  )
}
