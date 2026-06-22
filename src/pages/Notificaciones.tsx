import { useNotificaciones } from '@/contexts/NotificacionesContext'
import DataTable from 'react-data-table-component'
import Swal from 'sweetalert2'

const ICONOS: Record<string, string> = {
  nueva_solicitud:     '📦',
  motorizado_asignado: '🏍️',
  en_camino:           '🚀',
  entregado:           '✅',
  cancelado:           '❌',
  general:             '🔔',
}

const TITULOS_LEGIBLES: Record<string, string> = {
  suscripcion: 'Nuevo suscriptor',
  nuevo_negocio: 'Nuevo negocio registrado',
}

function tituloLegible(titulo: string): string {
  return TITULOS_LEGIBLES[titulo] ?? titulo.charAt(0).toUpperCase() + titulo.slice(1).replace(/_/g, ' ')
}

function mensajeLegible(mensaje: string, data: any): string {
  if (data?.nombre) return data.nombre
  if (!mensaje) return '—'
  try {
    const parsed = JSON.parse(mensaje)
    return parsed.nombre ?? parsed.email ?? parsed.titulo ?? mensaje
  } catch {
    return mensaje
  }
}

const estiloTabla = {
  headCells: {
    style: { backgroundColor: '#000', color: '#FBB03B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '14px 16px' },
  },
  rows: { style: { fontSize: '13px' } },
  cells: { style: { padding: '12px 16px' } },
}

export default function Notificaciones() {
  const { notificaciones, noLeidas, marcarLeida, marcarNoLeida, marcarTodas, eliminar } = useNotificaciones()

  const confirmarEliminar = (id: string) => {
    Swal.fire({
      title: 'Eliminar notificación',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(r => { if (r.isConfirmed) eliminar(id) })
  }

  const columnas = [
    {
      name: 'Estado',
      width: '70px',
      cell: (row: any) => (
        <span className="text-lg">{ICONOS[row.tipo] ?? ICONOS.general}</span>
      ),
    },
    {
      name: 'Título',
      minWidth: '160px',
      cell: (row: any) => (
        <span className={row.leida ? 'text-gray-700' : 'font-semibold text-gray-900'}>{tituloLegible(row.titulo)}</span>
      ),
    },
    {
      name: 'Mensaje',
      minWidth: '200px',
      cell: (row: any) => (
        <span className="text-xs text-gray-500 line-clamp-2">{mensajeLegible(row.mensaje, row.data)}</span>
      ),
    },
    {
      name: 'Fecha',
      width: '150px',
      cell: (row: any) => (
        <span className="text-xs text-gray-400">{new Date(row.created_at).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      ),
    },
    {
      name: 'Leída',
      width: '80px',
      center: true as const,
      cell: (row: any) => row.leida ? (
        <span className="text-green-600 text-sm font-medium">Sí</span>
      ) : (
        <span className="text-thimpson-yellow text-sm font-medium">No</span>
      ),
    },
    {
      name: 'Acciones',
      width: '150px',
      center: true as const,
      cell: (row: any) => (
        <div className="flex gap-1">
          {row.leida ? (
            <button onClick={() => marcarNoLeida(row.id)} title="Marcar como no leída"
              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors text-lg">
              📕
            </button>
          ) : (
            <button onClick={() => marcarLeida(row.id)} title="Marcar como leída"
              className="w-8 h-8 flex items-center justify-center bg-thimpson-yellow/15 text-thimpson-yellow-dark rounded-lg hover:bg-thimpson-yellow/25 transition-colors text-lg">
              📖
            </button>
          )}
          <button onClick={() => confirmarEliminar(row.id)} title="Eliminar"
            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors text-lg">
            🗑️
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notificaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {noLeidas > 0 ? `${noLeidas} sin leer de ${notificaciones.length}` : 'Todo leído'}
          </p>
        </div>
        {noLeidas > 0 && (
          <button onClick={marcarTodas}
            className="px-4 py-2 text-sm bg-thimpson-yellow text-black font-medium rounded hover:bg-thimpson-yellow/90 transition-colors">
            Marcar todas leídas
          </button>
        )}
      </div>

      <DataTable
        columns={columnas}
        data={notificaciones}
        customStyles={estiloTabla}
        pagination
        paginationPerPage={20}
        paginationRowsPerPageOptions={[10, 20, 50, 100]}
        noDataComponent={
          <div className="text-center py-14 text-gray-400 text-sm">
            <div className="text-3xl mb-2">🔔</div>
            No hay notificaciones
          </div>
        }
      />
    </div>
  )
}
