// Edge Function: lemon-webhook
// Recibe eventos de Lemon Squeezy y aplica cambios en profiles.
// Valida firma HMAC con LEMON_SQUEEZY_WEBHOOK_SECRET.
//
// Eventos manejados:
//  - subscription_created · subscription_resumed
//  - subscription_payment_success
//  - subscription_payment_failed
//  - subscription_cancelled
//  - subscription_updated
//  - subscription_expired

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { createHmac } from 'node:crypto'

const KNOWN_EVENTS = new Set([
  'subscription_created',
  'subscription_resumed',
  'subscription_payment_success',
  'subscription_payment_failed',
  'subscription_cancelled',
  'subscription_updated',
  'subscription_expired',
])

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method_not_allowed', { status: 405 })
  }

  const secret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!secret || !supabaseUrl || !serviceKey) {
    console.error('lemon-webhook misconfigured')
    return new Response('misconfigured', { status: 500 })
  }

  const signature = req.headers.get('X-Signature')
  if (!signature) {
    return new Response('missing_signature', { status: 401 })
  }

  const rawBody = await req.text()

  const digest = createHmac('sha256', secret).update(rawBody).digest('hex')
  if (!timingSafeEqualHex(digest, signature)) {
    console.error('lemon-webhook bad signature')
    return new Response('bad_signature', { status: 401 })
  }

  let payload: LemonPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('invalid_json', { status: 400 })
  }

  const eventName = payload?.meta?.event_name
  if (!eventName || !KNOWN_EVENTS.has(eventName)) {
    // Aceptamos pero ignoramos eventos que no nos interesan
    return new Response('ok', { status: 200 })
  }

  const attrs = payload?.data?.attributes ?? {}
  const customData = payload?.meta?.custom_data ?? {}

  const userId = typeof customData.user_id === 'string' ? customData.user_id : null
  const customerEmail = attrs.user_email ?? null
  const customerId = payload?.data?.attributes?.customer_id != null
    ? String(payload.data.attributes.customer_id)
    : null
  const subscriptionId = payload?.data?.id ?? null
  const renewsAt = attrs.renews_at ?? attrs.ends_at ?? null

  // Plan viene en custom_data al crear el checkout. Lemon lo preserva en
  // todos los eventos relacionados con esa suscripción.
  const planRaw = typeof customData.plan === 'string' ? customData.plan : null
  const plan: 'monthly' | 'annual' | null =
    planRaw === 'monthly' || planRaw === 'annual' ? planRaw : null

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Resolver target user: confiamos en custom_data.user_id que pasamos al
  // crear el checkout. Si falta, fallback por email vía auth admin API.
  let targetUserId: string | null = userId
  if (!targetUserId && customerEmail) {
    const { data: list } = await supabase.auth.admin.listUsers()
    const match = list?.users?.find((u) => u.email === customerEmail)
    targetUserId = match?.id ?? null
  }

  if (!targetUserId) {
    console.warn('lemon-webhook: no user matched', { eventName, customerEmail })
    return new Response('ok', { status: 200 })
  }

  const { error } = await supabase.rpc('apply_lemon_event', {
    target_user_id: targetUserId,
    event_name: eventName,
    customer_id: customerId,
    subscription_id: subscriptionId,
    plan,
    period_end: renewsAt,
  })

  if (error) {
    console.error('apply_lemon_event error', error)
    return new Response('db_error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

interface LemonPayload {
  meta?: {
    event_name?: string
    custom_data?: Record<string, unknown>
  }
  data?: {
    id?: string
    attributes?: {
      customer_id?: number | string
      user_email?: string
      renews_at?: string
      ends_at?: string
    }
  }
}
