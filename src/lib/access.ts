import type { Profile } from '@/types/database'

export type AccessState =
  | 'admin'
  | 'trial'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'comped'
  | 'expired'
  | 'suspended'

export type AccessWarning = 'trial_ending' | 'past_due' | 'canceled' | null

export interface Access {
  allowed: boolean
  state: AccessState
  warning: AccessWarning
  daysLeft?: number
  suspendedReason?: string | null
  endsAt?: string | null
}

/**
 * Calcula el acceso efectivo de una usuaria a partir de su perfil.
 * - Admins/support siempre permitidos (bypass).
 * - Para el resto: deriva del subscription_status + fechas.
 *
 * Si el status es 'trial' pero ya pasó trial_ends_at → 'expired'.
 * Si está 'comped' con comped_until vencido → 'expired'.
 * Si está 'canceled' pero current_period_end aún en el futuro → permitido con warning.
 */
export function computeAccess(profile: Profile | null): Access {
  if (!profile) {
    return { allowed: false, state: 'expired', warning: null }
  }

  // Bypass para staff
  if (profile.role === 'admin' || profile.role === 'support') {
    return { allowed: true, state: 'admin', warning: null }
  }

  const now = Date.now()
  const status = profile.subscription_status

  if (status === 'suspended') {
    return {
      allowed: false,
      state: 'suspended',
      warning: null,
      suspendedReason: profile.suspended_reason,
    }
  }

  if (status === 'comped') {
    if (!profile.comped_until || +new Date(profile.comped_until) > now) {
      return { allowed: true, state: 'comped', warning: null, endsAt: profile.comped_until }
    }
    return { allowed: false, state: 'expired', warning: null }
  }

  if (status === 'trial') {
    const ends = profile.trial_ends_at ? +new Date(profile.trial_ends_at) : 0
    if (!ends || ends < now) {
      return { allowed: false, state: 'expired', warning: null }
    }
    const daysLeft = Math.ceil((ends - now) / 86400000)
    return {
      allowed: true,
      state: 'trial',
      warning: daysLeft <= 3 ? 'trial_ending' : null,
      daysLeft,
      endsAt: profile.trial_ends_at,
    }
  }

  if (status === 'active') {
    return { allowed: true, state: 'active', warning: null, endsAt: profile.current_period_end }
  }

  if (status === 'past_due') {
    return { allowed: true, state: 'past_due', warning: 'past_due', endsAt: profile.current_period_end }
  }

  if (status === 'canceled') {
    if (profile.current_period_end && +new Date(profile.current_period_end) > now) {
      return { allowed: true, state: 'canceled', warning: 'canceled', endsAt: profile.current_period_end }
    }
    return { allowed: false, state: 'expired', warning: null }
  }

  return { allowed: false, state: 'expired', warning: null }
}

export function stateLabel(state: AccessState): string {
  const labels: Record<AccessState, string> = {
    admin: 'Admin',
    trial: 'Trial',
    active: 'Activa',
    past_due: 'Pago vencido',
    canceled: 'Cancelada',
    comped: 'Cortesía',
    expired: 'Vencida',
    suspended: 'Suspendida',
  }
  return labels[state]
}

export function stateBadgeClasses(state: AccessState): string {
  const map: Record<AccessState, string> = {
    admin: 'bg-gold/15 text-gold border-gold/30',
    trial: 'bg-accent/15 text-accent border-accent/30',
    active: 'bg-positive/15 text-positive border-positive/30',
    past_due: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    canceled: 'bg-muted/15 text-muted border-muted/30',
    comped: 'bg-gold/15 text-gold border-gold/30',
    expired: 'bg-negative/15 text-negative border-negative/30',
    suspended: 'bg-negative/25 text-negative border-negative/40',
  }
  return map[state]
}
