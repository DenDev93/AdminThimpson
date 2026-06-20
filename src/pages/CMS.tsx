import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Swal from 'sweetalert2'

type Tab = 'hero' | 'negocio' | 'precios' | 'testimonios'

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'hero',        icon: '🦸', label: 'Hero / Portada'    },
  { key: 'negocio',     icon: '🏢', label: 'Info del negocio'  },
  { key: 'precios',     icon: '💲', label: 'Precios servicios' },
  { key: 'testimonios', icon: '💬', label: 'Testimonios'       },
]

interface CmsData {
  hero_titulo?: string
  hero_subtitulo?: string
  hero_badge?: string
  whatsapp_numero?: string
  stats_entregas?: string
  stats_tiempo?: string
  stats_calificacion?: string
  cta_texto?: string
  testimonio_1_nombre?: string
  testimonio_1_texto?: string
  testimonio_2_nombre?: string
  testimonio_2_texto?: string
  testimonio_3_nombre?: string
  testimonio_3_texto?: string
  [key: string]: string | undefined
}

export default function CMS() {
  const { token, perfil } = useAuth()
  const [tab, setTab] = useState<Tab>('hero')
  const [sucursales, setSucursales] = useState<any[]>([])
  const [sucursalSel, setSucursalSel] = useState<any>(null)
  const [servicios, setServicios] = useState<any[]>([])
  const [cms, setCms] = useState<CmsData>({})
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [svcRes, sucRes] = await Promise.all([
        apiFetch<any>('/api/catalogo-servicios', {}, token),
        perfil?.rol === 'super_admin'
          ? apiFetch<any>('/api/sucursales?todas=true', {}, token)
          : apiFetch<any>(`/api/sucursales/${perfil?.sucursal_id}`, {}, token),
      ])
      const svcs = svcRes.data ?? svcRes ?? []
      setServicios(Array.isArray(svcs) ? svcs : [])

      if (perfil?.rol === 'super_admin') {
        const lista = sucRes.data ?? []
        setSucursales(lista)
        if (lista.length > 0) setSucursalSel(lista[0])
      } else {
        const s = sucRes.data ?? sucRes ?? null
        if (s) { setSucursales([s]); setSucursalSel(s) }
      }

      // Cargar CMS config
      const cmsRes = await apiFetch<any>('/api/cms', {}, token)
      const rows: any[] = cmsRes.data ?? []
      const obj: CmsData = {}
      rows.forEach((r: any) => { if (r.clave && r.valor !== undefined) obj[r.clave] = r.valor })
      setCms(obj)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, perfil?.rol, perfil?.sucursal_id])

  useEffect(() => { cargar() }, [cargar])

  const guardarCms = async (cambios: Partial<CmsData>) => {
    if (!token) return
    setGuardando(true)
    try {
      await apiFetch('/api/cms/config', {
        method: 'PUT',
        body: JSON.stringify({ contenido: { ...cms, ...cambios } }),
      }, token)
      setCms(prev => ({ ...prev, ...cambios }))
      await Swal.fire({ icon: 'success', title: 'Guardado', text: 'El contenido se actualizó correctamente.', timer: 2000, showConfirmButton: false })
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el contenido.' })
    } finally {
      setGuardando(false)
    }
  }

  const guardarSucursal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token || !sucursalSel) return
    setGuardando(true)
    try {
      const form = new FormData(e.currentTarget)
      const body = Object.fromEntries(form.entries())
      await apiFetch(`/api/sucursales/${sucursalSel.id}`, { method: 'PATCH', body: JSON.stringify(body) }, token)
      Swal.fire({ icon: 'success', title: '¡Guardado!', timer: 1800, showConfirmButton: false })
    } finally {
      setGuardando(false)
    }
  }

  const toggleServicio = async (id: string, activo: boolean) => {
    if (!token) return
    const conf = await Swal.fire({
      icon: 'question',
      title: activo ? 'Desactivar servicio' : 'Activar servicio',
      text: activo ? 'Se ocultará de la web pública.' : 'Aparecerá en la web pública.',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
    })
    if (!conf.isConfirmed) return
    await apiFetch(`/api/catalogo-servicios/${id}`, { method: 'PATCH', body: JSON.stringify({ activo: !activo }) }, token)
    cargar()
  }

  const field = (key: keyof CmsData, label: string, multiline = false, placeholder = '') => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}</label>
      {multiline ? (
        <textarea className="form-control" rows={3} defaultValue={cms[key] ?? ''} name={key} placeholder={placeholder}
          style={{ resize: 'vertical', borderBottom: '2px solid #ddd', padding: '9px 12px', outline: 'none', fontSize: 13 }}
          onFocus={e => { e.currentTarget.style.borderBottomColor = '#FBB03B' }}
          onBlur={e => { e.currentTarget.style.borderBottomColor = '#ddd' }}
        />
      ) : (
        <input className="form-control" type="text" defaultValue={cms[key] ?? ''} name={key} placeholder={placeholder} />
      )}
    </div>
  )

  const handleHeroSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const obj: Partial<CmsData> = {}
    data.forEach((v, k) => { obj[k] = v.toString() })
    guardarCms(obj)
  }

  return (
    <>
      <div className="content-header animate-fade-in">
        <div>
          <h1>CMS / Contenido web</h1>
          <ul className="breadcrumb">
            <li className="breadcrumb-item"><a href="/dashboard">Inicio</a></li>
            <li className="breadcrumb-item active">CMS</li>
          </ul>
        </div>
      </div>

      <div className="content">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Sidebar tabs */}
          <div className="card elevation-1" style={{ width: 220, flexShrink: 0 }}>
            <div className="card-header">
              <span className="card-title" style={{ fontSize: 12 }}>SECCIONES</span>
            </div>
            <div className="card-body" style={{ padding: 8 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 12px',
                    background: tab === t.key ? '#0B1F22' : 'transparent',
                    color: tab === t.key ? '#FBB03B' : '#555',
                    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    textAlign: 'left',
                    borderLeft: tab === t.key ? '3px solid #FBB03B' : '3px solid transparent',
                    transition: 'all 150ms',
                  }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel content */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <div className="card elevation-1"><div className="card-body" style={{ color: '#999', fontSize: 13 }}>Cargando contenido...</div></div>
            ) : (
              <>
                {/* ── HERO ── */}
                {tab === 'hero' && (
                  <div className="card card-yellow animate-fade-in">
                    <div className="card-header">
                      <h3 className="card-title">🦸 Hero / Portada de la web</h3>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleHeroSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                          {field('hero_titulo', 'Título principal', false, 'Tu delivery de confianza en Ocotal')}
                          {field('hero_badge', 'Badge (etiqueta pequeña)', false, '📍 Ocotal, Nicaragua')}
                          {field('hero_subtitulo', 'Subtítulo / descripción', true, 'Motorizados verificados...')}
                          {field('whatsapp_numero', 'Número de WhatsApp (con código país)', false, '50587654321')}
                          {field('cta_texto', 'Texto CTA WhatsApp', false, '¿Prefieres pedir por WhatsApp?')}
                        </div>
                        <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 16 }}>
                          <p className="card-title" style={{ marginBottom: 12, fontSize: 12 }}>ESTADÍSTICAS DEL HERO</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 24px' }}>
                            {field('stats_entregas', 'Entregas completadas', false, '500+')}
                            {field('stats_tiempo', 'Tiempo promedio', false, '< 60min')}
                            {field('stats_calificacion', 'Calificación', false, '4.9 ⭐')}
                          </div>
                        </div>
                        <button type="submit" disabled={guardando} className="btn btn-primary btn-raised" style={{ marginTop: 16 }}>
                          {guardando ? 'Guardando...' : '💾 Guardar cambios del hero'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* ── NEGOCIO ── */}
                {tab === 'negocio' && (
                  <div className="card card-primary animate-fade-in">
                    <div className="card-header">
                      <h3 className="card-title">🏢 Información del negocio</h3>
                      {perfil?.rol === 'super_admin' && sucursales.length > 1 && (
                        <select className="form-control form-select" value={sucursalSel?.id ?? ''}
                          onChange={e => setSucursalSel(sucursales.find(s => s.id === e.target.value))}
                          style={{ width: 'auto', display: 'inline-block', fontSize: 12, padding: '4px 28px 4px 8px' }}>
                          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="card-body">
                      {sucursalSel ? (
                        <form onSubmit={guardarSucursal}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                            {[
                              { name: 'nombre',         label: 'Nombre del negocio',  val: sucursalSel.nombre },
                              { name: 'ciudad',         label: 'Ciudad',               val: sucursalSel.ciudad },
                              { name: 'direccion',      label: 'Dirección',            val: sucursalSel.direccion },
                              { name: 'telefono_claro', label: 'Teléfono Claro',       val: sucursalSel.telefono_claro },
                              { name: 'telefono_tigo',  label: 'Teléfono Tigo',        val: sucursalSel.telefono_tigo },
                              { name: 'whatsapp',       label: 'WhatsApp',             val: sucursalSel.whatsapp },
                              { name: 'email',          label: 'Email de contacto',    val: sucursalSel.email },
                            ].map(f => (
                              <div className="form-group" key={f.name}>
                                <label className="form-label">{f.label}</label>
                                <input className="form-control" name={f.name} defaultValue={f.val ?? ''} />
                              </div>
                            ))}
                          </div>
                          <button type="submit" disabled={guardando} className="btn btn-primary btn-raised" style={{ marginTop: 8 }}>
                            {guardando ? 'Guardando...' : '💾 Guardar información'}
                          </button>
                        </form>
                      ) : (
                        <p style={{ color: '#999', fontSize: 13 }}>No hay sucursal disponible.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── PRECIOS ── */}
                {tab === 'precios' && (
                  <div className="card card-primary animate-fade-in">
                    <div className="card-header">
                      <h3 className="card-title">💲 Catálogo de servicios</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Icono</th>
                            <th>Servicio</th>
                            <th>Precio base</th>
                            <th>Precio por km</th>
                            <th>Tipo precio</th>
                            <th>Visible en web</th>
                          </tr>
                        </thead>
                        <tbody>
                          {servicios.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: '#999' }}>No hay servicios</td></tr>
                          )}
                          {servicios.map((s: any) => (
                            <tr key={s.id}>
                              <td style={{ fontSize: 22 }}>{s.icono}</td>
                              <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                              <td>C${s.precio_base ?? 0}</td>
                              <td>{s.precio_por_km ? `C$${s.precio_por_km}` : '—'}</td>
                              <td><span className={`badge ${s.tipo_precio === 'fijo' ? 'badge-info' : 'badge-warning'}`}>{s.tipo_precio}</span></td>
                              <td>
                                <button
                                  onClick={() => toggleServicio(s.id, s.activo)}
                                  className={`badge ${s.activo ? 'badge-success' : 'badge-danger'}`}
                                  style={{ cursor: 'pointer', border: 'none' }}>
                                  {s.activo ? '✓ Visible' : '✕ Oculto'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="card-footer">
                      Haz click en "Visible/Oculto" para controlar qué servicios aparecen en la web pública.
                    </div>
                  </div>
                )}

                {/* ── TESTIMONIOS ── */}
                {tab === 'testimonios' && (
                  <div className="card card-yellow animate-fade-in">
                    <div className="card-header">
                      <h3 className="card-title">💬 Testimonios de clientes</h3>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleHeroSubmit}>
                        {[1, 2, 3].map(n => (
                          <div key={n} style={{ border: '1px solid #f0f0f0', padding: 16, marginBottom: 16 }}>
                            <p style={{ fontWeight: 700, fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                              Testimonio #{n}
                            </p>
                            {field(`testimonio_${n}_nombre` as keyof CmsData, 'Nombre del cliente', false, 'María G.')}
                            {field(`testimonio_${n}_texto` as keyof CmsData, 'Testimonio', true, 'Excelente servicio...')}
                          </div>
                        ))}
                        <button type="submit" disabled={guardando} className="btn btn-primary btn-raised">
                          {guardando ? 'Guardando...' : '💾 Guardar testimonios'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
