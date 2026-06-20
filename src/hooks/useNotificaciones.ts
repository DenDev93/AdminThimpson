import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useNotificaciones() {
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      try {
        const { count } = await supabase
          .from('notificaciones')
          .select('*', { count: 'exact', head: true })
          .eq('leida', false)
        setNoLeidas(count ?? 0)
      } catch { setNoLeidas(0) }
    }
    cargar()

    const sub = supabase
      .channel('notificaciones-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones' }, cargar)
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [])

  return { noLeidas }
}
