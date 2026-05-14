# Neta. — Roadmap

Checklist viva del producto. Marcamos `[x]` cuando algo se completa.
Última actualización: 2026-05-14 (Migración 009: redención atómica de código de invitación · página `/mi-suscripcion` · loader + polling post-pago · Google OAuth listo)

---

## 💰 Precio y planes (decidido 2026-05-12)

- **Plan Solo (único plan activo hoy):** $12 USD/mes o $108 USD/año (~$9/mes, ahorra 25%).
- **ICP:** Micropigmentadora **independiente que trabaja sola** (LATAM + USA hispano). No estudios con equipo.
- **Plan Estudio (futuro, no construir aún):** ~$29/mes — multi-especialista + comisiones. Solo se construye después de validar que las independientes pagan el Solo.

---

## ✅ Hecho

- [x] Setup base: React + TypeScript + Vite + Tailwind
- [x] Supabase: schema con RLS y trigger de seed
- [x] Auth email/password
- [x] Auth Google OAuth (código listo, falta configurar provider)
- [x] Onboarding inicial
- [x] Layout: sidebar desktop + bottom nav mobile
- [x] Partículas tipo constelaciones (con halo nude)
- [x] Módulo Configuración (perfil, moneda, meta, opciones editables)
- [x] Módulo Procedimientos (CRUD + filtro por mes)
- [x] Módulo Gastos (CRUD + filtro por mes)
- [x] Dashboard (meta editable, cards, breakdowns por origen/tipo/pago/categoría)
- [x] Custom Select estilizado (reemplaza nativos feos)
- [x] Modal de confirmación bonito (reemplaza `confirm()` del navegador)
- [x] Recuperación de contraseña (link en login + email + página `/cambiar-password`)
- [x] PWA instalable (manifest, iconos 192/512/maskable, service worker con Workbox)
- [x] Skeletons de carga en Dashboard, Procedimientos, Gastos y Clientes
- [x] Fechas relativas ("Hoy", "Ayer", "Hace 3 días")
- [x] Vista de cliente / historial — modal con stats + lista de visitas
- [x] Página Clientes con lista agregada, búsqueda y avatar de iniciales
- [x] Repo en GitHub con commits + push
- [x] Build production verificado

---

## 🚨 Críticos (antes de cobrar)

- [x] ~~Recuperación de contraseña~~
- [x] ~~Modal de confirmación bonito~~
- [ ] **Confirmación de email en producción** — el código ya está listo (pantalla 📬 + errores en español). Solo activar el toggle "Confirm email" en Supabase → Sign In / Providers cuando salga el dominio propio.
- [ ] **Pasarela de pago (Lemon Squeezy)** — ✅ cuenta aprobada. ✅ productos creados en Test mode ($12 mensual / $108 anual). ✅ Migración 008 escrita y corrida (rename stripe→lemon + billing_plan). ✅ Edge Functions escritas: `lemon-checkout`, `lemon-portal`, `lemon-webhook`. ✅ Página `/suscribirse` con toggle mensual/anual integrada. ✅ Test mensual y anual exitosos en Test mode. ✅ Página `/mi-suscripcion` con info del plan + botón al portal. ✅ Loader + polling post-pago. **Falta:** probar portal de cancelación, probar gating con usuaria no-admin vencida, pasar a Live mode.
- [x] ~~**Landing reposicionada al ICP "independiente que trabaja sola"**~~ (2026-05-12) — hero, dolores y sección "Para quién" reescritos. Sección "Para quién" pasa de listar otras profesiones (lashistas, manicuristas, nutricionistas) a perfiles de la micropigmentadora independiente sola (cabina en casa, renta puesto, atiende a domicilio, recién egresada, lleva años sin claridad, sin equipo). Pricing: toggle mensual/anual ($12 / $9 efectivo). Trial unificado a 30 días en todos los CTAs. FAQ con pregunta "tengo equipo, ¿sirve?" que dirige al plan Estudio futuro.
- [x] **Trial de 14 días** — trigger `handle_new_user` da `trial_ends_at = now() + 14 days` automáticamente. Gating funcional vía `computeAccess()`.
- [x] **Términos y Política de Privacidad** — páginas `/terminos` y `/privacidad`, links en Login (signup) y Configuración
- [x] **Bloqueo de acceso por suscripción vencida** — banners con CTA, `/suscribirse` pricing page, redirect desde `/suscripcion-vencida`

---

## ⭐ Importantes (UX y diferenciación)

- [x] ~~Búsqueda en Procedimientos y Gastos~~
- [x] ~~Filtros por tipo/categoría en Procedimientos y Gastos~~
- [x] ~~Vista de cliente / historial~~
- [x] ~~PWA instalable~~
- [x] ~~Comparación con mes anterior en Dashboard (% vs mes anterior en cada card)~~
- [x] ~~Skeletons de carga~~
- [x] ~~Fechas relativas~~
- [x] ~~Exportar a CSV (Procedimientos y Gastos)~~
- [x] ~~Validación al borrar opciones de Configuración~~ — el modal ahora cuenta cuántos registros usan la opción y advierte con el número exacto
- [x] ~~Mensajes de error de Supabase traducidos al español~~ — módulo `src/lib/errors.ts` con `translateError()`, aplicado en todas las páginas que muestran errores (auth, signup, recuperar contraseña, CRUD, admin)

---

## 💡 Nice-to-have (post-MVP)

- [ ] Agenda / recordatorios de citas próximas
- [ ] Notificaciones push al alcanzar la meta
- [ ] Gráfico de líneas (tendencia mensual de ingresos) en Dashboard
- [ ] Drag-and-drop para reordenar opciones en Configuración
- [ ] Multi-idioma (EN para usuarias en USA)
- [ ] Backup/exportar todos los datos en JSON (RGPD)
- [ ] Modo claro opcional
- [ ] Integración con Instagram/WhatsApp para mensajes recordatorio
- [ ] Sistema de referidos (1 mes gratis por amiga referida)

---

## 🛠️ Módulo Admin

Diseño completo en `docs/ADMIN.md`.

### ✅ Sesión 1 — Fundamentos (HECHO)

- [x] Migración SQL: columnas, audit log, RLS, funciones, trigger actualizado
- [x] State machine de suscripción (trial/active/past_due/canceled/expired/comped/suspended)
- [x] `computeAccess()` derivado del perfil
- [x] Tracking de `last_seen_at`
- [x] Pantallas de gating: `/suscripcion-vencida` y `/cuenta-suspendida`
- [x] Banners trial-ending / past_due / canceled en AppLayout
- [x] `<RequireAdmin>` guard
- [x] AdminLayout con sidebar (Overview, Usuarias, Auditoría)
- [x] `/admin` Overview con MRR, métricas y mini-gráfico
- [x] `/admin/usuarias` lista con tabs, búsqueda y exportar CSV
- [x] Country auto-derivado en onboarding

### ✅ Sesión 2 — Profundidad (HECHO)

- [x] Migración 003: RPCs de admin (list, detail, audit, acciones)
- [x] `/admin/usuarias/:id` detalle con stats de uso y timeline de suscripción
- [x] RPCs Postgres para acciones: suspend, unsuspend, comp, remove_comp, extend_trial, set_role
- [x] Modales por acción con validación (razón obligatoria en suspend)
- [x] Acción "Enviar reset de contraseña" via API pública de Supabase
- [x] Audit log con timeline filtrable por acción y búsqueda
- [x] Email visible en la lista (vía RPC `admin_list_users()`)
- [x] Click en fila de auditoría navega al detalle de la usuaria afectada

### ⏳ Pendiente futuro (no urgente)

- [ ] Eliminar usuaria definitivamente desde el admin (hoy se hace desde Supabase → Authentication → Users → Delete)
- [ ] Email notifications al admin (signup, cancelación, fallo de pago)
- [ ] Acciones bulk (extender trial / dar comp a varias en batch)

---

## 🌐 Camino al lanzamiento

- [x] Deploy a Netlify — activo en https://neta-pmu.netlify.app (auto-deploy desde main)
- [x] Dominio propio — `netapmu.com` activo con SSL
- [x] DNS apuntando a Netlify
- [x] SSL activado automáticamente
- [x] Site URL y Redirect URLs en Supabase actualizadas a `netapmu.com`
- [x] Email de soporte — `hola@netapmu.com` via ImprovMX (reenvía a Gmail)
- [x] Configurar Google OAuth (Google Cloud Console + Supabase)
- [ ] Onboarding con datos demo de ejemplo (que vean la app llena) — en standby, esperando feedback real de beta
- [x] **Dashboard vacío cálido** — cuando la cuenta no tiene ni procs ni gastos, se reemplaza el dashboard por bienvenida con CTA "Registrar mi primer cliente"
- [x] **Botón flotante de soporte WhatsApp** — en AppLayout, abre wa.me con mensaje pre-armado que incluye la pantalla actual. Reduce fricción para feedback de beta testers.
- [x] **Página de marketing / landing** — pública en `/`, app interna en `/dashboard`. Mockup inline del Dashboard, FAQ, dolores, beneficios, prueba social, animaciones al scroll.
- [x] **Beta cerrada con código de invitación** — migración 004, RPC `validate_invitation_code` y `redeem_invitation_code`, pestaña `/admin/codigos` con CRUD. Signup pide código. Google OAuth también exige código en modo signup.
- [x] **Trial 30 días** — migración 007, extendido de 14 a 30 días.
- [x] **Email recuperar contraseña** — template personalizado con marca Neta. configurado en Supabase.
- [x] **Bottom nav mobile fijo** — reemplazado position fixed por flex column (fix iOS Safari).
- [ ] Analytics (Plausible / PostHog) para entender uso real
- [ ] Sentry o similar para tracking de errores
- [ ] SMTP personalizado (Resend) — enviar desde hola@netapmu.com en lugar de mail.supabase.io

---

## 🔒 Seguridad y operación

- [ ] Rate limiting básico (Supabase ya trae algo, revisar)
- [ ] 2FA opcional para usuarias
- [ ] Backups automáticos (Supabase los hace, validar política)
- [ ] Banner de cookies si se vende en EU
- [ ] Plan de respuesta ante incidentes (incluso si es informal)
- [ ] **Service Worker — manejo de actualizaciones**
  - [x] ~~Cambiar `registerType` a `prompt` y mostrar banner persistente con botón "Actualizar ahora"~~ (componente `UpdatePrompt`)
  - [ ] Definir página/estado offline (cuando no hay red y no está en cache).
  - [ ] Revisar runtime caching para llamadas a Supabase (ahora son `NetworkOnly`).

---

## Convenciones de uso

- Marca con `[x]` cuando algo se complete.
- Mueve items entre secciones si cambia su prioridad.
- Si surge una idea nueva, añádela a la sección "💡 Nice-to-have" para no olvidarla.
