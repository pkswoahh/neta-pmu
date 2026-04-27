import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'
import Modal from '@/components/Modal'
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
  const [showReset, setShowReset] = useState(false)

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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted">Contraseña</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs text-accent hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
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

      {showReset && <ResetPasswordModal initialEmail={email} onClose={() => setShowReset(false)} />}
    </div>
  )
}

function ResetPasswordModal({ initialEmail, onClose }: { initialEmail: string; onClose: () => void }) {
  const toast = useToast()
  const [email, setEmail] = useState(initialEmail)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cambiar-password`,
    })
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else {
      setSent(true)
      toast.show('Te enviamos un correo', 'success')
    }
  }

  return (
    <Modal
      open
      title="Recuperar contraseña"
      onClose={onClose}
      footer={
        sent ? (
          <button type="button" onClick={onClose} className="neta-btn-primary">Listo</button>
        ) : (
          <>
            <button type="button" onClick={onClose} className="neta-btn-ghost">Cancelar</button>
            <button type="submit" form="reset-form" disabled={busy} className="neta-btn-primary flex items-center gap-2">
              {busy && <Loader2 size={16} className="animate-spin" />}
              Enviar enlace
            </button>
          </>
        )
      }
    >
      {sent ? (
        <div className="text-sm leading-relaxed space-y-3">
          <p>Te enviamos un correo a <span className="text-primary font-medium">{email}</span> con un enlace para crear una contraseña nueva.</p>
          <p className="text-muted">Si no lo ves en unos minutos, revisa la carpeta de spam.</p>
        </div>
      ) : (
        <form id="reset-form" onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">Te enviaremos un enlace al correo registrado para que puedas crear una contraseña nueva.</p>
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
                autoFocus
              />
            </div>
          </div>
        </form>
      )}
    </Modal>
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
