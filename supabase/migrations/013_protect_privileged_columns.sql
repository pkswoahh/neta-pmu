-- =============================================================
-- Neta. — Candado de columnas privilegiadas en profiles
--
-- PROBLEMA (hallazgo de seguridad): la política RLS
-- "profiles_self_update" permite a cada usuaria editar su propia
-- fila, pero no restringe QUÉ columnas. Una usuaria con
-- conocimientos técnicos podía mandar un UPDATE directo a la API
-- y ponerse role='admin' (ver datos de todas) o
-- subscription_status='comped' / extender trial_ends_at (no pagar).
--
-- SOLUCIÓN: trigger BEFORE UPDATE que rechaza cambios a las
-- columnas privilegiadas salvo que vengan del backend:
--   · Las RPCs admin (admin_suspend_user, admin_extend_trial, etc.),
--     apply_lemon_event y redeem_invitation_code son SECURITY DEFINER
--     con dueño postgres → dentro de ellas current_user = 'postgres'
--     → el trigger las deja pasar.
--   · El webhook de Lemon usa service_role → pasa.
--   · El SQL Editor corre como postgres → pasa.
--   · Un UPDATE directo vía API (PostgREST) corre como
--     'authenticated' → si toca columnas privilegiadas, se rechaza.
--
-- La app solo edita business_name, currency, monthly_goal, country
-- y reminder_template vía update directo (ProfileContext) — ninguna
-- está bloqueada, así que nada se rompe.
--
-- IMPORTANTE: la función del trigger NO es security definer a
-- propósito: necesita ver el current_user real del que llama.
--
-- Idempotente. Correr en SQL Editor de Supabase una sola vez.
-- =============================================================

create or replace function public.protect_privileged_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Contextos de backend: RPCs security definer (postgres),
  -- service_role (webhook), supabase_admin (dashboard/SQL editor).
  if current_user in ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin') then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.subscription_status is distinct from old.subscription_status
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.current_period_end is distinct from old.current_period_end
     or new.canceled_at is distinct from old.canceled_at
     or new.comped_until is distinct from old.comped_until
     or new.suspended_at is distinct from old.suspended_at
     or new.suspended_reason is distinct from old.suspended_reason
     or new.lemon_customer_id is distinct from old.lemon_customer_id
     or new.lemon_subscription_id is distinct from old.lemon_subscription_id
     or new.billing_plan is distinct from old.billing_plan
     or new.invitation_code_used is distinct from old.invitation_code_used
     or new.created_at is distinct from old.created_at
     or new.id is distinct from old.id
  then
    raise exception 'No puedes modificar campos de suscripción o rol.'
      using errcode = '42501'; -- insufficient_privilege
  end if;

  return new;
end;
$$;

drop trigger if exists protect_privileged_profile_columns on public.profiles;
create trigger protect_privileged_profile_columns
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_columns();
