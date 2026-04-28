# Base de datos

Postgres en Supabase. Todas las tablas con RLS activo.

## Estado de migraciones

| Archivo | Estado | Descripción |
|---|---|---|
| `supabase/schema.sql` | ✅ Corrido en producción | Tablas base + RLS + trigger de seed |
| `supabase/migrations/002_admin_module.sql` | ⚠️ **PENDIENTE de correr** | Columnas admin, audit log, funciones agregadas |

> **Cómo correr una migración**: SQL Editor de Supabase → New query → pegar contenido → Run. Las migraciones son idempotentes (`if not exists`, `drop policy if exists ... create policy`).

## Tablas

### profiles

Una fila por usuaria (linked a `auth.users`).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK, FK a `auth.users(id)` |
| `business_name` | text | Null hasta completar onboarding |
| `currency` | text | COP, USD, ARS, MXN, VES, EUR |
| `monthly_goal` | numeric | 0 por defecto |
| `created_at` | timestamptz | |
| **— Migración 002 (admin) —** | | |
| `role` | text | `'user'` \| `'admin'` \| `'support'` |
| `subscription_status` | text | Ver state machine en `ADMIN.md` |
| `trial_ends_at` | timestamptz | now() + 14 días al signup |
| `current_period_end` | timestamptz | Set por webhook Stripe |
| `canceled_at` | timestamptz | |
| `comped_until` | timestamptz | Null = comp permanente |
| `suspended_at` | timestamptz | |
| `suspended_reason` | text | Obligatorio al suspender |
| `last_seen_at` | timestamptz | Actualizado al cargar app |
| `stripe_customer_id` | text | |
| `stripe_subscription_id` | text | |
| `country` | text | ISO 2-letter, derivado de currency en onboarding |

### user_options

Opciones personalizables por usuaria. `type` ∈ `{procedure, payment_method, client_source, expense_category}`.

### procedures

Registro de servicios. Ver columnas en el schema. Index por `(user_id, date desc)`.

### expenses

Registro de egresos. Ver columnas en el schema. Index por `(user_id, date desc)`.

### admin_audit_log (post-migración 002)

| Columna | Notas |
|---|---|
| `id` | uuid |
| `admin_id` | uuid, FK auth.users |
| `target_user_id` | uuid, nullable (para acciones globales) |
| `action` | text — `suspend`, `comp`, `extend_trial`, etc. |
| `details` | jsonb — payload de la acción |
| `reason` | text |
| `created_at` | timestamptz |

## RLS — políticas

### profiles

- `profiles_self_select` — usuaria ve la suya
- `profiles_self_update` — usuaria edita la suya
- `profiles_self_insert` — usuaria crea la suya (también el trigger)
- `profiles_admin_select` — admin ve todas (post-002)
- `profiles_admin_update` — admin edita todas (post-002)

### user_options / procedures / expenses

- `*_owner_all` — usuaria CRUD sobre los suyos (`auth.uid() = user_id`)
- Post-002: `*_admin_select` para read-only desde admin

### admin_audit_log

- `audit_log_admin_select` / `audit_log_admin_insert` — solo admin

## Funciones (post-migración 002)

- `is_admin()` — devuelve boolean. Usada en políticas RLS.
- `update_last_seen()` — la app la llama 1x por sesión.
- `admin_overview()` — devuelve jsonb con métricas (total, activos 30d, trials, etc.)
- `admin_signups_daily()` — 30 días de signups para gráfico

## Triggers

- `on_auth_user_created` (en `auth.users`) → `handle_new_user()` siembra perfil + opciones + trial.

## Tipos TS

`src/types/database.ts` define interfaces de dominio (no genéricas de Supabase). Cuando agregues columnas en SQL, actualiza también el tipo.
