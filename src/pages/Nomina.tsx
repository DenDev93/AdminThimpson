import { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Pago {
  id: string
  empleado_id: string
  salario_base: number
  bonificaciones: number
  deducciones: number
  total_neto: number
  estado: string
  metodo_pago: string
  notas?: string
  pagado_en?: string
  empleados?: { id: string; nombre_completo: string; cargo: string; cedula?: string }
}

interface PeriodoNomina {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
  total_pagado: number
  empleados_count: number
  sucursales?: { id: string; nombre: string }
  pagos?: Pago[]
  creado_en: string
}

const ESTADO_PERIODO: Record<string, { label: string; bg: string; text: string }> = {
  borrador:  { label: 'Borrador',  bg: 'bg-gray-100',   text: 'text-gray-600' },
  aprobado:  { label: 'Aprobado',  bg: 'bg-blue-100',   text: 'text-blue-700' },
  pagado:    { label: 'Pagado',    bg: 'bg-green-100',  text: 'text-green-700' },
  anulado:   { label: 'Anulado',   bg: 'bg-red-100',    text: 'text-red-600' },
}

const ESTADO_PAGO: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  pagado:    'bg-green-100 text-green-700',
  retenido:  'bg-red-100 text-red-600',
}

export default function Nomina() {
  const { token } = useAuth()
  const [periodos, setPeriodos]        = useState<PeriodoNomina[]>([])
  const [loading, setLoading]          = useState(true)
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoNomina | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [modalCrear, setModalCrear]    = useState(false)
  const [guardando, setGuardando]      = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
  })

  const formatMonto = (n: number) => `C$${Number(n).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`
  const formatFecha = (s: string) => new Date(s).toLocaleDateString('es-NI', { year: 'numeric', month: 'short', day: 'numeric' })

  const cargarPeriodos = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const r = await apiFetch<any>('/api/nomina', {}, token)
      setPeriodos(r.data ?? [])
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { cargarPeriodos() }, [cargarPeriodos])

  const abrirDetalle = async (id: string) => {
    setLoadingDetalle(true)
    try {
      const r = await apiFetch<any>(`/api/nomina/${id}`, {}, token!)
      setPeriodoActivo(r.data)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally {
      setLoadingDetalle(false)
    }
  }

  const crearPeriodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!form.nombre || !form.fecha_inicio || !form.fecha_fin) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Completa todos los campos', confirmButtonColor: '#0B1F22' })
      return
    }
    setGuardando(true)
    try {
      const r = await apiFetch<any>('/api/nomina', {
        method: 'POST', body: JSON.stringify(form),
      }, token)
      Swal.fire({ icon: 'success', title: '¡Nómina creada!', text: r.message, timer: 2000, showConfirmButton: false })
      setModalCrear(false)
      setForm({ nombre: '', fecha_inicio: '', fecha_fin: '' })
      cargarPeriodos()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstadoPeriodo = async (id: string, nuevoEstado: string, nombre: string) => {
    const acciones: Record<string, string> = {
      aprobado: 'aprobar',
      pagado:   'marcar como pagada',
      anulado:  'anular',
    }
    const result = await Swal.fire({
      icon: 'question',
      title: `¿${acciones[nuevoEstado]?.charAt(0).toUpperCase() + acciones[nuevoEstado]?.slice(1)} esta nómina?`,
      text: `"${nombre}"`,
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado === 'anulado' ? '#dc2626' : '#0B1F22',
      cancelButtonColor: '#6b7280',
    })
    if (!result.isConfirmed) return
    try {
      const r = await apiFetch<any>(`/api/nomina/${id}`, {
        method: 'PATCH', body: JSON.stringify({ estado: nuevoEstado }),
      }, token!)
      Swal.fire({ icon: 'success', title: 'Actualizado', text: r.message, timer: 1800, showConfirmButton: false })
      cargarPeriodos()
      if (periodoActivo?.id === id) abrirDetalle(id)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const editarPago = async (pago: Pago, periodoId: string) => {
    const { value: formValues } = await Swal.fire({
      title: `Editar pago — ${pago.empleados?.nombre_completo}`,
      html: `
        <div style="text-align:left">
          <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px">Salario base (C$)</label>
          <input id="sal" type="number" value="${pago.salario_base}" min="0" step="0.01"
            style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:14px">
          <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px">Bonificaciones (C$)</label>
          <input id="bon" type="number" value="${pago.bonificaciones}" min="0" step="0.01"
            style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:14px">
          <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px">Deducciones (C$)</label>
          <input id="ded" type="number" value="${pago.deducciones}" min="0" step="0.01"
            style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:14px">
          <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px">Método de pago</label>
          <select id="met" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:14px">
            <option value="efectivo" ${pago.metodo_pago === 'efectivo' ? 'selected' : ''}>Efectivo</option>
            <option value="transferencia" ${pago.metodo_pago === 'transferencia' ? 'selected' : ''}>Transferencia</option>
            <option value="cheque" ${pago.metodo_pago === 'cheque' ? 'selected' : ''}>Cheque</option>
          </select>
          <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px">Notas</label>
          <textarea id="not" rows="2" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;resize:none">${pago.notas ?? ''}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0B1F22',
      preConfirm: () => ({
        salario_base:   parseFloat((document.getElementById('sal') as HTMLInputElement).value) || 0,
        bonificaciones: parseFloat((document.getElementById('bon') as HTMLInputElement).value) || 0,
        deducciones:    parseFloat((document.getElementById('ded') as HTMLInputElement).value) || 0,
        metodo_pago:    (document.getElementById('met') as HTMLSelectElement).value,
        notas:          (document.getElementById('not') as HTMLTextAreaElement).value,
      }),
    })
    if (!formValues) return
    try {
      await apiFetch(`/api/nomina/${periodoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ pago_id: pago.id, ...formValues }),
      }, token!)
      Swal.fire({ icon: 'success', title: 'Pago actualizado', timer: 1500, showConfirmButton: false })
      abrirDetalle(periodoId)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  const marcarPagado = async (pago: Pago, periodoId: string) => {
    if (pago.estado === 'pagado') return
    const result = await Swal.fire({
      icon: 'question',
      title: '¿Marcar como pagado?',
      text: `${pago.empleados?.nombre_completo} — ${formatMonto(pago.total_neto)}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, pagado',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
    })
    if (!result.isConfirmed) return
    try {
      await apiFetch(`/api/nomina/${periodoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ pago_id: pago.id, estado: 'pagado' }),
      }, token!)
      abrirDetalle(periodoId)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#0B1F22' })
    }
  }

  // Calcular resumen del período activo
  const resumen = periodoActivo ? {
    total:     periodoActivo.pagos?.reduce((s, p) => s + p.total_neto, 0) ?? 0,
    pagados:   periodoActivo.pagos?.filter(p => p.estado === 'pagado').length ?? 0,
    pendientes:periodoActivo.pagos?.filter(p => p.estado === 'pendiente').length ?? 0,
    empleados: periodoActivo.pagos?.length ?? 0,
  } : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nómina</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de períodos de pago y liquidaciones</p>
        </div>
        <button onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 bg-thimpson-teal text-thimpson-yellow font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
          <span className="text-lg leading-none">＋</span>
          Nuevo período
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lista de períodos */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-thimpson-teal/5 border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-gray-700 text-sm">Períodos de nómina</h2>
          </div>
          {loading ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400 text-sm">
              <div className="w-7 h-7 border-2 border-thimpson-teal/30 border-t-thimpson-teal rounded-full animate-spin" />
              Cargando...
            </div>
          ) : periodos.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">📋</div>
              No hay períodos creados
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {periodos.map(p => {
                const e = ESTADO_PERIODO[p.estado] ?? ESTADO_PERIODO.borrador
                const isActive = periodoActivo?.id === p.id
                return (
                  <button key={p.id} onClick={() => abrirDetalle(p.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-thimpson-teal/5 border-l-2 border-thimpson-teal' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm leading-snug">{p.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatFecha(p.fecha_inicio)} — {formatFecha(p.fecha_fin)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          {formatMonto(p.total_pagado)} · {p.empleados_count} empleados
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${e.bg} ${e.text}`}>
                        {e.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Detalle del período */}
        <div className="lg:col-span-2">
          {!periodoActivo ? (
            <div className="h-full min-h-[300px] bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-2">👈</span>
              <p className="text-sm">Selecciona un período para ver el detalle</p>
            </div>
          ) : loadingDetalle ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-2 text-gray-400 text-sm">
              <div className="w-8 h-8 border-2 border-thimpson-teal/30 border-t-thimpson-teal rounded-full animate-spin" />
              Cargando detalle...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info del período */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{periodoActivo.nombre}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatFecha(periodoActivo.fecha_inicio)} — {formatFecha(periodoActivo.fecha_fin)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {periodoActivo.estado === 'borrador' && (
                      <button onClick={() => cambiarEstadoPeriodo(periodoActivo.id, 'aprobado', periodoActivo.nombre)}
                        className="text-xs bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg hover:opacity-90">
                        Aprobar
                      </button>
                    )}
                    {periodoActivo.estado === 'aprobado' && (
                      <button onClick={() => cambiarEstadoPeriodo(periodoActivo.id, 'pagado', periodoActivo.nombre)}
                        className="text-xs bg-green-600 text-white font-medium px-3 py-1.5 rounded-lg hover:opacity-90">
                        Marcar pagada
                      </button>
                    )}
                    {periodoActivo.estado !== 'pagado' && periodoActivo.estado !== 'anulado' && (
                      <button onClick={() => cambiarEstadoPeriodo(periodoActivo.id, 'anulado', periodoActivo.nombre)}
                        className="text-xs bg-red-500 text-white font-medium px-3 py-1.5 rounded-lg hover:opacity-90">
                        Anular
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats del período */}
                {resumen && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Total nómina', value: formatMonto(resumen.total), color: 'text-thimpson-teal' },
                      { label: 'Empleados',    value: resumen.empleados, color: 'text-gray-700' },
                      { label: 'Pagados',      value: resumen.pagados,   color: 'text-green-600' },
                      { label: 'Pendientes',   value: resumen.pendientes,color: 'text-yellow-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className={`font-bold text-lg ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabla de pagos */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-thimpson-teal/5 border-b border-gray-100 px-4 py-3">
                  <h3 className="font-semibold text-gray-700 text-sm">Detalle de pagos por empleado</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-thimpson-teal text-thimpson-yellow">
                        {['Empleado', 'Cargo', 'Salario base', 'Bonif.', 'Deducc.', 'Total neto', 'Método', 'Estado', ''].map(h => (
                          <th key={h} className="text-xs font-semibold uppercase tracking-wide px-4 py-3 text-left whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(periodoActivo.pagos ?? []).length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">No hay líneas de pago</td></tr>
                      ) : (periodoActivo.pagos ?? []).map(pago => (
                        <tr key={pago.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{pago.empleados?.nombre_completo ?? '—'}</div>
                            <div className="text-xs text-gray-400">{pago.empleados?.cedula ?? ''}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{pago.empleados?.cargo ?? '—'}</td>
                          <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{formatMonto(pago.salario_base)}</td>
                          <td className="px-4 py-3 text-green-600 whitespace-nowrap">+{formatMonto(pago.bonificaciones)}</td>
                          <td className="px-4 py-3 text-red-500 whitespace-nowrap">-{formatMonto(pago.deducciones)}</td>
                          <td className="px-4 py-3 font-bold text-thimpson-teal whitespace-nowrap">{formatMonto(pago.total_neto)}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs capitalize">{pago.metodo_pago}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${ESTADO_PAGO[pago.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                              {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {periodoActivo.estado !== 'anulado' && periodoActivo.estado !== 'pagado' && (
                                <>
                                  <button onClick={() => editarPago(pago, periodoActivo.id)}
                                    className="p-1.5 text-gray-400 hover:text-thimpson-teal transition-colors" title="Editar">
                                    ✏️
                                  </button>
                                  {pago.estado !== 'pagado' && (
                                    <button onClick={() => marcarPagado(pago, periodoActivo.id)}
                                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors" title="Marcar pagado">
                                      ✅
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear período */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalCrear(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-thimpson-teal px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-thimpson-yellow font-bold text-lg">Nuevo período de nómina</h2>
                <p className="text-white/60 text-sm mt-0.5">Se generarán las líneas de pago automáticamente</p>
              </div>
              <button onClick={() => setModalCrear(false)} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={crearPeriodo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre del período *</label>
                <input type="text" required value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Nómina Junio 2026 — Mensual"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha inicio *</label>
                  <input type="date" required value={form.fecha_inicio}
                    onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha fin *</label>
                  <input type="date" required value={form.fecha_fin}
                    onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-thimpson-teal/50"
                  />
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                <strong>Nota:</strong> Al crear el período se generarán automáticamente las líneas de pago para todos los empleados activos con su salario base.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-thimpson-teal text-thimpson-yellow font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 text-sm">
                  {guardando ? 'Creando...' : 'Crear período'}
                </button>
                <button type="button" onClick={() => setModalCrear(false)}
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
