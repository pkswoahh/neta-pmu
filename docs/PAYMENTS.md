# Plan de integración Lemon Squeezy

> Reemplaza el plan original de Stripe. Colombia no está soportada en Stripe, por eso usamos Lemon Squeezy (merchant of record, funciona globalmente).

## Estado actual

- Cuenta Lemon Squeezy aprobada (2026-05-12).
- Trabajando en **Test mode** durante desarrollo.
- Tienda: `Neta.` — `neta-pmu.lemonsqueezy.com` — Store ID `359133`.

## Productos

Dos productos creados en Lemon Squeezy:

| Plan | Precio | Intervalo | Variant UUID |
|---|---|---|---|
| **Neta Solo — Mensual** | $12.00 USD | Monthly | `44e5e542-f272-4b53-9feb-76b3db0d6ae9` |
| **Neta Solo — Anual** | $108.00 USD | Yearly | `4006d0cb-e741-4b7c-99d9-a78422cc40c9` |

- Trial: 30 días gestionado por la app (NO por Lemon Squeezy — toggle "free trial" apagado en cada producto).
- Tax category: `Software as a service (SaaS) - business use`.
- Productos NO visibles en storefront público (compra solo vía `netapmu.com`).
- IDs numéricos de variantes se obtienen vía API después del primer pago de prueba.

## Por qué Lemon Squeezy

- Colombia está soportada como país de origen del vendedor.
- Es "merchant of record": ellos cobran el IVA/impuestos de cada país, tú recibes el neto.
- Tus clientas pagan desde cualquier país con tarjeta local.
- Tú recibes vía PayPal o Wise (mejor tasa para Colombia).
- Comisión ~5% + $0.50 por transacción.
- Portal de cliente incluido (gestión de tarjeta, cancelación, facturas).

## Variables de entorno

Se guardan como **Supabase secrets** (no en el repo, no en Netlify):

```
LEMON_SQUEEZY_API_KEY=eyJ0eXAi...           # JWT largo desde Settings → API
LEMON_SQUEEZY_STORE_ID=359133
LEMON_SQUEEZY_VARIANT_MONTHLY=44e5e542-f272-4b53-9feb-76b3db0d6ae9
LEMON_SQUEEZY_VARIANT_ANNUAL=4006d0cb-e741-4b7c-99d9-a78422cc40c9
LEMON_SQUEEZY_WEBHOOK_SECRET=...            # se define al crear el webhook
```

Comando para setearlos (desde la raíz del repo, con Supabase CLI logueado):

```bash
supabase secrets set LEMON_SQUEEZY_API_KEY="..." \
  LEMON_SQUEEZY_STORE_ID="359133" \
  LEMON_SQUEEZY_VARIANT_MONTHLY="44e5e542-f272-4b53-9feb-76b3db0d6ae9" \
  LEMON_SQUEEZY_VARIANT_ANNUAL="4006d0cb-e741-4b7c-99d9-a78422cc40c9" \
  LEMON_SQUEEZY_WEBHOOK_SECRET="..."
```

## Flujo end-to-end

```
1. Usuaria expira (trial vencido) o quiere suscribirse antes
2. Va a /suscribirse → ve plan Mensual ($12) o Anual ($108) con toggle
3. Click en "Suscribirme" → llama a Edge Function `lemon-checkout`
4. Edge Function crea checkout vía API y devuelve URL
5. Redirect a Lemon Squeezy checkout (con email pre-llenado)
6. Paga con tarjeta
7. Lemon Squeezy redirect a /dashboard?success=1
8. Webhook `subscription_created` → Edge Function `lemon-webhook`:
   - upsert lemon_customer_id, lemon_subscription_id, billing_plan en profiles
   - subscription_status = 'active'
   - current_period_end = próximo ciclo de facturación
9. Usuaria entra a la app, access.allowed === true, dashboard normal
```

## Edge Functions

```
supabase/functions/
├── lemon-checkout/index.ts       — genera URL de checkout
├── lemon-portal/index.ts         — genera URL del portal de cliente
└── lemon-webhook/index.ts        — procesa eventos de Lemon Squeezy
```

### lemon-checkout

- POST con `{ plan: 'monthly' | 'annual' }`.
- Requiere usuario autenticado (lee email desde JWT).
- Llama a `POST https://api.lemonsqueezy.com/v1/checkouts` con el variant UUID correcto.
- `checkout_data.email` pre-llenado · `checkout_data.custom.user_id` con el UUID del usuario (clave para matchear el webhook).
- Devuelve `{ url }` para redirigir.

### lemon-portal

- GET autenticado.
- Lee `lemon_customer_id` del perfil.
- Llama a `GET /v1/customers/<id>` y extrae `customer_portal` (URL firmada que ya viene).
- Devuelve `{ url }`.

### lemon-webhook

Eventos y acciones sobre `profiles`:

| Evento | Acción |
|---|---|
| `subscription_created` | `status='active'`, set `lemon_customer_id`, `lemon_subscription_id`, `billing_plan`, `current_period_end` |
| `subscription_payment_success` | Renovar `current_period_end` |
| `subscription_payment_failed` | `status='past_due'` |
| `subscription_cancelled` | `status='canceled'`, set `canceled_at` |
| `subscription_resumed` | `status='active'`, `canceled_at=null` |
| `subscription_updated` | Actualizar `current_period_end` y `billing_plan` (cambio de plan) |
| `subscription_expired` | `status='expired'` |

**Validación de firma** — header `X-Signature`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

function verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex')
  return timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}
```

**Matcheo de usuario:**
- Primero por `meta.custom_data.user_id` (lo pasamos en el checkout).
- Fallback: por `email` del customer en el payload.
- Si no se encuentra → log el evento, devolver 200 (no reintentar).

**Idempotencia:**
- Cada evento de Lemon viene con un `meta.event_id` o un timestamp. Usar `lemon_subscription_id` + `event_name` como llave: si ya procesamos el mismo evento en estado posterior, no degradar.

## Migración SQL

`supabase/migrations/008_lemon_squeezy.sql` renombra:
- `stripe_customer_id` → `lemon_customer_id`
- `stripe_subscription_id` → `lemon_subscription_id`

Y agrega:
- `billing_plan text` con check `in ('monthly', 'annual')` (nullable, se llena solo cuando hay suscripción).

Las RPCs `admin_list_users()` y `admin_user_detail(uuid)` se recrean con los nuevos nombres.

## Cosas a recordar

- El webhook secret va en Supabase secrets (nunca en código ni en el repo).
- Validar firma antes de procesar cualquier evento.
- Hacer las operaciones idempotentes (Lemon puede reenviar el mismo evento).
- Pre-llenar `checkout[email]` para que la usuaria no tenga que escribirlo.
- Probar todo en Test mode antes de pasar a Live mode.
- En Test mode usar tarjeta de prueba `4242 4242 4242 4242` cualquier CVV/fecha futura.
- Al pasar a Live mode: crear productos LIVE de cero (los UUIDs cambian) y actualizar secrets.

## Estado de gating después de Lemon Squeezy

Una vez integrado, los estados `active`, `past_due`, `canceled` los maneja Lemon Squeezy vía webhooks. Roberto sigue gestionando manualmente solo `comped` y `suspended`. El módulo admin no cambia su API pública (los renombres son internos).
