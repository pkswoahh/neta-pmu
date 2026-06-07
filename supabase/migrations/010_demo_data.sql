-- =============================================================
-- Neta. — Datos de ejemplo (modo demo)
--
-- Agrega la bandera `is_demo` a procedures y expenses para que la
-- usuaria pueda "Explorar con datos de ejemplo" desde el dashboard
-- vacío y luego borrarlos de un clic sin tocar sus datos reales.
--
-- El borrado quirúrgico se hace en el frontend con:
--   delete ... where user_id = auth.uid() and is_demo = true
--
-- No requiere políticas nuevas: la política `*_owner_all` ya cubre
-- insert/delete sobre las filas propias.
--
-- Idempotente: `add column if not exists`.
-- =============================================================

alter table public.procedures
  add column if not exists is_demo boolean not null default false;

alter table public.expenses
  add column if not exists is_demo boolean not null default false;
