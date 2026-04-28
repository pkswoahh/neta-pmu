-- =============================================================
-- Neta. — Módulo administrador (sesión 2: acciones y RPCs)
-- Idempotente. Correr en SQL Editor de Supabase una sola vez.
-- =============================================================

-- ----------------------------------------
-- RPC: lista de usuarias con email (solo admin)
-- ----------------------------------------

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  business_name text,
  currency text,
  monthly_goal numeric,
  created_at timestamptz,
  role text,
  subscription_status text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  comped_until timestamptz,
  suspended_at timestamptz,
  suspended_reason text,
  last_seen_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  country text
)
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
    select
      p.id,
      u.email::text,
      p.business_name,
      p.currency,
      p.monthly_goal,
      p.created_at,
      p.role,
      p.subscription_status,
      p.trial_ends_at,
      p.current_period_end,
      p.canceled_at,
      p.comped_until,
      p.suspended_at,
      p.suspended_reason,
      p.last_seen_at,
      p.stripe_customer_id,
      p.stripe_subscription_id,
      p.country
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;

-- ----------------------------------------
-- RPC: detalle de una usuaria + stats (solo admin)
-- ----------------------------------------

create or replace function public.admin_user_detail(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  profile_data jsonb;
  stats jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'id', p.id,
    'email', u.email,
    'business_name', p.business_name,
    'currency', p.currency,
    'monthly_goal', p.monthly_goal,
    'created_at', p.created_at,
    'role', p.role,
    'subscription_status', p.subscription_status,
    'trial_ends_at', p.trial_ends_at,
    'current_period_end', p.current_period_end,
    'canceled_at', p.canceled_at,
    'comped_until', p.comped_until,
    'suspended_at', p.suspended_at,
    'suspended_reason', p.suspended_reason,
    'last_seen_at', p.last_seen_at,
    'country', p.country,
    'stripe_customer_id', p.stripe_customer_id,
    'stripe_subscription_id', p.stripe_subscription_id
  )
  into profile_data
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = target;

  if profile_data is null then
    raise exception 'user_not_found';
  end if;

  select jsonb_build_object(
    'total_procedures', (select count(*) from public.procedures where user_id = target),
    'total_expenses', (select count(*) from public.expenses where user_id = target),
    'income_last_30d', coalesce((
      select sum(amount) from public.procedures
      where user_id = target and date > current_date - interval '30 days'
    ), 0),
    'expenses_last_30d', coalesce((
      select sum(amount) from public.expenses
      where user_id = target and date > current_date - interval '30 days'
    ), 0),
    'income_total', coalesce((select sum(amount) from public.procedures where user_id = target), 0),
    'last_procedure', (select max(date) from public.procedures where user_id = target),
    'first_procedure', (select min(date) from public.procedures where user_id = target),
    'unique_clients', (select count(distinct lower(trim(client_name))) from public.procedures where user_id = target)
  )
  into stats;

  return jsonb_build_object('profile', profile_data, 'stats', stats);
end;
$$;

grant execute on function public.admin_user_detail(uuid) to authenticated;

-- ----------------------------------------
-- RPC: audit log con nombres resueltos (solo admin)
-- ----------------------------------------

create or replace function public.admin_audit_log_recent(limit_n int default 100)
returns table (
  id uuid,
  admin_id uuid,
  admin_email text,
  admin_name text,
  target_user_id uuid,
  target_name text,
  action text,
  details jsonb,
  reason text,
  created_at timestamptz
)
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
    select
      a.id,
      a.admin_id,
      au.email::text as admin_email,
      ap.business_name as admin_name,
      a.target_user_id,
      tp.business_name as target_name,
      a.action,
      a.details,
      a.reason,
      a.created_at
    from public.admin_audit_log a
    left join public.profiles ap on ap.id = a.admin_id
    left join auth.users au on au.id = a.admin_id
    left join public.profiles tp on tp.id = a.target_user_id
    order by a.created_at desc
    limit limit_n;
end;
$$;

grant execute on function public.admin_audit_log_recent(int) to authenticated;

-- ----------------------------------------
-- ACCIONES — todas escriben al audit log en la misma transacción
-- ----------------------------------------

-- Suspender (razón obligatoria)
create or replace function public.admin_suspend_user(target uuid, reason_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if reason_text is null or trim(reason_text) = '' then
    raise exception 'reason_required';
  end if;

  update public.profiles
    set subscription_status = 'suspended',
        suspended_at = now(),
        suspended_reason = reason_text
    where id = target;

  insert into public.admin_audit_log (admin_id, target_user_id, action, reason, details)
    values (auth.uid(), target, 'suspend', reason_text, jsonb_build_object());
end;
$$;
grant execute on function public.admin_suspend_user(uuid, text) to authenticated;

-- Reactivar (devuelve estado lógico según fechas)
create or replace function public.admin_unsuspend_user(target uuid, reason_text text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_status text;
  trial_ends timestamptz;
  period_ends timestamptz;
  comp_until timestamptz;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select trial_ends_at, current_period_end, comped_until
    into trial_ends, period_ends, comp_until
    from public.profiles where id = target;

  if comp_until is not null and comp_until > now() then
    new_status := 'comped';
  elsif period_ends is not null and period_ends > now() then
    new_status := 'active';
  elsif trial_ends is not null and trial_ends > now() then
    new_status := 'trial';
  else
    new_status := 'expired';
  end if;

  update public.profiles
    set subscription_status = new_status,
        suspended_at = null,
        suspended_reason = null
    where id = target;

  insert into public.admin_audit_log (admin_id, target_user_id, action, reason, details)
    values (auth.uid(), target, 'unsuspend', reason_text, jsonb_build_object('new_status', new_status));

  return new_status;
end;
$$;
grant execute on function public.admin_unsuspend_user(uuid, text) to authenticated;

-- Otorgar cortesía (until_date null = comp permanente)
create or replace function public.admin_comp_user(target uuid, until_date timestamptz default null, reason_text text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.profiles
    set subscription_status = 'comped',
        comped_until = until_date,
        suspended_at = null,
        suspended_reason = null
    where id = target;

  insert into public.admin_audit_log (admin_id, target_user_id, action, reason, details)
    values (auth.uid(), target, 'comp', reason_text, jsonb_build_object('until', until_date));
end;
$$;
grant execute on function public.admin_comp_user(uuid, timestamptz, text) to authenticated;

-- Quitar cortesía (vuelve al estado lógico)
create or replace function public.admin_remove_comp(target uuid, reason_text text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_status text;
  trial_ends timestamptz;
  period_ends timestamptz;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select trial_ends_at, current_period_end into trial_ends, period_ends
    from public.profiles where id = target;

  if period_ends is not null and period_ends > now() then
    new_status := 'active';
  elsif trial_ends is not null and trial_ends > now() then
    new_status := 'trial';
  else
    new_status := 'expired';
  end if;

  update public.profiles
    set subscription_status = new_status,
        comped_until = null
    where id = target;

  insert into public.admin_audit_log (admin_id, target_user_id, action, reason, details)
    values (auth.uid(), target, 'remove_comp', reason_text, jsonb_build_object('new_status', new_status));

  return new_status;
end;
$$;
grant execute on function public.admin_remove_comp(uuid, text) to authenticated;

-- Extender trial N días
create or replace function public.admin_extend_trial(target uuid, days_to_add int, reason_text text default null)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  current_trial timestamptz;
  new_trial timestamptz;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if days_to_add is null or days_to_add <= 0 then
    raise exception 'days_must_be_positive';
  end if;

  select trial_ends_at into current_trial from public.profiles where id = target;

  -- Si trial ya venció, empieza desde ahora; si está vigente, suma desde ahí
  new_trial := greatest(coalesce(current_trial, now()), now()) + (days_to_add || ' days')::interval;

  update public.profiles
    set subscription_status = 'trial',
        trial_ends_at = new_trial,
        suspended_at = null,
        suspended_reason = null
    where id = target;

  insert into public.admin_audit_log (admin_id, target_user_id, action, reason, details)
    values (auth.uid(), target, 'extend_trial', reason_text,
            jsonb_build_object('days_added', days_to_add, 'new_trial_ends_at', new_trial));

  return new_trial;
end;
$$;
grant execute on function public.admin_extend_trial(uuid, int, text) to authenticated;

-- Ascender/cambiar rol (solo admin master puede tocar roles de otros)
create or replace function public.admin_set_role(target uuid, new_role text, reason_text text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if new_role not in ('user', 'admin', 'support') then
    raise exception 'invalid_role';
  end if;
  if target = auth.uid() then
    raise exception 'cannot_change_own_role';
  end if;

  update public.profiles set role = new_role where id = target;

  insert into public.admin_audit_log (admin_id, target_user_id, action, reason, details)
    values (auth.uid(), target, 'set_role', reason_text, jsonb_build_object('new_role', new_role));
end;
$$;
grant execute on function public.admin_set_role(uuid, text, text) to authenticated;
