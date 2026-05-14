import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const STORAGE_KEY = 'neta_pending_code'
const MAX_ATTEMPTS = 6
const RETRY_DELAY_MS = 1000

/**
 * Redime el código de invitación pendiente apenas hay sesión, en cualquier
 * ruta donde la usuaria aterrice (Landing, Onboarding, Dashboard, etc.).
 *
 * Se monta una sola vez a nivel de App. Cuando detecta un user nuevo:
 *   1. Lee sessionStorage.neta_pending_code
 *   2. Llama redeem_invitation_code (RPC idempotente)
 *   3. Si retorna `unauthenticated` (race con la sesión recién creada),
 *      reintenta hasta 6 veces con espera de 1s
 *   4. Solo limpia el sessionStorage cuando hay outcome final (ok o motivo
 *      irrecuperable como not_found, inactive, expired, exhausted)
 *
 * Resuelve el bug donde Google OAuth redirige a `/` (Landing) y el useEffect
 * de Onboarding nunca se montaba si la usuaria iba directo a Dashboard.
 */
export default function InvitationCodeRedeemer() {
  const { user, loading } = useAuth()
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      inFlightRef.current = false
      return
    }
    if (inFlightRef.current) return

    let pending: string | null = null
    try { pending = sessionStorage.getItem(STORAGE_KEY) } catch {}
    if (!pending) return

    inFlightRef.current = true

    let cancelled = false

    const attempt = async (n = 1) => {
      if (cancelled) return
      const { data, error } = await supabase.rpc('redeem_invitation_code', { p_code: pending })

      if (cancelled) return

      if (error) {
        // Error de red. Reintentar si quedan intentos.
        if (n < MAX_ATTEMPTS) {
          setTimeout(() => attempt(n + 1), RETRY_DELAY_MS)
          return
        }
        // Sin más intentos. Dejamos sessionStorage para que el próximo login lo retome.
        inFlightRef.current = false
        return
      }

      const result = (data ?? {}) as { ok?: boolean; reason?: string; already?: boolean }

      // Outcome final: éxito o fracaso irrecuperable. Limpiamos sessionStorage.
      const finalReasons = new Set(['not_found', 'inactive', 'expired', 'exhausted', 'empty'])
      if (result.ok || (result.reason && finalReasons.has(result.reason))) {
        try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
        return
      }

      // Sesión todavía no propagada al cliente Supabase: reintentar.
      if (result.reason === 'unauthenticated' && n < MAX_ATTEMPTS) {
        setTimeout(() => attempt(n + 1), RETRY_DELAY_MS)
        return
      }

      // Cualquier otro caso: dejar para próximo login.
      inFlightRef.current = false
    }

    void attempt()

    return () => { cancelled = true }
  }, [user, loading])

  return null
}
