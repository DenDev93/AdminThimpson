const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers, ...options.headers } })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Error de la API')
  return json
}
