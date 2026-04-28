# Neta. — Roadmap

Checklist viva del producto. Marcamos `[x]` cuando algo se completa.
Última actualización: 2026-04-28 (sesión 2 admin completa)

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
- [ ] **Pasarela de pago (Stripe o MercadoPago)** — suscripción $15 USD/mes
- [ ] **Trial de 14 días** — gating por `subscription_status`
- [ ] **Términos y Política de Privacidad** — drafts y página legal
- [ ] **Bloqueo de acceso por suscripción vencida** — banner + redirect a billing

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
- [ ] **Validación al borrar opciones de Configuración** — advertir si tienen registros asociados
- [ ] **Mensajes de error de Supabase traducidos al español**

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

- [ ] Eliminar usuaria definitivamente (requiere Edge Function con service_role)
- [ ] Email notifications al admin (signup, cancelación, fallo de pago) — junto con email service de Stripe
- [ ] Acciones bulk (extender trial / dar comp a varias en batch)

---

## 🌐 Camino al lanzamiento

- [ ] Deploy a Netlify (URL temporal `.netlify.app`)
- [ ] Compra de dominio (sugerencias: `neta.app`, `usaneta.com`, `holaneta.com`, `pmuneta.com`)
- [ ] DNS apuntando a Netlify
- [ ] SSL activado (automático con Netlify)
- [ ] Site URL y Redirect URLs en Supabase actualizadas con dominio real
- [ ] Email de soporte (Google Workspace o similar)
- [ ] Configurar Google OAuth provider en Google Cloud Console + Supabase
- [ ] Onboarding con datos demo de ejemplo (que vean la app llena)
- [ ] Página de marketing / landing (puede ser dentro del mismo dominio)
- [ ] Analytics (Plausible / PostHog) para entender uso real
- [ ] Sentry o similar para tracking de errores

---

## 🔒 Seguridad y operación

- [ ] Rate limiting básico (Supabase ya trae algo, revisar)
- [ ] 2FA opcional para usuarias
- [ ] Backups automáticos (Supabase los hace, validar política)
- [ ] Banner de cookies si se vende en EU
- [ ] Plan de respuesta ante incidentes (incluso si es informal)
- [ ] **Service Worker — manejo de actualizaciones**
  - Hoy `registerType: 'autoUpdate'` aplica nuevas versiones silenciosamente, pero el usuario debe refrescar la página para verlas. Si una usuaria reporta que "no le aparece la nueva función", probablemente sea cache del SW.
  - Pendiente: cambiar a `prompt` y mostrar un toast "Hay una nueva versión, recarga" con botón.
  - Pendiente: definir página/estado offline (cuando no hay red y no está en cache).
  - Pendiente: revisar runtime caching para llamadas a Supabase (ahora son `NetworkOnly`).

---

## Convenciones de uso

- Marca con `[x]` cuando algo se complete.
- Mueve items entre secciones si cambia su prioridad.
- Si surge una idea nueva, añádela a la sección "💡 Nice-to-have" para no olvidarla.
