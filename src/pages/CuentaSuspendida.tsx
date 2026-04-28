import { Mail, LogOut } from 'lucide-react'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { SUPPORT_EMAIL } from '@/lib/constants'

export default function CuentaSuspendida() {
  const { signOut } = useAuth()
  const { profile } = useProfile()
  const reason = profile?.suspended_reason

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 relative z-10">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" />
        <div className="neta-card mt-8 space-y-5 border-negative/30">
          <div className="text-5xl">🚫</div>
          <h1 className="text-2xl font-semibold">Cuenta suspendida</h1>
          <p className="text-muted text-sm leading-relaxed">
            Tu cuenta está temporalmente suspendida. Si crees que es un error, contáctanos.
          </p>
          {reason && (
            <div className="bg-bg border border-border rounded-xl px-4 py-3 text-left">
              <div className="text-xs text-muted mb-1">Razón</div>
              <div className="text-sm">{reason}</div>
            </div>
          )}
          <div className="space-y-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Cuenta%20suspendida`}
              className="neta-btn-primary w-full flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Contactar a soporte
            </a>
            <button
              onClick={signOut}
              className="neta-btn-ghost w-full flex items-center justify-center gap-2 text-sm"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
