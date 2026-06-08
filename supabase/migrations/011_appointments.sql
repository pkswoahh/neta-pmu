-- =============================================================
-- Neta. — Agenda / recordatorios de citas
--
-- Cierra el ciclo agendar → atender → registrar:
--   1. La usuaria agenda una cita (status 'scheduled').
--   2. La app le recuerda in-app (tarjeta "Próximas citas" + pestaña Agenda).
--   3. Al atenderla, "Registrar" abre el formulario de procedimiento
--      prellenado; al guardar, la cita pasa a 'done' y se enlaza al
--      procedimiento creado vía `procedure_id`.
--
-- Sin push (eso es otro item del roadmap). Recordatorio solo in-app.
--
-- RLS: misma política `owner_all` que procedures/expenses.
-- Idempotente: `if not exists` / `drop policy if exists ... create policy`.
-- =============================================================

create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_phone text,
  procedure_type text,                -- lo que se planea hacer (opcional)
  date date not null,
  time time,                          -- hora de la cita (opcional)
  notes text,
  status text not null default 'scheduled',  -- 'scheduled' | 'done' | 'canceled'
  procedure_id uuid references public.procedures(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists appointments_user_date_idx on public.appointments(user_id, date);

alter table public.appointments enable row level security;

drop policy if exists "appointments_owner_all" on public.appointments;
create policy "appointments_owner_all" on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
