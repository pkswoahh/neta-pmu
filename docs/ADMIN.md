# Módulo Administrador — Diseño completo

## Contexto

Roberto necesita panel para gestionar usuarias del SaaS: ver quién paga, dar acceso gratis, suspender, métricas. Diseñado para **funcionar sin Stripe** (todo manual) y plug-in cuando integremos pagos.

## State machine de suscripción

```
                ┌──────────┐
   signup ───►  │  trial   │ (14 días)
                └────┬─────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ expired │  │ active  │  │  comped │  (manual admin)
   └─────────┘  └────┬────┘  └─────────┘
                     │
                     ▼
                ┌──────────┐
                │ past_due │
                └────┬─────┘
                     │
                     ▼
                ┌──────────┐
                │ canceled │ (acceso hasta period_end)
                └──────────┘

  Cualquier estado ──► suspended (manual admin)
```

| Estado | Acceso a la app | Origen |
|---|---|---|
| `trial` | ✅ Completo | Auto al registrarse |
| `active` | ✅ Completo | Webhook Stripe (futuro) |
| `past_due` | ✅ Con banner amarillo | Webhook Stripe |
| `canceled` | ✅ Hasta `current_period_end` | Usuario o admin |
| `expired` | 🚫 Pantalla "renovar" | Auto (trial vencido) o webhook |
| `comped` | ✅ Hasta `comped_until` (null = forever) | Manual admin |
| `suspended` | 🚫 Pantalla "cuenta suspendida" + razón | Manual admin |

## Reglas de gating

```ts
// src/lib/access.ts
function computeAccess(profile, isAdmin) {
  // Admins/support NO se gatean (bypass)
  if (isAdmin) return { allowed: true, state: 'admin', warning: null }

  const status = profile.subscription_status
  const now = Date.now()

  if (status === 'suspended')
    return { allowed: false, state: 'suspended', reason: profile.suspended_reason }

  if (status === 'comped') {
    if (!profile.comped_until || +new Date(profile.comped_until) > now)
      return { allowed: true, state: 'comped', warning: null }
    return { allowed: false, state: 'expired' }  // comp expiró
  }

  if (status === 'trial') {
    const ends = +new Date(profile.trial_ends_at)
    if (ends < now) return { allowed: false, state: 'expired' }
    const days = Math.ceil((ends - now) / 86400000)
    return { allowed: true, state: 'trial', warning: days <= 3 ? 'trial_ending' : null, daysLeft: days }
  }

  if (status === 'active')
    return { allowed: true, state: 'active', warning: null }

  if (status === 'past_due')
    return { allowed: true, state: 'past_due', warning: 'past_due' }

  if (status === 'canceled') {
    if (profile.current_period_end && +new Date(profile.current_period_end) > now)
      return { allowed: true, state: 'canceled', warning: 'canceled' }
    return { allowed: false, state: 'expired' }
  }

  return { allowed: false, state: 'expired' }
}
```

## Páginas del admin

### `/admin` — Overview

Métricas en cards (datos vienen de `admin_overview()` RPC):
- MRR estimado: `paying * $15` (donde `paying = active + past_due`)
- Total usuarias · Activas 30d · Trials · Comped · Suspendidas
- Cola de atención: trial ending soon, inactive 30d, expired sin comp
- Mini-gráfico de signups últimos 30 días (de `admin_signups_daily()` RPC)

### `/admin/usuarias`

Tabla con tabs como filtros: Todas · Trial · Activas · Vencidas · Canceladas · Comped · Suspendidas · Inactivas (30d+).

Columnas: avatar (iniciales), nombre, email, país, estado (badge), última actividad, signup date.

Búsqueda por email/nombre. Exportar CSV.

Click fila → `/admin/usuarias/:id`.

### `/admin/usuarias/:id` (sesión 2)

- Datos perfil + timeline visual de suscripción
- Stats: # procedimientos, # gastos, ingreso último mes
- Acciones (todas → audit log + razón obligatoria si suspende):
  - 🎁 Comp con expiración opcional
  - ⏸️ Suspender (razón obligatoria)
  - ▶️ Reactivar
  - 🔄 Extender trial N días
  - 📧 Reset password
  - 🗑️ Eliminar (doble confirmación)
- Las acciones que mutan estado pasan por **Edge Function** con service role (no client direct)

### `/admin/auditoria` (sesión 2)

Solo lectura. Quién hizo qué a quién cuándo por qué.

## Pantallas de gating para usuarias

Cuando `access.allowed === false`:

- **`expired`** → `/suscripcion-vencida`
  - "Tu trial terminó / Tu suscripción venció"
  - Botón "Reactivar" → futuro: link Stripe Checkout. Por ahora: mailto a `hola@neta.app`
- **`suspended`** → `/cuenta-suspendida`
  - Razón visible
  - Mailto a soporte

Cuando `access.allowed === true` pero hay warning:
- **`trial_ending`** → banner sutil arriba: "Tu trial termina en N días"
- **`past_due`** → banner amarillo: "Tu pago falló, actualiza tu método"
- **`canceled`** → banner gris: "Tu suscripción terminará el [fecha]"

## Plan de implementación

### Sesión 1 — Fundamentos ✅ COMPLETA

- [x] Migración SQL: columnas, audit log, RLS, funciones
- [x] Roberto corrió la migración en Supabase
- [x] Tipos TS actualizados (`Profile` extendido)
- [x] `src/lib/access.ts` con `computeAccess()`
- [x] `ProfileContext` calcula access derivado + llama `update_last_seen()`
- [x] Pantallas `/suscripcion-vencida` y `/cuenta-suspendida`
- [x] Banners en `AppLayout` para trial_ending / past_due / canceled
- [x] `<RequireAdmin>` guard
- [x] `AdminLayout` con sidebar (Overview, Usuarias, Auditoría)
- [x] `/admin` Overview con métricas y mini-gráfico de signups
- [x] `/admin/usuarias` lista + tabs + búsqueda + CSV
- [x] Onboarding: auto-derivar `country` de `currency`
- [x] Link "Panel admin" en sidebar principal solo si `role === 'admin'`

### Sesión 2 — Profundidad ✅ COMPLETA

- [x] Migración 003: RPCs de admin (list, detail, audit, acciones)
- [x] Roberto corre la migración 003 en Supabase
- [x] `/admin/usuarias/:id` detalle con stats de uso, timeline de suscripción y datos completos
- [x] RPCs Postgres para acciones (no Edge Functions — más simples y suficientes con RLS):
  - `admin_suspend_user(target, reason)` — razón obligatoria
  - `admin_unsuspend_user(target, reason?)` — restaura estado según fechas
  - `admin_comp_user(target, until?, reason?)` — cortesía con/sin expiración
  - `admin_remove_comp(target, reason?)` — restaura estado lógico
  - `admin_extend_trial(target, days, reason?)` — suma días
  - `admin_set_role(target, new_role, reason?)` — cambia role (futuro)
- [x] Modales por acción con validación (razón obligatoria en suspend)
- [x] Acción "Enviar reset de contraseña" via API pública de Supabase
- [x] `/admin/auditoria` con timeline filtrable por acción y búsqueda
- [x] Lista de usuarias muestra email vía RPC `admin_list_users()`
- [x] Click en fila de auditoría navega al detalle de la usuaria afectada

### ⏳ Pendiente futuro (no urgente)

- [ ] **Eliminar usuaria definitivamente** — requiere `auth.admin.deleteUser()` con service_role. Hay que crear Edge Function. Por ahora soft-delete via "suspendida" cumple el objetivo.
- [ ] **Email notifications** al admin (nuevos signups, cancelaciones, pagos fallidos) — se ata cuando integremos email service junto con Stripe.
- [ ] **Acciones bulk** — extender trial / dar comp a varias en batch desde la lista.

### Cómo retomar

1. Verifica que migraciones 002 y 003 estén corridas:
   ```sql
   select count(*) from pg_proc
   where proname in ('admin_overview', 'admin_list_users', 'admin_suspend_user');
   -- debe devolver 3
   ```
2. Las acciones se llaman como `supabase.rpc('admin_suspend_user', { target, reason_text })`.
3. Cualquier acción nueva: RPC en migración 00X + modal en `ActionModals.tsx` + botón en `UsuariaDetalle.tsx`.

## Decisiones tomadas

- **Razón obligatoria** al suspender (audit + futura defensa legal)
- **Country** auto-derivado de currency: `COP→CO, USD→US, ARS→AR, MXN→MX, VES→VE, EUR→ES`. Editable luego en Configuración.
- **Email soporte**: constante `hola@neta.app` en `src/lib/constants.ts`. Mientras no haya dominio propio, ese mail no funciona — la usuaria llega y rebota. Decisión consciente: preferimos esperar al dominio antes de exponer un Gmail personal.
- **Admins bypass gating** — `role === 'admin' | 'support'` siempre tienen acceso, no necesitan suscripción.
- **Stripe**: campos `stripe_customer_id` y `stripe_subscription_id` ya existen pero null. Cuando integremos, los webhooks los llenan.

## Cómo retomar este módulo

1. Verifica que migración 002 esté corrida (en Supabase, query `select role from profiles where id = (select id from auth.users where email = 'robertocpks24@gmail.com')` debe devolver `'admin'`)
2. Sigue la lista de Sesión 1 arriba en orden
3. Cada item commiteado con mensaje claro
4. Al cerrar Sesión 1: actualizar este doc + ROADMAP.md + memoria
