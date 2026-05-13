// Edge Function: lemon-portal
// GET autenticado. Devuelve { url } al portal de cliente de Lemon Squeezy.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const apiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!apiKey || !supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'server_misconfigured' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'unauthorized' }, 401)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return json({ error: 'unauthorized' }, 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('lemon_customer_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.lemon_customer_id) {
    return json({ error: 'no_customer' }, 404)
  }

  const res = await fetch(
    `https://api.lemonsqueezy.com/v1/customers/${profile.lemon_customer_id}`,
    {
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
  )

  if (!res.ok) {
    const errText = await res.text()
    console.error('lemon-portal error', res.status, errText)
    return json({ error: 'lemon_api_error' }, 502)
  }

  const data = await res.json()
  const portal = data?.data?.attributes?.urls?.customer_portal
  if (!portal) {
    return json({ error: 'no_portal_url' }, 502)
  }

  return json({ url: portal }, 200)
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
