import { useEffect, useState, useCallback } from 'react'
import DataTable from 'react-data-table-component'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Empleado {
  id: string
  nombre_completo: string
  cedula: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  cargo: string
  tipo_contrato: string
  fecha_ingreso: string
  salario_base: number
  frecuencia_pago: string
  estado: string
  perfil_id: string | null
  sucursales?: { id: string; nombre: string }
  notas?: string | null
}

const ESTADO_COLORES: Record<string, string> = {
  activo:    'bg-green-100 text-green-700',
  inactivo:  'bg-gray-100 text-gray-600',
  suspendido:'bg-yellow-100 text-yellow-700',
  retirado:  'bg-red-100 text-red-600',
}

const CARGO_LABELS: Record<string, string> = {
  motorizado:    'Motorizado',
  administrativo:'Administrativo',
  supervisor:    'Supervisor',
  gerente:       'Gerente',
  otro:          'Otro',
}

const CONTRATO_LABELS: Record<string, string> = {
  indefinido: 'Indefinido',
  temporal:   'Temporal',
  por_hora:   'Por hora',
  honorarios: 'Honorarios',
}

const FORM_CAMPOS = [
  { name: 'nombre_completo', label: 'Nombre completo *',    type: 'text',   required: true },
  { name: 'cedula',          label: 'Cédula de identidad',  type: 'text',   required: false },
  { name: 'telefono',        label: 'Teléfono',             type: 'tel',    required: false },
  { name: 'email',           label: 'Correo electrónico',   type: 'email',  required: false },
  { name: 'direccion',       label: 'Dirección',            type: 'text',   required: false },
  { name: 'fecha_ingreso',   label: 'Fecha de ingreso *',   type: 'date',   required: true },
  { name: 'fecha_nacimiento',label: 'Fecha de nacimiento',  type: 'date',   required: false },
  { name: 'salario_base',    label: 'Salario base (C$) *',  type: 'number', required: true },
]

const estiloTabla = {
  headCells: {
    style: {
      backgroundColor: '#0B1F22',
      color: '#FBB03B',
      fontWeight: '600',
      fontSize: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      padding: '14px 16px',
    },
  },
  rows: {
    style: {
      fontSize: '13px',
      color: '#374151',
      '&:hover': { backgroundColor: '#f0fdf4', cursor: 'pointer' },
    },
  },
  cells: { style: { padding: '12px 16px' } },
  pagination: {
    style: {
      borderTop: '1px solid #e5e7eb',
      padding: '8px 16px',
      fontSize: '13px',
    },
  },
}

const VACÍO: Partial<Empleado> = {
  nombre_completo: '', cedula: '', telefono: '', email: '',
  direccion: '', cargo: 'motorizado', tipo_contrato: 'indefinido',
  fecha_ingreso: new Date().toISOString().split('T')[0],
  salario_base: 0, frecuencia_pago: 'mensual', estado: 'activo', notas: '',
}

export default function Empleados() {
  const { token, perfil } = useAuth()
  const [empleados, setEmpleados]   = useState<Empleado[]>([])
  const [loading, setLoading]       = useState(true)
  const [totalRows, setTotalRows]   = useState(0)
  const [busqueda, setBusqueda]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCargo, setFiltroCargo]   = useState('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [editando, setEditando]     = useState<Empleado | null>(null)
  const [form, setForm]             = useState<Partial<Empleado>>(VACÍO)
  const [guardando, setGuardando]   = useState(false)

  const cargar = useCallback(async (pagina = 1) => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ pagina: String(pagina), por_pagina: '15' })
      if (busqueda)     params.set('q', busqueda)
      if (filtroEstado) params.set('estado', filtroEstado)
      if (filtroCargo)  params.set('cargo', filtroCargo)

      const r = await apiFetch<any>(`/api/empleados?${params}`, {}, token)
      setEmpleados(r.data ?? [])
      setTotalRows(r.total ?? 0)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally {
      setLoading(false)
    }
  }, [token, busqueda, filtroEstado, filtroCargo])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => {
    setEditando(null)
    setForm({ ...VACÍO })
    setModalOpen(true)
  }

  const abrirEditar = (emp: Empleado) => {
    setEditando(emp)
    setForm({ ...emp })
    setModalOpen(true)
  }

  const cerrarModal = () => { setModalOpen(false); setEditando(null); setForm(VACÍO) }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setGuardando(true)
    try {
      if (editando) {
        await apiFetch(`/api/empleados/${editando.id}`, {
          method: 'PATCH', body: JSON.stringify(form),
        }, token)
        Swal.fire({ icon: 'success', title: 'Empleado actualizado', timer: 1800, showConfirmButton: false })
      } else {
        await apiFetch('/api/empleados', {
          method: 'POST', body: JSON.stringify(form),
        }, token)
        Swal.fire({ icon: 'success', title: '¡Empleado registrado!', timer: 1800, showConfirmButton: false })
      }
      cerrarModal()
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (emp: Empleado) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar empleado?',
      html: `<p>¿Estás seguro de eliminar a <strong>${emp.nombre_completo}</strong>?</p><p class="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer.</p>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#0B1F22',
    })
    if (!result.isConfirmed) return
    try {
      const r = await apiFetch<any>(`/api/empleados/${emp.id}`, { method: 'DELETE' }, token!)
      Swal.fire({ icon: 'success', title: 'Eliminado', text: r.message, timer: 2000, showConfirmButton: false })
      cargar()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  // Estadísticas rápidas
  const activos    = empleados.filter(e => e.estado === 'activo').length
  const motorizados = empleados.filter(e => e.cargo === 'motorizado').length
  const conCuenta  = empleados.filter(e => e.perfil_id).length

  const columnas = [
    {
      name: 'Empleado',
      cell: (row: Empleado) => (
        <div className="py-1">
          <div className="font-semibold text-gray-900 text-sm">{row.nombre_completo}</div>
          <div className="text-xs text-gray-400">{row.cedula ?? 'Sin cédula'}</div>
        </div>
      ),
      sortable: true,
      selector: (row: Empleado) => row.nombre_completo,
      grow: 2,
    },
    {
      name: 'Cargo',
      cell: (row: Empleado) => (
        <span className="bg-thimpson-teal/10 text-thimpson-teal text-xs font-medium px-2 py-1 rounded-full">
          {CARGO_LABELS[row.cargo] ?? row.cargo}
        </span>
      ),
    },
    {
      name: 'Teléfono',
      selector: (row: Empleado) => row.telefono ?? '—',
      cell: (row: Empleado) => <span className="text-sm">{row.telefono ?? '—'}</span>,
    },
    {
      name: 'Salario',
      selector: (row: Empleado) => row.salario_base,
      cell: (row: Empleado) => (
        <span className="font-semibold text-gray-700 text-sm">
          C${Number(row.salario_base).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Ingreso',
      selector: (row: Empleado) => row.fecha_ingreso,
      cell: (row: Empleado) => (
        <span className="text-sm text-gray-600">
          {new Date(row.fecha_ingreso).toLocaleDateString('es-NI', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Estado',
      cell: (row: Empleado) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${ESTADO_COLORES[row.estado] ?? 'bg-gray-100 text-gray-600'}`}>
          {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
        </span>
      ),
    },
    {
      name: 'Cuenta',
      cell: (row: Empleado) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${row.perfil_id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.perfil_id ? '✓ Activa' : 'Sin cuenta'}
        </span>
      ),
    },
    {
      name: 'Acciones',
      cell: (row: Empleado) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => abrirEditar(row)}
            className="px-2.5 py-1.5 bg-thimpson-teal text-white text-xs rounded-lg hover:opacity-90 transition-opacity">
            Editar
          </button>
          <button onClick={() => eliminar(row)}
            className="px-2.5 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:opacity-90 transition-opacity">
            Eliminar
          </button>
        </div>
      ),
      ignoreRowClick: true,
      right: true,
      minWidth: '140px',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de recursos humanos · {totalRows} registros</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 bg-thimpson-teal text-thimpson-yellow font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
          <span className="text-lg leading-none">＋</span>
          Nuevo Empleado
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total empleados', value: totalRows,   color: 'text-thimpson-teal',  bg: 'bg-teal-50',   icon: '👥' },
          { label: 'Activos',         value: activos,     color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
          { label: 'Motorizados',     value: motorizados, color: 'text-blue-600',  bg: 'bg-blue-50',  icon: '🏍️' },
          { label: 'Con cuenta',      value: conCuenta,   color: 'text-purple-600',bg: 'bg-purple-50',icon: '🔑' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white shadow-sm`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-thimpson-teal/50"
          />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-thimpson-teal/50 bg-white">
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="suspendido">Suspendido</option>
            <option value="retirado">Retirado</option>
          </select>
          <select value={filtroCargo} onChange={e => setFiltroCargo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-thimpson-teal/50 bg-white">
            <option value="">Todos los cargos</option>
            <option value="motorizado">Motorizado</option>
            <option value="administrativo">Administrativo</option>
            <option value="supervisor">Supervisor</option>
            <option value="gerente">Gerente</option>
          </select>
          {(busqueda || filtroEstado || filtroCargo) && (
            <button onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroCargo('') }}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Limpiar filtros ×
            </button>
          )}
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columnas}
          data={empleados}
          progressPending={loading}
          progressComponent={
            <div className="py-12 text-gray-400 text-sm flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-thimpson-teal/30 border-t-thimpson-teal rounded-full animate-spin" />
              Cargando empleados...
            </div>
          }
          noDataComponent={
            <div className="py-14 text-gray-400 text-sm flex flex-col items-center gap-2">
              <span className="text-4xl">👥</span>
              <p>No hay empleados registrados</p>
              <button onClick={abrirCrear} className="mt-1 text-thimpson-teal font-medium text-sm hover:underline">
                Registrar primer empleado
              </button>
            </div>
          }
          pagination
          paginationPerPage={15}
          paginationRowsPerPageOptions={[10, 15, 25, 50]}
          paginationTotalRows={totalRows}
          onChangePage={(page) => cargar(page)}
          onChangeRowsPerPage={() => cargar(1)}
          customStyles={estiloTabla}
          highlightOnHover
          striped
          responsive
        />
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Header del modal */}
            <div className="bg-thimpson-teal px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-thimpson-yellow font-bold text-lg">
                  {editando ? 'Editar empleado' : 'Nuevo empleado'}
                </h2>
                <p className="text-white/60 text-sm mt-0.5">
                  {editando ? `Modificando: ${editando.nombre_completo}` : 'Completa los datos del nuevo empleado'}
                </p>
              </div>
              <button onClick={cerrarModal}
                className="text-white/60 hover:text-white text-2xl leading-none transition-colors">
                ×
              </button>
            </div>

            <form onSubmit={guardar} className="p-6 space-y-5">
              {/* Grid de campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FORM_CAMPOS.map(f => (
                  <div key={f.name} className={f.name === 'nombre_completo' || f.name === 'direccion' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      required={f.required}
                      value={(form as any)[f.name] ?? ''}
                      onChange={e => set(f.name, f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 focus:ring-1 focus:ring-thimpson-teal/20 transition-colors"
                      min={f.type === 'number' ? '0' : undefined}
                      step={f.type === 'number' ? '0.01' : undefined}
                    />
                  </div>
                ))}
              </div>

              {/* Selects */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Cargo *</label>
                  <select value={form.cargo ?? 'motorizado'} onChange={e => set('cargo', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 bg-white">
                    {Object.entries(CARGO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Tipo contrato</label>
                  <select value={form.tipo_contrato ?? 'indefinido'} onChange={e => set('tipo_contrato', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 bg-white">
                    {Object.entries(CONTRATO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Frecuencia pago</label>
                  <select value={form.frecuencia_pago ?? 'mensual'} onChange={e => set('frecuencia_pago', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 bg-white">
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Estado</label>
                  <select value={form.estado ?? 'activo'} onChange={e => set('estado', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 bg-white">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="retirado">Retirado</option>
                  </select>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notas internas</label>
                <textarea
                  value={form.notas ?? ''} onChange={e => set('notas', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50 resize-none"
                  placeholder="Observaciones internas sobre el empleado..."
                />
              </div>

              {/* Acciones del modal */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-thimpson-teal text-thimpson-yellow font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar empleado'}
                </button>
                <button type="button" onClick={cerrarModal}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
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
