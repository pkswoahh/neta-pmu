-- =============================================================
-- Neta. — Módulo administrador (sesión 1)
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Es idempotente: se puede correr varias veces sin romper nada.
-- =============================================================

-- ----------------------------------------
-- Columnas nuevas en profiles
-- ----------------------------------------

alter table public.profiles add column if not exists role text not null default 'user'
  check (role in ('user', 'admin', 'support'));

alter table public.profiles add column if not exists subscription_status text not null default 'trial'
  check (subscription_status in ('trial', 'active', 'past_due', 'canceled', 'expired', 'comped', 'suspended'));

alter table public.profiles add column if not exists trial_ends_at timestamptz;
alter table public.profiles add column if not exists current_period_end timestamptz;
alter table public.profiles add column if not exists canceled_at timestamptz;
alter table public.profiles add column if not exists comped_until timestamptz;
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspended_reason text;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists country text;

-- A las cuentas existentes que aún no tienen trial_ends_at les damos 14 días desde ahora.
update public.profiles
  set trial_ends_at = now() + interval '14 days'
  where trial_ends_at is null;

-- A las cuentas existentes les marcamos last_seen_at para que no aparezcan como "nunca usaron".
update public.profiles
  set last_seen_at = now()
  where last_seen_at is null;

-- ----------------------------------------
-- Hacer admin a Roberto
-- ----------------------------------------

update public.profiles
  set role = 'admin'
  where id in (select id from auth.users where email = 'robertocpks24@gmail.com');

-- ----------------------------------------
-- Tabla: admin_audit_log
-- ----------------------------------------

create table if not exists public.admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references auth.users(id) on delete restrict,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_admin_idx on public.admin_audit_log(admin_id);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log(target_user_id);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);

alter table public.admin_audit_log enable row level security;

-- ----------------------------------------
-- Función helper: ¿es admin el usuario actual?
-- ----------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'support')
  );
$$;

-- ----------------------------------------
-- RLS — profiles: admin puede leer y actualizar todas
-- ----------------------------------------

drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_admin_select" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin());

-- ----------------------------------------
-- RLS — admin_audit_log: solo admins pueden leer/insertar
-- ----------------------------------------

drop policy if exists "audit_log_admin_select" on public.admin_audit_log;
drop policy if exists "audit_log_admin_insert" on public.admin_audit_log;

create policy "audit_log_admin_select" on public.admin_audit_log
  for select using (public.is_admin());
create policy "audit_log_admin_insert" on public.admin_audit_log
  for insert with check (public.is_admin() and admin_id = auth.uid());

-- ----------------------------------------
-- RLS — admin puede leer todos los procedures y expenses (read-only desde admin)
-- ----------------------------------------

drop policy if exists "procedures_admin_select" on public.procedures;
drop policy if exists "expenses_admin_select" on public.expenses;
drop policy if exists "user_options_admin_select" on public.user_options;

create policy "procedures_admin_select" on public.procedures
  for select using (public.is_admin());
create policy "expenses_admin_select" on public.expenses
  for select using (public.is_admin());
create policy "user_options_admin_select" on public.user_options
  for select using (public.is_admin());

-- ----------------------------------------
-- Función: actualizar last_seen del usuario actual
-- (la app la llama una vez por sesión)
-- ----------------------------------------

create or replace function public.update_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

grant execute on function public.update_last_seen() to authenticated;

-- ----------------------------------------
-- Función: agregados para el panel admin (un solo viaje a la DB)
-- ----------------------------------------

create or replace function public.admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'active_30d', (select count(*) from public.profiles where last_seen_at > now() - interval '30 days'),
    'trials', (select count(*) from public.profiles where subscription_status = 'trial'),
    'paying', (select count(*) from public.profiles where subscription_status in ('active', 'past_due')),
    'comped', (select count(*) from public.profiles where subscription_status = 'comped'),
    'suspended', (select count(*) from public.profiles where subscription_status = 'suspended'),
    'expired', (select count(*) from public.profiles where subscription_status = 'expired'
      or (subscription_status = 'trial' and trial_ends_at < now())),
    'signups_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'signups_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
    'trial_ending_soon', (select count(*) from public.profiles where subscription_status = 'trial'
      and trial_ends_at between now() and now() + interval '2 days'),
    'inactive_30d', (select count(*) from public.profiles where last_seen_at < now() - interval '30 days'
      and subscription_status not in ('expired', 'suspended'))
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_overview() to authenticated;

-- ----------------------------------------
-- Función: signups por día (últimos 30 días) para gráfico
-- ----------------------------------------

create or replace function public.admin_signups_daily()
returns table(day date, count bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
    select d::date as day, coalesce(c.cnt, 0)::bigint as count
    from generate_series(now()::date - interval '29 days', now()::date, interval '1 day') d
    left join (
      select created_at::date as day, count(*)::bigint as cnt
      from public.profiles
      where created_at > now() - interval '30 days'
      group by created_at::date
    ) c on c.day = d::date
    order by d;
end;
$$;

grant execute on function public.admin_signups_daily() to authenticated;

-- ----------------------------------------
-- Trigger handle_new_user actualizado: trial automático + last_seen
-- ----------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, currency, monthly_goal, trial_ends_at, last_seen_at, subscription_status)
  values (new.id, 'COP', 0, now() + interval '14 days', now(), 'trial')
  on conflict (id) do nothing;

  insert into public.user_options (user_id, type, value, "order") values
    (new.id, 'procedure', 'Labios', 0),
    (new.id, 'procedure', 'Cejas', 1),
    (new.id, 'procedure', 'Delineado', 2);

  insert into public.user_options (user_id, type, value, "order") values
    (new.id, 'payment_method', 'Efectivo', 0),
    (new.id, 'payment_method', 'Transferencia', 1),
    (new.id, 'payment_method', 'Nequi', 2);

  insert into public.user_options (user_id, type, value, "order") values
    (new.id, 'client_source', 'Instagram', 0),
    (new.id, 'client_source', 'Referido', 1),
    (new.id, 'client_source', 'Google', 2),
    (new.id, 'client_source', 'TikTok', 3);

  insert into public.user_options (user_id, type, value, "order") values
    (new.id, 'expense_category', 'Insumos', 0),
    (new.id, 'expense_category', 'Arriendo', 1),
    (new.id, 'expense_category', 'Marketing', 2),
    (new.id, 'expense_category', 'Cursos', 3),
    (new.id, 'expense_category', 'Transporte', 4),
    (new.id, 'expense_category', 'Otros', 5);

  return new;
end;
$$;
