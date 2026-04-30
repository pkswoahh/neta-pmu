# Neta. — Contexto para Claude

> **Si abres este proyecto en una sesión nueva: lee este archivo completo, luego `ROADMAP.md`, y solo entra a `docs/` si lo necesitas para la tarea.**

## Qué es

SaaS de gestión para micropigmentadoras independientes en LATAM y USA. **$15 USD/mes** (suscripción aún no integrada). Marca de Roberto.

- **Tagline**: "Tu negocio, claro como el agua."
- **Logo**: `Neta.` con punto en `#E8A598`

## Stack

React 18 + TypeScript + Vite · Supabase (Postgres + Auth + RLS) · Tailwind · Netlify · PWA con vite-plugin-pwa.

## Estructura del repo

```
src/
├── components/      Logo, AppLayout, Modal, Toast, Confirm, Particles,
│                    Skeleton, Select, MoneyInput, MonthSelector, Empty,
│                    ClientHistoryModal
├── contexts/        AuthContext, ProfileContext
├── lib/             supabase, utils, clients, pwa
├── pages/           Login, Onboarding, RecoverPassword, Dashboard,
│                    Procedimientos, Gastos, Clientes, Configuracion
├── styles/globals.css
├── types/database.ts
└── App.tsx          rutas + guards
supabase/
├── schema.sql                       schema base (ya corrido)
└── migrations/002_admin_module.sql  módulo admin (PENDIENTE de correr)
```

## Convenciones rápidas

- Mobile-first (375px). Sin scroll horizontal nunca.
- Paleta: bg `#0F0F0F`, surface `#1A1A1A`, accent `#E8A598`, gold `#D4A96A`. Detalles en `docs/DESIGN.md`.
- `neta-card`, `neta-input`, `neta-btn-primary`, `neta-btn-ghost` son clases de utilidad ya definidas.
- Toasts: máx 2s, no bloquean. Confirmaciones: `useConfirm()` (no `confirm()` del navegador).
- Dropdowns: `<Select>` custom, no `<select>` nativo.
- Money: `<MoneyInput>` + `formatMoney(value, currency)` en utils.
- Fechas en listas: `relativeDate()` ("Hoy", "Ayer", "Hace N días").
- Escribir UI siempre en español (mensajes, labels, errores).

## Workflow para construir una feature

1. Lee `ROADMAP.md` y elige el item
2. Si toca DB, agrega migración nueva en `supabase/migrations/00X_*.sql` (idempotente)
3. Si toca tipos, edita `src/types/database.ts`
4. Implementa siguiendo patrón de páginas existentes
5. `npm run build` debe pasar
6. Marca `[x]` en ROADMAP, commit con mensaje descriptivo, push

## Build / dev / commit

- **Node**: instalado en `C:\Program Files\nodejs`. Usar `npm.cmd` desde Bash con PATH explícito porque PowerShell tiene política restrictiva
- **Comando**: `export PATH="$PATH:/c/Program Files/nodejs" && npm.cmd run build`
- **Servidor dev**: `npm.cmd run dev` (puerto 5173)
- **Commits**: nombre descriptivo, body con bullets, footer `Co-Authored-By: Claude ... <noreply@anthropic.com>`

## Datos clave

- **Repo**: https://github.com/pkswoahh/neta-pmu
- **Producción**: https://neta-pmu.netlify.app (auto-deploy desde main)
- **Supabase URL**: `https://jolxvidopodflypelwxn.supabase.co` (proyecto "Neta", org "Marketing de Roberto")
- **Admin**: Roberto (`robertocpks24@gmail.com`) — la migración 002 lo marca como `role = 'admin'`

## Documentación detallada

| Tema | Archivo |
|---|---|
| Stack, patrones, convenciones, decisiones | `docs/ARCHITECTURE.md` |
| Schema, RLS, migraciones, estado actual | `docs/DATABASE.md` |
| Diseño completo del módulo admin | `docs/ADMIN.md` |
| Deploy, Netlify, dominio, env vars | `docs/DEPLOY.md` |
| Paleta, tipografía, reglas UX | `docs/DESIGN.md` |
| Plan de integración de pagos (Lemon Squeezy) | `docs/PAYMENTS.md` |

## Skills disponibles

En `.claude/skills/`:
- `/neta-resume` — reportar estado actual y siguiente paso recomendado
- `/neta-feature [nombre]` — workflow para empezar una feature nueva

## Estado actual (al cierre de la última sesión — 2026-04-30)

**Completado en esta sesión:**
- Landing pública en `/` (12 secciones, mobile-first, mockup inline, animaciones)
- Dashboard movido a `/dashboard`
- Sistema de códigos de invitación para beta cerrada (migración 004 ✅ corrida)
- Pestaña `/admin/codigos` para gestionar códigos
- Signup pide código de acceso

**Estado de migraciones:** 002 ✅ · 003 ✅ · 004 ✅ (todas corridas en producción)

**En vuelo:**
- Lemon Squeezy: cuenta en validación, esperando aprobación para integrar pagos

**Próximos pasos recomendados (en orden):**
1. Roberto crea código de invitación en `/admin/codigos` (ej. `NETABETA`)
2. Invitar 20 beta testers, recoger feedback
3. Cuando Lemon Squeezy apruebe → integrar pagos (plan en `docs/PAYMENTS.md`)
4. Conseguir dominio propio → desbloquea: email, Google OAuth, confirmación de email
