-- =============================================================
-- Neta. — Fix: redención atómica del código de invitación
--
-- Antes: el frontend llamaba `redeem_invitation_code` después del
-- signUp. Si el RPC fallaba silenciosamente (race condition con la
-- propagación de la sesión) o si la usuaria cerraba la pestaña, el
-- código no se decrementaba y podía reusarse.
--
-- Ahora: el cliente pasa `invitation_code` en `raw_user_meta_data`
-- y el trigger `handle_new_user` decrementa el código en la misma
-- transacción que crea el profile. Imposible que se pierda.
--
-- Idempotente. Correr en SQL Editor de Supabase una sola vez.
-- =============================================================

-- 1. Trigger nuevo: consume el código si viene en la metadata del signUp.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_code text;
  matched_code text;
begin
  meta_code := nullif(trim(new.raw_user_meta_data->>'invitation_code'), '');

  -- Decrementar el código atómicamente si vino en la metadata.
  -- Si el código no existe, está inactivo, vencido o agotado, simplemente
  -- no se decrementa nada y matched_code queda null. La cuenta se crea
  -- igual (no queremos hacer fallar el signUp desde un trigger).
  -- La validación del frontend (validate_invitation_code) filtra el 99%.
  if meta_code is not null then
    update public.invitation_codes
       set used_count = used_count + 1
     where lower(code) = lower(meta_code)
       and active = true
       and (expires_at is null or expires_at > now())
       and used_count < max_uses
     returning code into matched_code;
  end if;

  insert into public.profiles (
    id, currency, monthly_goal, trial_ends_at, last_seen_at,
    subscription_status, invitation_code_used
  )
  values (
    new.id, 'COP', 0, now() + interval '30 days', now(),
    'trial', matched_code
  )
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
    (new.id, 'client_source', 'TikTok', 3),
    (new.id, 'client_source', 'Cliente frecuente', 4),
    (new.id, 'client_source', 'Cliente antiguo', 5);

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

-- 2. redeem_invitation_code: hacerla idempotente.
--    Sigue siendo el fallback para el flujo Google OAuth (donde no se
--    puede pasar metadata en el primer signIn). Si el profile ya tiene
--    invitation_code_used, devuelve ok=true sin doble-decrementar.

create or replace function public.redeem_invitation_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.invitation_codes%rowtype;
  uid uuid;
  current_used text;
begin
  uid := auth.uid();
  if uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;

  -- Si el profile ya tiene un código registrado, no decrementamos otra vez.
  select invitation_code_used into current_used
    from public.profiles where id = uid;

  if current_used is not null then
    return jsonb_build_object('ok', true, 'code', current_used, 'already', true);
  end if;

  select * into rec from public.invitation_codes
    where lower(code) = lower(trim(p_code))
    for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not rec.active then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;

  if rec.expires_at is not null and rec.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if rec.used_count >= rec.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'exhausted');
  end if;

  update public.invitation_codes
    set used_count = used_count + 1
    where id = rec.id;

  update public.profiles
    set invitation_code_used = rec.code
    where id = uid;

  return jsonb_build_object('ok', true, 'code', rec.code);
end;
$$;

grant execute on function public.redeem_invitation_code(text) to authenticated;
