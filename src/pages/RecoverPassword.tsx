import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Lock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import Logo from '@/components/Logo'
import { FullCenterLoader } from './Login'

export default function RecoverPassword() {
  const { user, loading } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [recoveryReady, setRecoveryReady] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) return <FullCenterLoader />
  if (!user && !recoveryReady) return <Navigate to="/login" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.show('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }
    if (password !== confirm) {
      toast.show('Las contraseñas no coinciden', 'error')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) toast.show(error.message, 'error')
    else {
      toast.show('Contraseña actualizada', 'success')
      nav('/', { replace: true })
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 relative z-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className="text-2xl font-semibold mt-6">Nueva contraseña</h1>
          <p className="text-muted mt-2 text-sm">Elige una contraseña nueva para tu cuenta.</p>
        </div>

        <form onSubmit={submit} className="neta-card flex flex-col gap-4">
          <div>
            <label className="neta-label">Contraseña nueva</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="neta-input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="neta-label">Confirmar</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                className="neta-input pl-10"
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="neta-btn-primary mt-2 flex items-center justify-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />}
            Guardar contraseña
          </button>
        </form>
      </div>
    </div>
  )
}
