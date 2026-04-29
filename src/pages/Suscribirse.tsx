import { CheckCircle2, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { SUPPORT_EMAIL } from '@/lib/constants'

const FEATURES = [
  'Procedimientos ilimitados',
  'Control de gastos y categorías',
  'Historial completo de clientes',
  'Dashboard con meta mensual',
  'Exportar datos a CSV',
  'Funciona como app instalable (PWA)',
  'Tus datos siempre seguros',
]

export default function Suscribirse() {
  const { signOut } = useAuth()

  // TODO: reemplazar href con URL de checkout de Lemon Squeezy cuando esté listo
  const checkoutHref = `mailto:${SUPPORT_EMAIL}?subject=Quiero%20suscribirme%20a%20Neta`

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 relative z-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="xl" />
          <p className="text-muted mt-3 text-sm">Tu negocio, claro como el agua.</p>
        </div>

        <div className="neta-card space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <span className="inline-block bg-accent/10 text-accent text-xs font-medium px-3 py-1 rounded-full">
              Neta Pro
            </span>
            <div className="pt-1">
              <span className="text-5xl font-bold tracking-tight">$15</span>
              <span className="text-muted text-sm"> USD / mes</span>
            </div>
            <p className="text-xs text-muted">Sin permanencia · Cancela cuando quieras</p>
          </div>

          <hr className="border-border" />

          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={15} className="text-accent shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3 pt-1">
            <a
              href={checkoutHref}
              className="neta-btn-primary w-full flex items-center justify-center"
            >
              Suscribirme — $15/mes
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Pregunta%20sobre%20Neta`}
              className="block text-center text-xs text-muted hover:text-primary transition-colors"
            >
              ¿Tienes preguntas? Escríbenos
            </a>
            <p className="text-center text-xs text-muted leading-relaxed">
              Al suscribirte aceptas nuestros{' '}
              <Link to="/terminos" className="text-accent hover:underline">Términos de Servicio</Link>
              {' '}y la{' '}
              <Link to="/privacidad" className="text-accent hover:underline">Política de Privacidad</Link>.
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center justify-center gap-2 text-xs text-muted hover:text-primary transition-colors mx-auto mt-6"
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
