-- =============================================================
-- Neta. — Plantilla de recordatorio de WhatsApp editable
--
-- Permite a la usuaria personalizar el mensaje que se manda al recordar una
-- cita por WhatsApp, desde Configuración. Usa placeholders:
--   {nombre} {procedimiento} {fecha} {hora} {negocio}
--
-- null = usar la plantilla por defecto de la app.
-- No requiere políticas nuevas (profiles_self_update ya cubre el update).
-- Idempotente: `add column if not exists`.
-- =============================================================

alter table public.profiles
  add column if not exists reminder_template text;
