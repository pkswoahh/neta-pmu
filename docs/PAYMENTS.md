# Plan de integración Lemon Squeezy

> Reemplaza el plan original de Stripe. Colombia no está soportada en Stripe, por eso usamos Lemon Squeezy (merchant of record, funciona globalmente).

## Producto

- **Plan único**: Neta Pro — $15 USD / mes
- Trial: 14 días (gestionado por la app, no por Lemon Squeezy — ya está implementado)
- Sin planes anuales ni descuentos al inicio

## Por qué Lemon Squeezy

- Colombia está soportada como país de origen del vendedor
- Es "merchant of record": ellos cobran el IVA/impuestos de cada país, tú recibes el neto
- Tus clientas pagan desde cualquier país con tarjeta local
- Tú recibes vía PayPal o transferencia a cuenta colombiana
- Comisión ~5% + $0.50 por transacción (vs ~2.9% de Stripe — aceptable para empezar)
- Portal de cliente incluido (gestión de tarjeta, cancelación, facturas)

## Equivalencias Stripe → Lemon Squeezy

| Stripe | Lemon Squeezy |
|---|---|
| Checkout Session | Checkout URL con `checkout[email]` en query |
| Customer Portal | Portal URL vía API |
| `stripe_customer_id` | `lemon_customer_id` |
| `stripe_subscription_id` | `lemon_subscription_id` |
| Webhook `checkout.session.completed` | Webhook `order_created` |
| Webhook `invoice.paid` | Webhook `subscription_payment_success` |
| Webhook `invoice.payment_failed` | Webhook `subscription_payment_failed` |
| Webhook `customer.subscription.deleted` | Webhook `subscription_cancelled` |
| Webhook `customer.subscription.updated` | Webhook `subscription_updated` |

## Setup en Lemon Squeezy (Roberto — antes de codear)

1. Crear tienda con nombre `Neta.` y URL `neta-pmu` (o `neta`)
2. Settings → Payments → conectar PayPal o cuenta bancaria para recibir pagos
3. Products → New Product:
   - Nombre: "Neta Pro"
   - Tipo: Subscription
   - Precio: $15.00 USD / month
   - Guardar y copiar el **Variant ID** (número en la URL al editar la variante)
4. Settings → Store → copiar **Store ID**
5. Settings → API → crear API Key → copiar
6. Settings → Webhooks → crear webhook apuntando a la Edge Function (URL se define al crear la función)
   - Seleccionar eventos: `order_created`, `subscription_created`, `subscription_payment_success`, `subscription_payment_failed`, `subscription_cancelled`, `subscription_updated`
   - Copiar el **Signing Secret**

Variables de entorno a agregar en Netlify y Supabase secrets:
```
LEMON_SQUEEZY_API_KEY=...
LEMON_SQUEEZY_STORE_ID=...
LEMON_SQUEEZY_VARIANT_ID=...    # el del plan $15/mes
LEMON_SQUEEZY_WEBHOOK_SECRET=...
```

## Flujo end-to-end

```
1. Usuaria expira (trial vencido)
2. Ve pantalla "Tu trial terminó" → botón "Suscribirme — $15/mes"
3. Botón llama a Edge Function create-checkout que genera URL de checkout
4. Redirect a Lemon Squeezy Checkout (hosted, con email pre-llenado)
5. Paga con tarjeta
6. Lemon Squeezy redirect back a /app/?success=1
7. Webhook subscription_created → Edge Function lemon-webhook:
   - upsert lemon_customer_id, lemon_subscription_id en profiles
   - subscription_status = 'active'
   - current_period_end = próximo ciclo de facturación
8. Usuaria entra a la app, access.allowed === true, dashboard normal
```

## Edge Functions a crear

```
supabase/functions/
├── lemon-checkout/index.ts       — genera URL de checkout con email pre-llenado
├── lemon-portal/index.ts         — genera URL del portal de cliente
└── lemon-webhook/index.ts        — procesa eventos de Lemon Squeezy
```

## Migración SQL necesaria (004)

Renombrar campos en `profiles`:
```sql
alter table profiles
  rename column stripe_customer_id to lemon_customer_id;
alter table profiles
  rename column stripe_subscription_id to lemon_subscription_id;
```

## Detalle de cada Edge Function

### lemon-checkout

```ts
// Llama a POST https://api.lemonsqueezy.com/v1/checkouts
// Body: { store_id, variant_id, checkout_data: { email } }
// Devuelve: { url } para redirigir al usuario
```

### lemon-portal

```ts
// GET https://api.lemonsqueezy.com/v1/customers?filter[email]=...
// Luego GET /v1/customer-portal/<customer_id>
// Devuelve URL del portal
```

### lemon-webhook

Eventos y acciones:

| Evento | Acción en profiles |
|---|---|
| `subscription_created` | `status = 'active'`, set `lemon_customer_id`, `lemon_subscription_id`, `current_period_end` |
| `subscription_payment_success` | Renovar `current_period_end` |
| `subscription_payment_failed` | `status = 'past_due'` |
| `subscription_cancelled` | `status = 'canceled'`, set `canceled_at` |
| `subscription_updated` | Actualizar `current_period_end` si cambió |

### Validación del webhook

```ts
import { createHmac } from 'crypto'

function verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex')
  return digest === signature
}
// Header a verificar: X-Signature
```

## Cosas a recordar

- El webhook secret va en Supabase secrets (nunca en código)
- Validar firma antes de procesar cualquier evento
- Hacer las operaciones idempotentes (Lemon puede reenviar el mismo evento)
- Pre-llenar `checkout[email]` para que la usuaria no tenga que escribirlo
- Probar con una suscripción de prueba ($1 o modo test) antes de producción
- Lemon Squeezy tiene modo "Test mode" en el dashboard — usarlo durante desarrollo

## Estado de gating después de Lemon Squeezy

Una vez integrado, los estados `active`, `past_due`, `canceled` los maneja Lemon Squeezy vía webhooks. Roberto sigue gestionando manualmente solo `comped` y `suspended`. El módulo admin no cambia su API.
