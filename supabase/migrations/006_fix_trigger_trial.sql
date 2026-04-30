-- =============================================================
-- Neta. — Corrige handle_new_user: restaura trial_ends_at +
--         agrega Cliente frecuente / Cliente antiguo
-- Idempotente. Correr en SQL Editor de Supabase una sola vez.
-- =============================================================

-- 1. Trigger correcto con todo incluido

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

-- 2. Reparar usuarias que quedaron sin trial_ends_at por el bug de migración 005

update public.profiles
set
  trial_ends_at = now() + interval '14 days',
  subscription_status = 'trial'
where trial_ends_at is null
  and subscription_status = 'trial';
