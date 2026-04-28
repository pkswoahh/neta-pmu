# Plan de integración Stripe

> Este documento es el plan, **no** está implementado. Se ataca cuando todo el módulo admin esté listo y la app tenga uso real.

## Producto

- **Plan único**: Neta Pro — $15 USD / mes
- Trial: 14 días (gestionado por la app, no por Stripe — más control)
- Sin descuentos anuales ni planes intermedios al inicio (simplicidad)

## Decisiones técnicas

- **Stripe** (no MercadoPago) por cobertura LATAM + USA, mejor DX, pricing claro
- **Stripe Checkout hosted** (no Elements) — UI lista, PCI-compliant sin trabajo
- **Customer Portal** de Stripe para que las usuarias actualicen tarjeta, vean facturas, cancelen
- **Webhooks** procesados en **Supabase Edge Function** que actualiza `profiles.subscription_status`
- **Currency**: cobrar en USD globalmente para simplificar (la usuaria ve USD en checkout). Las usuarias en LATAM pueden pagar con tarjeta local en USD sin problema.

## Flujo end-to-end

```
1. Usuaria expira (trial vencido)
2. Ve pantalla "Tu trial terminó" → botón "Reactivar"
3. Botón llama a Edge Function que crea Stripe Checkout Session
4. Redirect a Stripe Checkout (URL hospedada)
5. Paga
6. Stripe redirect back a /app/?success=1
7. Webhook checkout.session.completed → Edge Function:
   - upsert stripe_customer_id, stripe_subscription_id en profiles
   - subscription_status = 'active'
   - current_period_end = del subscription
8. Usuaria entra a la app, access.allowed === true, dashboard normal
```

## Webhooks a manejar

| Evento | Acción |
|---|---|
| `checkout.session.completed` | Marcar `active`, set IDs y `current_period_end` |
| `invoice.paid` | Renovar `current_period_end` |
| `invoice.payment_failed` | Marcar `past_due` |
| `customer.subscription.deleted` | Marcar `canceled` con `canceled_at = now()` |
| `customer.subscription.updated` | Actualizar `current_period_end` si cambió |

## Edge Functions a crear

```
supabase/functions/
├── create-checkout-session/index.ts
├── create-portal-session/index.ts
└── stripe-webhook/index.ts
```

## Cosas que recordar

- Webhook secret en Supabase secrets (no en código)
- Validar firma del webhook antes de procesar
- Hacer las operaciones idempotentes (Stripe puede reenviar el mismo evento)
- `customer_email` en metadata del Checkout para matchear si el usuario no está logueado
- Probar exhaustivamente con Stripe CLI antes de producción

## Estado de gating después de Stripe

Una vez integrado, los estados `active`, `past_due`, `canceled` los maneja Stripe. Roberto sigue gestionando manualmente solo `comped` y `suspended`. El módulo admin no cambia su API — solo recibe estados desde dos orígenes (manual + Stripe).
