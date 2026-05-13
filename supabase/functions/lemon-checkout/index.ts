// Edge Function: lemon-checkout
// POST con { plan: 'monthly' | 'annual' }
// Requiere usuario autenticado.
// Devuelve { url } de Lemon Squeezy para redirigir.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const LEMON_API = 'https://api.lemonsqueezy.com/v1/checkouts'

interface CheckoutBody {
  plan: 'monthly' | 'annual'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const apiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY')
  const storeId = Deno.env.get('LEMON_SQUEEZY_STORE_ID')
  const variantMonthly = Deno.env.get('LEMON_SQUEEZY_VARIANT_MONTHLY')
  const variantAnnual = Deno.env.get('LEMON_SQUEEZY_VARIANT_ANNUAL')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!apiKey || !storeId || !variantMonthly || !variantAnnual || !supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'server_misconfigured' }, 500)
  }

  // Validar usuario autenticado
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'unauthorized' }, 401)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || !user.email) {
    return json({ error: 'unauthorized' }, 401)
  }

  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  if (body.plan !== 'monthly' && body.plan !== 'annual') {
    return json({ error: 'invalid_plan' }, 400)
  }

  const variantId = body.plan === 'monthly' ? variantMonthly : variantAnnual
  const origin = req.headers.get('Origin') ?? 'https://netapmu.com'
  const successUrl = `${origin}/dashboard?subscription=success`

  // Obtener business_name para pre-llenar
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name')
    .eq('id', user.id)
    .single()

  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: user.email,
          name: profile?.business_name ?? undefined,
          custom: {
            user_id: user.id,
            plan: body.plan,
          },
        },
        product_options: {
          redirect_url: successUrl,
          receipt_link_url: successUrl,
        },
        checkout_options: {
          embed: false,
          dark: true,
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: storeId } },
        variant: { data: { type: 'variants', id: variantId } },
      },
    },
  }

  const res = await fetch(LEMON_API, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('lemon-checkout error', res.status, errText)
    return json({ error: 'lemon_api_error', details: errText }, 502)
  }

  const data = await res.json()
  const url = data?.data?.attributes?.url
  if (!url) {
    return json({ error: 'no_checkout_url' }, 502)
  }

  return json({ url }, 200)
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
