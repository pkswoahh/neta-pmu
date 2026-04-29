import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'

export default function SuscripcionVencida() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 relative z-10">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" />
        <div className="neta-card mt-8 space-y-5">
          <div className="text-5xl">⏳</div>
          <h1 className="text-2xl font-semibold">Tu acceso terminó</h1>
          <p className="text-muted text-sm leading-relaxed">
            Tu trial finalizó o tu suscripción venció. Reactiva tu cuenta para seguir gestionando tu negocio sin perder tus datos.
          </p>
          <div className="space-y-2">
            <Link
              to="/suscribirse"
              className="neta-btn-primary w-full flex items-center justify-center"
            >
              Reactivar mi cuenta — $15/mes
            </Link>
            <button
              onClick={signOut}
              className="neta-btn-ghost w-full flex items-center justify-center gap-2 text-sm"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
          <p className="text-xs text-muted">
            Tus datos siguen guardados. Solo necesitas reactivar para volver a verlos.
          </p>
        </div>
      </div>
    </div>
  )
}
