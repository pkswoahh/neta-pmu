-- =============================================================
-- Neta. — Integración Lemon Squeezy
-- Idempotente. Correr en SQL Editor de Supabase una sola vez.
-- =============================================================

-- ----------------------------------------
-- 1. Renombrar columnas stripe → lemon
-- ----------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'stripe_customer_id'
  ) then
    alter table public.profiles rename column stripe_customer_id to lemon_customer_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'stripe_subscription_id'
  ) then
    alter table public.profiles rename column stripe_subscription_id to lemon_subscription_id;
  end if;
end $$;

-- ----------------------------------------
-- 2. Agregar billing_plan
-- ----------------------------------------

alter table public.profiles
  add column if not exists billing_plan text
  check (billing_plan is null or billing_plan in ('monthly', 'annual'));

-- ----------------------------------------
-- 3. Recrear RPCs admin con los nuevos nombres de columna
--    (necesario porque los signatures cambian)
-- ----------------------------------------

drop function if exists public.admin_list_users();

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
  lemon_customer_id text,
  lemon_subscription_id text,
  billing_plan text,
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
      p.lemon_customer_id,
      p.lemon_subscription_id,
      p.billing_plan,
      p.country
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;

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
    'lemon_customer_id', p.lemon_customer_id,
    'lemon_subscription_id', p.lemon_subscription_id,
    'billing_plan', p.billing_plan
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
-- 4. RPC interna para webhook: aplicar evento de Lemon Squeezy
--    Llamada desde Edge Function con service_role.
--    No expuesta a usuarias.
-- ----------------------------------------

create or replace function public.apply_lemon_event(
  target_user_id uuid,
  event_name text,
  customer_id text,
  subscription_id text,
  plan text,
  period_end timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    raise exception 'user_id_required';
  end if;

  if event_name = 'subscription_created' or event_name = 'subscription_resumed' then
    update public.profiles
      set subscription_status = 'active',
          lemon_customer_id = coalesce(customer_id, lemon_customer_id),
          lemon_subscription_id = coalesce(subscription_id, lemon_subscription_id),
          billing_plan = coalesce(plan, billing_plan),
          current_period_end = coalesce(period_end, current_period_end),
          canceled_at = null
      where id = target_user_id;

  elsif event_name = 'subscription_payment_success' then
    update public.profiles
      set subscription_status = case
            when subscription_status in ('past_due', 'expired', 'canceled') then 'active'
            else subscription_status
          end,
          current_period_end = coalesce(period_end, current_period_end)
      where id = target_user_id;

  elsif event_name = 'subscription_payment_failed' then
    update public.profiles
      set subscription_status = 'past_due'
      where id = target_user_id
        and subscription_status not in ('suspended', 'comped');

  elsif event_name = 'subscription_cancelled' then
    update public.profiles
      set subscription_status = 'canceled',
          canceled_at = now()
      where id = target_user_id
        and subscription_status not in ('suspended', 'comped');

  elsif event_name = 'subscription_updated' then
    update public.profiles
      set billing_plan = coalesce(plan, billing_plan),
          current_period_end = coalesce(period_end, current_period_end)
      where id = target_user_id;

  elsif event_name = 'subscription_expired' then
    update public.profiles
      set subscription_status = 'expired'
      where id = target_user_id
        and subscription_status not in ('suspended', 'comped');
  end if;
end;
$$;

-- Sólo el service_role la usa (Edge Function). No exponer a authenticated.
revoke all on function public.apply_lemon_event(uuid, text, text, text, text, timestamptz) from public;
revoke all on function public.apply_lemon_event(uuid, text, text, text, text, timestamptz) from authenticated;
revoke all on function public.apply_lemon_event(uuid, text, text, text, text, timestamptz) from anon;
grant execute on function public.apply_lemon_event(uuid, text, text, text, text, timestamptz) to service_role;
