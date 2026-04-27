import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'
import { useToast } from '@/components/Toast'
import { Mail, Lock, Loader2 } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function Login() {
  const { user, loading } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <FullCenterLoader />
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.show('¡Hola de nuevo!', 'success')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        toast.show('Cuenta creada — revisa tu correo si pide confirmación', 'success')
      }
    } catch (err: any) {
      toast.show(err.message || 'Algo falló, intenta de nuevo', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      toast.show(error.message, 'error')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 relative z-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Logo size="xl" />
          <p className="text-muted mt-3 text-sm">Tu negocio, claro como el agua.</p>
        </div>

        <form onSubmit={handleSubmit} className="neta-card flex flex-col gap-4">
          <div>
            <label className="neta-label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="neta-input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="neta-label">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="neta-input pl-10"
              />
            </div>
          </div>

          <button type="submit" disabled={busy} className="neta-btn-primary mt-2 flex items-center justify-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />}
            {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="neta-btn-ghost flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            Continuar con Google
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-muted">
          {mode === 'signin' ? (
            <>¿Aún no tienes cuenta? <button onClick={() => setMode('signup')} className="text-accent hover:underline">Crear una</button></>
          ) : (
            <>¿Ya tienes cuenta? <button onClick={() => setMode('signin')} className="text-accent hover:underline">Entrar</button></>
          )}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44c11 0 20-8 20-20 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.6 5A20 20 0 0 0 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  )
}

export function FullCenterLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center text-muted">
      <Loader2 className="animate-spin" />
    </div>
  )
}
