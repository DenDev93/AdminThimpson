import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import supabase from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

const SONIDOS: Record<string, string> = {
  nueva_solicitud: '/sounds/alerta-nueva.mp3',
  motorizado_asignado: '/sounds/asignado.mp3',
  en_camino: '/sounds/en-camino.mp3',
  entregado: '/sounds/completado.mp3',
  cancelado: '/sounds/cancelado.mp3',
  general: '/sounds/alerta-nueva.mp3',
}

interface NotifCtx {
  notificaciones: any[]
  noLeidas: number
  marcarLeida: (id: string) => Promise<void>
  marcarTodas: () => Promise<void>
  recargar: () => Promise<void>
}

const Ctx = createContext<NotifCtx>({
  notificaciones: [],
  noLeidas: 0,
  marcarLeida: async () => {},
  marcarTodas: async () => {},
  recargar: async () => {},
})

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { token, perfil } = useAuth()
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const canalRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const cargar = useCallback(async () => {
    if (!token) return
    try {
      const r = await apiFetch<any>('/api/notificaciones?por_pagina=20', {}, token)
      setNotificaciones(r.data ?? [])
      setNoLeidas(r.no_leidas ?? 0)
    } catch {}
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!supabase || !perfil?.id) return

    // Limpiar canal anterior si existe
    if (canalRef.current) {
      supabase.removeChannel(canalRef.current)
      canalRef.current = null
    }

    const canal = supabase
      .channel(`notif_admin_${perfil.id}_${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notificaciones',
        filter: `usuario_id=eq.${perfil.id}`,
      }, (payload) => {
        const nueva = payload.new as any
        setNotificaciones(prev => [nueva, ...prev])
        setNoLeidas(prev => prev + 1)
        const src = SONIDOS[nueva.tipo] ?? SONIDOS.general
        try { new Audio(src).play() } catch {}
      })
      .subscribe()

    canalRef.current = canal
    return () => {
      if (canalRef.current) {
        supabase.removeChannel(canalRef.current)
        canalRef.current = null
      }
    }
  }, [perfil?.id])

  const marcarLeida = async (id: string) => {
    if (!token) return
    await apiFetch(`/api/notificaciones/${id}`, { method: 'PATCH' }, token)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    setNoLeidas(prev => Math.max(0, prev - 1))
  }

  const marcarTodas = async () => {
    if (!token) return
    await apiFetch('/api/notificaciones/marcar-todas', { method: 'POST' }, token)
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
  }

  return (
    <Ctx.Provider value={{ notificaciones, noLeidas, marcarLeida, marcarTodas, recargar: cargar }}>
      {children}
    </Ctx.Provider>
  )
}

export function useNotificaciones() {
  return useContext(Ctx)
}
