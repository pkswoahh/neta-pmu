import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Mail, Lock, Loader2, KeyRound } from 'lucide-react'

type Mode = 'signin' | 'signup'

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'Email not confirmed': 'Debes confirmar tu correo antes de entrar. Revisa tu bandeja de entrada.',
  'User already registered': 'Ya existe una cuenta con ese email. Intenta entrar.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'Signup requires a valid password': 'Ingresa una contraseña válida.',
  'rate limit': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
}

const CODE_REASON_MAP: Record<string, string> = {
  empty: 'Ingresa tu código de acceso.',
  not_found: 'Ese código no existe. Revísalo bien.',
  inactive: 'Ese código ya no está activo.',
  expired: 'Ese código venció.',
  exhausted: 'Ese código ya fue usado el número máximo de veces.',
}

function translateError(msg: string): string {
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return val
  }
  return msg
}

export default function Login() {
  const { user, loading } = useAuth()
  const toast = useToast()
  const [params] = useSearchParams()
  const initialMode: Mode = params.get('signup') === '1' ? 'signup' : 'signin'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState(params.get('code') ?? '')
  const [busy, setBusy] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState(false)

  // Si llega con ?signup=1 desde la landing, abrimos signup directo
  useEffect(() => {
    const wantsSignup = params.get('signup') === '1'
    if (wantsSignup && mode !== 'signup') setMode('signup')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Si la usuaria volvió tras confirmar email, redimimos el código pendiente
  useEffect(() => {
    if (!user) return
    let pending: string | null = null
    try { pending = sessionStorage.getItem('neta_pending_code') } catch {}
    if (!pending) return
    try { sessionStorage.removeItem('neta_pending_code') } catch {}
    void supabase.rpc('redeem_invitation_code', { p_code: pending })
  }, [user])

  if (loading) return <FullCenterLoader />
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.show('¡Hola de nuevo!', 'success')
      } else {
        // Validar código de invitación antes de crear cuenta
        const { data: validation, error: vErr } = await supabase.rpc('validate_invitation_code', {
          p_code: code,
        })
        if (vErr) throw vErr
        const v = validation as { valid: boolean; reason?: string }
        if (!v.valid) {
          toast.show(CODE_REASON_MAP[v.reason ?? 'empty'] ?? 'Código no válido', 'error')
          setBusy(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error

        // Redimir el código (consume un cupo)
        if (data.session) {
          await supabase.rpc('redeem_invitation_code', { p_code: code })
        }

        if (!data.session) {
          // Necesita confirmación de email — guardamos el código para redimirlo al primer login
          try { sessionStorage.setItem('neta_pending_code', code.trim()) } catch {}
          setPendingConfirm(true)
        } else {
          toast.show('¡Cuenta creada!', 'success')
        }
      }
    } catch (err: any) {
      toast.show(translateError(err.message || 'Algo falló, intenta de nuevo'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    if (mode === 'signup') {
      if (!code.trim()) {
        toast.show('Ingresa tu código de acceso primero.', 'error')
        return
      }
      setBusy(true)
      try {
        const { data: validation, error: vErr } = await supabase.rpc('validate_invitation_code', {
          p_code: code,
        })
        if (vErr) throw vErr
        const v = validation as { valid: boolean; reason?: string }
        if (!v.valid) {
          toast.show(CODE_REASON_MAP[v.reason ?? 'empty'] ?? 'Código no válido', 'error')
          setBusy(false)
          return
        }
        try { sessionStorage.setItem('neta_pending_code', code.trim().toUpperCase()) } catch {}
      } catch (err: any) {
        toast.show(translateError(err.message || 'Error validando el código'), 'error')
        setBusy(false)
        return
      }
    } else {
      setBusy(true)
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      toast.show(error.message, 'error')
      setBusy(false)
    }
  }

  if (pendingConfirm) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-5 py-10 relative z-10">
        <div className="w-full max-w-sm text-center">
          <Logo size="xl" />
          <div className="neta-card mt-10 space-y-4">
            <div className="text-4xl">📬</div>
            <h2 className="text-xl font-semibold">Revisa tu correo</h2>
            <p className="text-muted text-sm leading-relaxed">
              Te enviamos un enlace de confirmación a <span className="text-primary font-medium">{email}</span>.
              Ábrelo para activar tu cuenta y luego vuelve aquí a entrar.
            </p>
            <p className="text-xs text-muted">¿No lo ves? Revisa la carpeta de spam.</p>
            <button
              onClick={() => { setPendingConfirm(false); setMode('signin') }}
              className="neta-btn-primary w-full"
            >
              Ya confirmé, quiero entrar
            </button>
          </div>
        </div>
      </div>
    )
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

          {mode === 'signup' && (
            <div>
              <label className="neta-label">Código de acceso</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej. NETABETA"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="neta-input pl-10 tracking-wider uppercase"
                />
              </div>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Neta está en beta cerrada. ¿Aún no tienes código?{' '}
                <a
                  href="https://wa.me/?text=Hola%20Roberto%2C%20quiero%20probar%20Neta"
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solicítalo aquí
                </a>
              </p>
            </div>
          )}

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

        {mode === 'signup' && (
          <p className="text-center text-xs text-muted mt-4 leading-relaxed">
            Al crear tu cuenta aceptas nuestros{' '}
            <Link to="/terminos" className="text-accent hover:underline">Términos de Servicio</Link>
            {' '}y la{' '}
            <Link to="/privacidad" className="text-accent hover:underline">Política de Privacidad</Link>.
          </p>
        )}
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
