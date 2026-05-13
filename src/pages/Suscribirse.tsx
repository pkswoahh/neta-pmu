import { useState } from 'react'
import { CheckCircle2, Loader2, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { SUPPORT_EMAIL } from '@/lib/constants'
import { translateError } from '@/lib/errors'
import { cn } from '@/lib/utils'

type Plan = 'monthly' | 'annual'

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
  const toast = useToast()
  const [plan, setPlan] = useState<Plan>('annual')
  const [busy, setBusy] = useState(false)

  async function startCheckout() {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke<{ url: string }>('lemon-checkout', {
      body: { plan },
    })
    setBusy(false)
    if (error || !data?.url) {
      toast.show(translateError(error, 'No pudimos abrir el checkout. Intenta de nuevo.'), 'error')
      return
    }
    window.location.href = data.url
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 relative z-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="xl" />
          <p className="text-muted mt-3 text-sm">Tu negocio, claro como el agua.</p>
        </div>

        <div className="neta-card space-y-6 animate-fade-in">
          <div className="text-center space-y-3">
            <span className="inline-block bg-accent/10 text-accent text-xs font-medium px-3 py-1 rounded-full">
              Neta Solo
            </span>

            <div className="flex items-center justify-center pt-1">
              <div className="inline-flex bg-bg border border-border rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setPlan('monthly')}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-medium rounded-full transition-all',
                    plan === 'monthly' ? 'bg-accent text-bg' : 'text-muted hover:text-primary',
                  )}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setPlan('annual')}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5',
                    plan === 'annual' ? 'bg-accent text-bg' : 'text-muted hover:text-primary',
                  )}
                >
                  Anual
                  <span
                    className={cn(
                      'text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded',
                      plan === 'annual' ? 'bg-bg/20' : 'bg-accent/20 text-accent',
                    )}
                  >
                    -25%
                  </span>
                </button>
              </div>
            </div>

            <div className="min-h-[80px] flex flex-col items-center justify-center">
              {plan === 'annual' ? (
                <>
                  <div>
                    <span className="text-5xl font-bold tracking-tight">$9</span>
                    <span className="text-muted text-sm"> USD / mes</span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Facturado anual a <span className="text-primary font-medium">$108 USD</span> · Ahorras $36
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-5xl font-bold tracking-tight">$12</span>
                    <span className="text-muted text-sm"> USD / mes</span>
                  </div>
                  <p className="text-xs text-muted mt-2">Sin permanencia · Cancela cuando quieras</p>
                </>
              )}
            </div>
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
            <button
              type="button"
              onClick={startCheckout}
              disabled={busy}
              className="neta-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Abriendo checkout…
                </>
              ) : plan === 'annual' ? (
                'Suscribirme — $108/año'
              ) : (
                'Suscribirme — $12/mes'
              )}
            </button>
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
