import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, pass)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-thimpson-teal flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-thimpson-yellow text-3xl font-bold tracking-tight">Thimpson</h1>
          <p className="text-white/50 text-sm mt-1">Servicio Express · Ocotal, Nicaragua</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-thimpson-teal-2 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <label className="text-white/60 text-xs font-medium block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-thimpson-yellow/50 transition-colors placeholder:text-white/20"
              placeholder="admin@thimpson.com.ni" />
          </div>
          <div>
            <label className="text-white/60 text-xs font-medium block mb-1.5">Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-thimpson-yellow/50 transition-colors"
              placeholder="••••••••" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-thimpson-yellow text-thimpson-black font-bold py-3 rounded-xl text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {loading ? 'Ingresando...' : 'Ingresar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
