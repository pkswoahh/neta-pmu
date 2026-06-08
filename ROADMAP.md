# Neta. — Roadmap

Checklist viva del producto. Marcamos `[x]` cuando algo se completa.
Última actualización: 2026-06-08 (Agenda/recordatorios · fix teclado iOS — bloqueo de scroll del documento)

## 🗓️ Sesión 2026-06-08 — completado (sin deploy aún, commiteado local)

- [x] **Fix teclado iOS (Chrome + PWA)** — el bottom nav se descolocaba al cerrar el teclado (en Chrome desaparecía y tocaba recargar; en la PWA se subía). Causa: dependíamos de detectar el teclado por foco (que en Chrome no dispara al usar "esconder teclado") + scroll residual del documento. Solución de fondo: clase `body.app-shell-lock` bloquea el scroll del documento mientras la app está montada (el único scroll vive en `<main>`); se eliminó la detección por foco. `AppLayout.tsx` + `globals.css`.
- [x] **Agenda / recordatorios de citas** — ver Nice-to-have (migración 011, pestaña, ciclo agendar→atender→registrar, tarjeta en Dashboard).
- [x] **Recordatorio por WhatsApp** — botón verde en el detalle de la cita que abre wa.me con plantilla cálida ya armada (nombre, procedimiento, fecha legible, hora, negocio). Normaliza el celular anteponiendo el código de país del perfil (`src/lib/whatsapp.ts`). Reduce no-shows.

## 🗓️ Sesión 2026-06-07 — completado

- [x] Polling post-pago 10s → ~48s con intervalos crecientes
- [x] Datos de ejemplo opt-in/reversible (`is_demo`, migración 010) + banner global
- [x] Gráfico de tendencia de ingresos (6 meses) en Dashboard
- [x] 6 ajustes internos: Google pide código en modal · quitado botón flotante WhatsApp · Guardar dentro de "Mi negocio" y centrado · aviso al cambiar moneda · subtítulo procedimientos · autocomplete off en campos
- [x] Fix constelaciones en Safari (movimiento por tiempo + resize no reconstruye por barra de URL)
- [x] Colores en lista de Procedimientos (monto verde, tipo rosado)
- [x] Tarjeta de detalle al tocar un procedimiento (`ProcedureDetailModal`)
- [x] Filtro de periodo Hoy/Semana/Mes/Rango en Procedimientos y Gastos (`PeriodSelector`) + buscador alineado al Select
- [x] Campo de nombre inteligente con autocompletar de clientes (`ClientNameInput`) — mide nuevo/frecuente por consistencia de nombres

## 🗓️ Sesión 2026-06-07 (cont.) — completado

- [x] **Rangos de fecha en el Dashboard** — `PeriodSelector` (Hoy/Semana/Mes/Rango) reemplaza al selector de mes. Comparación "vs periodo anterior" equivalente (`previousPeriodRange`/`previousPeriodLabel`): hoy→ayer, semana→semana pasada, rango N días→N días previos, mes→mes pasado. Meta mensual oculta fuera de "Mes". Gráfico de tendencia de 6 meses intacto; resalta barra solo en vista de Mes.
- [x] **Totales en Procedimientos y Gastos** — barra de resumen con conteo + total del periodo, refleja lo filtrado y absorbe el contador "N de M" + limpiar filtros.
- [x] **Fix safe-area en PWA standalone** — header mobile del AppLayout y nav de la Landing respetan `env(safe-area-inset-top)`; ya no quedan tapados bajo el Dynamic Island en iPhone.
- [x] **Estado offline** — `OfflineBanner` global: "Sin conexión a internet" mientras dure, "Conexión restablecida" al volver. (Ver sección Seguridad.)


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
- [x] **Confirmación de email en producción** — ✅ 2026-06-07. Toggle ON + template con marca + SMTP Resend. Probado end-to-end.
- [x] **Pasarela de pago (Lemon Squeezy) — Test mode completo** — ✅ cuenta aprobada · productos Test mode ($12/$108) · Migración 008 · Edge Functions desplegadas · `/suscribirse` con toggle · test mensual y anual end-to-end · `/mi-suscripcion` con info de plan · botón "Gestionar suscripción" abre portal de Lemon · loader + polling 10s post-pago · portal de cancelación validado · gating con trial vencido validado. **Próximo:** pasar a Live mode cuando haya primera clienta.
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

- [x] ~~Agenda / recordatorios de citas próximas~~ — **2026-06-08.** Tabla `appointments` (migración 011) + RLS owner_all. Pestaña "Agenda" (2ª en el nav). Lista agrupada Atrasadas/Hoy/Mañana/Próximas/Historial. Cierra el ciclo: botón "Registrar atención" abre el `ProcedureForm` prellenado y marca la cita `done` enlazándola al procedimiento. Recordatorio in-app vía tarjeta "Próximas citas" en el Dashboard (sin push). `ProcedureForm` extraído a `src/components/ProcedureForm.tsx` para reusarlo.
- [ ] Notificaciones push al alcanzar la meta
- [x] ~~Gráfico de tendencia mensual de ingresos~~ — **quitado 2026-06-08** por feedback de Roberto: confundía (anclado a 6 meses fijos, no reaccionaba al periodo) y aportaba poco frente a las tarjetas "vs periodo anterior". Dashboard más limpio.
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
- [x] **Onboarding con datos demo de ejemplo** (que vean la app llena) — opt-in y reversible. Botón "Explorar con datos de ejemplo" en el dashboard vacío siembra ~11 procedimientos + 7 gastos (marcados `is_demo`, montos escalados a la moneda). Banner global "Estás viendo datos de ejemplo · Empezar de cero" borra solo lo demo. Requiere correr migración 010.
- [x] **Dashboard vacío cálido** — cuando la cuenta no tiene ni procs ni gastos, se reemplaza el dashboard por bienvenida con CTA "Registrar mi primer cliente"
- [x] **Botón flotante de soporte WhatsApp** — en AppLayout, abre wa.me con mensaje pre-armado que incluye la pantalla actual. Reduce fricción para feedback de beta testers.
- [x] **Página de marketing / landing** — pública en `/`, app interna en `/dashboard`. Mockup inline del Dashboard, FAQ, dolores, beneficios, prueba social, animaciones al scroll.
- [x] **Beta cerrada con código de invitación** — migración 004, RPC `validate_invitation_code` y `redeem_invitation_code`, pestaña `/admin/codigos` con CRUD. Signup pide código. Google OAuth también exige código en modo signup.
- [x] **Trial 30 días** — migración 007, extendido de 14 a 30 días.
- [x] **Email recuperar contraseña** — template personalizado con marca Neta. configurado en Supabase.
- [x] **Bottom nav mobile fijo** — reemplazado position fixed por flex column (fix iOS Safari).
- [ ] Analytics (Plausible / PostHog) para entender uso real
- [ ] Sentry o similar para tracking de errores
- [x] **SMTP personalizado (Resend)** — ✅ 2026-06-07. Dominio verificado, SMTP en Supabase, correos salen desde hola@netapmu.com y llegan a Recibidos. Ver `docs/DEPLOY.md`.
- [x] **"Confirm email" ACTIVO (Fase 2)** — ✅ 2026-06-07. Template `docs/email-templates/confirm-signup.html` pegado, toggle ON, probado end-to-end (registro → correo a Recibidos → confirmar → onboarding).
- [x] **Subir polling post-pago** de 10s a ~48s con intervalos crecientes (13 reintentos espaciados 1s→7s en `MiSuscripcion.tsx`). Cubre el caso del webhook de Lemon que tardó 50s y evita el banner amber prematuro.

---

## 🔒 Seguridad y operación

- [ ] Rate limiting básico (Supabase ya trae algo, revisar)
- [ ] 2FA opcional para usuarias
- [ ] Backups automáticos (Supabase los hace, validar política)
- [ ] Banner de cookies si se vende en EU
- [ ] Plan de respuesta ante incidentes (incluso si es informal)
- [ ] **Service Worker — manejo de actualizaciones**
  - [x] ~~Cambiar `registerType` a `prompt` y mostrar banner persistente con botón "Actualizar ahora"~~ (componente `UpdatePrompt`)
  - [x] ~~Definir página/estado offline~~ — `OfflineBanner` global avisa "Sin conexión" / "Conexión restablecida". (El shell ya está precacheado, así que la app abre offline; lo que faltaba era el aviso porque Supabase es NetworkOnly.)
  - [ ] Revisar runtime caching para llamadas a Supabase (ahora son `NetworkOnly`).

---

## Convenciones de uso

- Marca con `[x]` cuando algo se complete.
- Mueve items entre secciones si cambia su prioridad.
- Si surge una idea nueva, añádela a la sección "💡 Nice-to-have" para no olvidarla.
