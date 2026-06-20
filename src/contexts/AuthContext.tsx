import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import supabase from '@/lib/supabase'

export type Rol = 'super_admin' | 'admin'
const ROLES_PERMITIDOS: Rol[] = ['super_admin', 'admin']

export interface Perfil {
  id: string
  rol: Rol
  nombre_completo: string | null
  sucursal_id: string | null   // null → super_admin global
  sucursales?: any
}

interface AuthCtx {
  token: string | null
  perfil: Perfil | null
  loading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]   = useState<string | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  const cargarPerfil = useCallback(async (userId: string): Promise<Perfil | null> => {
    const { data } = await supabase!
      .from('perfiles')
      .select('*, sucursales(*)')
      .eq('id', userId)
      .single()
    return data as Perfil | null
  }, [])

  // Restaurar sesión al cargar la app
  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      setToken(session.access_token)
      const p = await cargarPerfil(session.user.id)
      setPerfil(p)
      setLoading(false)
    })

    // Escuchar cambios de sesión (refresh de token, logout desde otra pestaña, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setToken(session.access_token)
        const p = await cargarPerfil(session.user.id)
        setPerfil(p)
      } else {
        setToken(null)
        setPerfil(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [cargarPerfil])

  const login = async (email: string, pass: string) => {
    if (!supabase) throw new Error('Supabase no está configurado')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) throw new Error(error.message)

    const p = await cargarPerfil(data.user.id)
    if (!p || !ROLES_PERMITIDOS.includes(p.rol)) {
      await supabase.auth.signOut()
      throw new Error('Solo administradores pueden acceder al panel')
    }

    setToken(data.session.access_token)
    setPerfil(p)
  }

  const logout = () => {
    supabase?.auth.signOut()
    setToken(null)
    setPerfil(null)
  }

  return <Ctx.Provider value={{ token, perfil, loading, login, logout }}>{children}</Ctx.Provider>
}
