import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORES_PIE = ['#FBB03B', '#0B1F22', '#BC8A5F', '#1a3f44', '#6b7280']

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="stat-card">
    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
)

export default function Ganancias() {
  const { token } = useAuth()
  const [datos, setDatos] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const cargar = useCallback(async () => {
    if (!token) return
    try {
      const r = await apiFetch<any>('/api/ganancias/resumen', {}, token)
      setDatos(r.data ?? r)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Cargando ganancias...</div>
    </div>
  )

  if (error || !datos) return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Ganancias</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
        <div className="text-3xl mb-3">💰</div>
        <p className="text-gray-500 text-sm font-medium">El endpoint de ganancias aún no está disponible</p>
        <p className="text-gray-400 text-xs mt-1">Se activará cuando la API esté en producción</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Ganancias</h1>
        <p className="text-gray-500 text-sm mt-0.5">Resumen financiero de la sucursal</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Ingresos hoy"     value={`C$${datos.hoy ?? 0}`}     sub={`${datos.entregas_hoy ?? 0} entregas`} />
        <StatCard label="Esta semana"      value={`C$${datos.semana ?? 0}`}   sub={`${datos.entregas_semana ?? 0} entregas`} />
        <StatCard label="Este mes"         value={`C$${datos.mes ?? 0}`}      sub={`${datos.entregas_mes ?? 0} entregas`} />
        <StatCard label="Ticket promedio"  value={`C$${datos.promedio ?? 0}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por día */}
        {datos.por_dia && datos.por_dia.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Ingresos últimos 7 días</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datos.por_dia} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  formatter={(v: any) => [`C$${v}`, 'Ingresos']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #f3f4f6', fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#FBB03B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Por tipo de servicio */}
        {datos.por_tipo && datos.por_tipo.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Ingresos por tipo de servicio</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={datos.por_tipo} dataKey="total" nameKey="tipo"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {datos.por_tipo.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v: string) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>}
                />
                <Tooltip
                  formatter={(v: any) => [`C$${v}`, '']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #f3f4f6', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
