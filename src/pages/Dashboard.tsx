import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import supabase from '@/lib/supabase'

const BADGE_ESTADO: Record<string, string> = {
  pendiente:  'badge badge-warning',
  confirmada: 'badge badge-blue',
  asignada:   'badge badge-primary',
  en_camino:  'badge badge-orange',
  entregada:  'badge badge-success',
  cancelada:  'badge badge-danger',
}

interface Stats {
  total: number
  pendientes: number
  entregadas: number
  motorizados: number
  empleados: number
  ingresos: number
}

export default function Dashboard() {
  const { token, perfil } = useAuth()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pendientes: 0, entregadas: 0, motorizados: 0, empleados: 0, ingresos: 0 })
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    if (!token) return
    try {
      const [solRes, motRes, empRes] = await Promise.all([
        apiFetch<any>('/api/solicitudes?por_pagina=15', {}, token),
        apiFetch<any>('/api/motorizados?disponible=true', {}, token),
        apiFetch<any>('/api/empleados?estado=activo', {}, token),
      ])
      const sols = solRes.data ?? []
      const ingresos = sols
        .filter((s: any) => s.estado === 'entregada' && s.precio_final)
        .reduce((acc: number, s: any) => acc + parseFloat(s.precio_final ?? '0'), 0)

      setSolicitudes(sols)
      setStats({
        total:       solRes.total ?? 0,
        pendientes:  sols.filter((s: any) => s.estado === 'pendiente').length,
        entregadas:  sols.filter((s: any) => s.estado === 'entregada').length,
        motorizados: motRes.total ?? 0,
        empleados:   empRes.total ?? 0,
        ingresos,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [token])

  useEffect(() => {
    if (!supabase) return
    const esSuperAdmin = perfil?.rol === 'super_admin'
    const channelOpts = esSuperAdmin
      ? { event: '*' as const, schema: 'public', table: 'solicitudes_servicio' }
      : { event: '*' as const, schema: 'public', table: 'solicitudes_servicio', filter: `sucursal_id=eq.${perfil?.sucursal_id}` }
    if (!esSuperAdmin && !perfil?.sucursal_id) return
    const canal = supabase
      .channel('dashboard_solicitudes')
      .on('postgres_changes', channelOpts, () => cargarDatos())
      .subscribe()
    return () => { supabase?.removeChannel(canal) }
  }, [perfil?.sucursal_id, perfil?.rol])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ color: '#999', fontSize: 13 }}>Cargando...</div>
    </div>
  )

  const infoBoxes = [
    { label: 'Solicitudes Hoy', value: stats.total,      icon: '📦', bg: 'bg-yellow',  progress: 65 },
    { label: 'Pendientes',      value: stats.pendientes, icon: '⏳', bg: 'bg-orange',  progress: Math.round((stats.pendientes/Math.max(stats.total,1))*100) },
    { label: 'Entregadas',      value: stats.entregadas, icon: '✅', bg: 'bg-green',   progress: Math.round((stats.entregadas/Math.max(stats.total,1))*100) },
    { label: 'Motorizados',     value: stats.motorizados,icon: '🏍️', bg: 'bg-teal',   progress: 80 },
    { label: 'Empleados',       value: stats.empleados,  icon: '👷', bg: 'bg-blue',    progress: 55 },
    { label: 'Ingresos (C$)',   value: `C$${stats.ingresos.toFixed(0)}`, icon: '💵', bg: 'bg-red', progress: 40 },
  ]

  return (
    <>
      {/* Content header */}
      <div className="content-header animate-fade-in">
        <div>
          <h1>Dashboard</h1>
          <ul className="breadcrumb">
            <li className="breadcrumb-item"><a href="/dashboard">Inicio</a></li>
            <li className="breadcrumb-item active">Dashboard</li>
          </ul>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: '#28a745', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: '#28a745', fontWeight: 600 }}>EN TIEMPO REAL</span>
        </div>
      </div>

      <div className="content">
        {/* Info Boxes */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          {infoBoxes.map(box => (
            <div key={box.label} className="info-box animate-slide-up">
              <div className={`info-box-icon ${box.bg}`}>
                <span>{box.icon}</span>
              </div>
              <div className="info-box-content">
                <span className="info-box-text">{box.label}</span>
                <span className="info-box-number">{box.value}</span>
                <div className="info-box-progress">
                  <div className="info-box-progress-bar" style={{ width: `${box.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de solicitudes recientes */}
        <div className="card card-primary animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="card-header">
            <h3 className="card-title">
              <span>📋</span> Solicitudes recientes
            </h3>
            <div className="card-tools">
              <button className="btn btn-flat btn-sm" onClick={cargarDatos} title="Actualizar">↺ Actualizar</button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Origen</th>
                    <th>Estado</th>
                    <th>Precio</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#999' }}>
                      No hay solicitudes
                    </td></tr>
                  )}
                  {solicitudes.map((s: any) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{s.tipo_servicio}</td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' }}>
                        {s.origen_direccion}
                      </td>
                      <td>
                        <span className={BADGE_ESTADO[s.estado] ?? 'badge badge-gray'}>
                          {s.estado}
                        </span>
                      </td>
                      <td style={{ color: '#333' }}>
                        {s.precio_final ? `C$${s.precio_final}` : s.precio_estimado ? `~C$${s.precio_estimado}` : '—'}
                      </td>
                      <td style={{ color: '#999', fontSize: 12 }}>
                        {new Date(s.created_at).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer">
            Mostrando {solicitudes.length} de {stats.total} solicitudes · Sucursal: {perfil?.rol === 'super_admin' ? 'Global' : (perfil as any)?.sucursales?.nombre ?? '—'}
          </div>
        </div>

        {/* Quick stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card card-yellow animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="card-header">
              <h3 className="card-title">💡 Accesos rápidos</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Nueva solicitud', href: '/solicitudes', icon: '📦' },
                  { label: 'Registrar empleado', href: '/empleados', icon: '👷' },
                  { label: 'Gestión de usuarios', href: '/usuarios', icon: '👤' },
                  { label: 'Ver nómina', href: '/nomina', icon: '💵' },
                ].map(link => (
                  <a key={link.href} href={link.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: '#f4f6f9',
                    color: '#0B1F22',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'background 150ms',
                    borderLeft: '3px solid #FBB03B',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e8ecf0')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f4f6f9')}>
                    <span>{link.icon}</span> {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="card card-primary animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="card-header">
              <h3 className="card-title">📊 Resumen del día</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Tasa de entrega', value: stats.total > 0 ? `${Math.round((stats.entregadas/stats.total)*100)}%` : '—', color: '#28a745' },
                  { label: 'Pendientes activos', value: stats.pendientes, color: '#fd7e14' },
                  { label: 'Motorizados en línea', value: stats.motorizados, color: '#007bff' },
                  { label: 'Ingresos generados', value: `C$${stats.ingresos.toFixed(2)}`, color: '#FBB03B' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>{item.label}</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
