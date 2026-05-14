import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Clock,
  XCircle,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { useToast } from '@/components/Toast'
import { translateError } from '@/lib/errors'
import { SUPPORT_WHATSAPP } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { stateLabel, stateBadgeClasses } from '@/lib/access'

function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function MiSuscripcion() {
  const { profile, access, refresh } = useProfile()
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [openingPortal, setOpeningPortal] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activationTimedOut, setActivationTimedOut] = useState(false)

  const justSubscribed = params.get('subscription') === 'success'

  // Si llegó del checkout, hacemos polling al perfil hasta que el webhook lo active.
  useEffect(() => {
    if (!justSubscribed) return
    if (profile?.subscription_status === 'active') {
      setActivating(false)
      return
    }
    setActivating(true)
    setActivationTimedOut(false)

    let cancelled = false
    let attempts = 0
    const maxAttempts = 10 // ~10s con intervalo de 1s

    const tick = async () => {
      if (cancelled) return
      attempts++
      await refresh()
      if (cancelled) return
      if (attempts >= maxAttempts) {
        setActivating(false)
        setActivationTimedOut(true)
        return
      }
      setTimeout(tick, 1000)
    }
    setTimeout(tick, 1000)

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justSubscribed])

  // Cuando se confirma activación, mostramos toast y limpiamos el query param.
  useEffect(() => {
    if (justSubscribed && profile?.subscription_status === 'active') {
      toast.show('¡Suscripción activa!', 'success')
      const next = new URLSearchParams(params)
      next.delete('subscription')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justSubscribed, profile?.subscription_status])

  async function openPortal() {
    setOpeningPortal(true)
    const { data, error } = await supabase.functions.invoke<{ url: string }>('lemon-portal')
    setOpeningPortal(false)
    if (error || !data?.url) {
      toast.show(translateError(error, 'No pudimos abrir el portal. Intenta de nuevo.'), 'error')
      return
    }
    window.open(data.url, '_blank', 'noopener,noreferrer')
  }

  const status = profile?.subscription_status ?? 'expired'
  const plan = profile?.billing_plan
  const hasLemonCustomer = !!profile?.lemon_customer_id

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <button
          onClick={() => navigate('/configuracion')}
          className="text-muted hover:text-primary text-sm flex items-center gap-1.5 mb-3 transition-colors"
        >
          <ArrowLeft size={15} /> Volver a configuración
        </button>
        <h1 className="text-3xl font-semibold tracking-tight">Mi suscripción</h1>
        <p className="text-muted mt-2">Información de tu plan y cobros.</p>
      </div>

      {/* Estado de activación post-pago */}
      {activating && (
        <div className="neta-card bg-accent/5 border-accent/30 flex items-start gap-3">
          <Loader2 size={20} className="animate-spin text-accent shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Activando tu suscripción…</div>
            <p className="text-sm text-muted mt-1">
              Estamos confirmando tu pago con Lemon Squeezy. Esto suele tomar unos segundos.
            </p>
          </div>
        </div>
      )}

      {activationTimedOut && (
        <div className="neta-card bg-amber-400/5 border-amber-400/30 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">Tu pago se está procesando</div>
            <p className="text-sm text-muted mt-1">
              El pago se realizó pero está tardando en activarse en nuestra base. Refresca en unos segundos.
            </p>
            <button
              onClick={() => { setActivationTimedOut(false); void refresh() }}
              className="neta-btn-ghost mt-3 text-sm flex items-center gap-2"
            >
              <RefreshCw size={14} /> Refrescar ahora
            </button>
          </div>
        </div>
      )}

      {/* Card principal con info del plan */}
      <div className="neta-card space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-muted uppercase tracking-wider">Plan actual</div>
            <div className="text-2xl font-semibold mt-1 flex items-center gap-2">
              {plan === 'annual' ? (
                <>Neta Solo · Anual</>
              ) : plan === 'monthly' ? (
                <>Neta Solo · Mensual</>
              ) : access.state === 'trial' ? (
                <>Período de prueba</>
              ) : (
                <>Sin plan activo</>
              )}
            </div>
            {plan === 'annual' && <div className="text-muted text-sm mt-1">$108 USD al año</div>}
            {plan === 'monthly' && <div className="text-muted text-sm mt-1">$12 USD al mes</div>}
          </div>
          <span
            className={cn(
              'text-xs uppercase tracking-wider px-2 py-1 rounded border',
              stateBadgeClasses(access.state),
            )}
          >
            {stateLabel(access.state)}
          </span>
        </div>

        {/* Detalles según el estado */}
        <div className="border-t border-border pt-5 space-y-3 text-sm">
          {status === 'trial' && profile?.trial_ends_at && (
            <Row icon={<Clock size={16} />} label="Tu prueba gratuita termina">
              {formatLongDate(profile.trial_ends_at)}
              {access.daysLeft !== undefined && (
                <span className="text-muted ml-2">
                  ({access.daysLeft} {access.daysLeft === 1 ? 'día restante' : 'días restantes'})
                </span>
              )}
            </Row>
          )}

          {status === 'active' && profile?.current_period_end && (
            <Row icon={<RefreshCw size={16} />} label="Próximo cobro">
              {formatLongDate(profile.current_period_end)}
            </Row>
          )}

          {status === 'canceled' && profile?.current_period_end && (
            <Row icon={<XCircle size={16} />} label="Acceso hasta">
              {formatLongDate(profile.current_period_end)}
              <div className="text-muted text-xs mt-1">
                Cancelaste tu suscripción. Mantienes acceso hasta esta fecha.
              </div>
            </Row>
          )}

          {status === 'past_due' && (
            <Row icon={<AlertTriangle size={16} className="text-amber-300" />} label="Pago vencido">
              Hay un problema con tu último cobro. Actualiza tu método de pago para evitar perder acceso.
            </Row>
          )}

          {status === 'comped' && profile?.comped_until && (
            <Row icon={<Sparkles size={16} className="text-gold" />} label="Cortesía hasta">
              {formatLongDate(profile.comped_until)}
            </Row>
          )}

          {profile?.invitation_code_used && (
            <Row icon={<ShieldCheck size={16} />} label="Código de invitación usado">
              <code className="font-mono">{profile.invitation_code_used}</code>
            </Row>
          )}
        </div>

        {/* Acciones */}
        <div className="border-t border-border pt-5 space-y-3">
          {hasLemonCustomer ? (
            <button
              onClick={openPortal}
              disabled={openingPortal}
              className="neta-btn-primary w-full flex items-center justify-center gap-2"
            >
              {openingPortal ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Abriendo portal…
                </>
              ) : (
                <>
                  <CreditCard size={16} /> Gestionar suscripción
                  <ExternalLink size={13} className="opacity-60" />
                </>
              )}
            </button>
          ) : (
            <Link
              to="/suscribirse"
              className="neta-btn-primary w-full flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Suscribirme ahora
            </Link>
          )}

          {hasLemonCustomer && (
            <p className="text-xs text-muted text-center leading-relaxed">
              En el portal puedes cambiar tu tarjeta, descargar facturas o cancelar la suscripción.
            </p>
          )}
        </div>
      </div>

      {/* Soporte */}
      <div className="neta-card !p-4 flex items-start gap-3 text-sm">
        <div className="text-muted leading-relaxed">
          ¿Algún problema con tu suscripción?{' '}
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Hola, tengo una duda sobre mi suscripción de Neta.')}`}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Escríbenos por WhatsApp
          </a>
          .
        </div>
      </div>
    </div>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  )
}
