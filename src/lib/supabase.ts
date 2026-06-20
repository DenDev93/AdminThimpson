import { createClient } from '@supabase/supabase-js'

const url: string = import.meta.env.VITE_SUPABASE_URL ?? ''
const key: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

const isValidUrl = (s: string) => { try { new URL(s); return true } catch { return false } }

export const supabase = isValidUrl(url)
  ? createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } })
  : (null as ReturnType<typeof createClient>)

export default supabase
