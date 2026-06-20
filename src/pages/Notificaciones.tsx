import { useNotificaciones } from '@/hooks/useNotificaciones'

const ICONOS: Record<string, string> = {
  nueva_solicitud:     '📦',
  motorizado_asignado: '🏍️',
  en_camino:           '🚀',
  entregado:           '✅',
  cancelado:           '❌',
  general:             '🔔',
}

export default function Notificaciones() {
  const { notificaciones, noLeidas, marcarLeida, marcarTodas } = useNotificaciones()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notificaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo leído'}
          </p>
        </div>
        {noLeidas > 0 && (
          <button onClick={marcarTodas}
            className="text-sm text-thimpson-teal font-medium hover:underline">
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {notificaciones.length === 0 && (
          <div className="text-center py-14 text-gray-400 text-sm">
            <div className="text-3xl mb-2">🔔</div>
            No hay notificaciones
          </div>
        )}
        <div className="divide-y divide-gray-50">
          {notificaciones.map(n => (
            <div
              key={n.id}
              onClick={() => !n.leida && marcarLeida(n.id)}
              className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                !n.leida ? 'bg-thimpson-yellow/5 cursor-pointer hover:bg-thimpson-yellow/10' : ''
              }`}>
              <span className="text-xl mt-0.5 flex-shrink-0">
                {ICONOS[n.tipo] ?? ICONOS.general}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {n.titulo}
                </p>
                {n.mensaje && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  {new Date(n.created_at).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              {!n.leida && (
                <div className="w-2 h-2 bg-thimpson-yellow rounded-full mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
