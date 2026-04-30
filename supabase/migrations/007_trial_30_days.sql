-- =============================================================
-- Neta. — Cambiar trial de 14 a 30 días
-- Idempotente. Correr en SQL Editor de Supabase una sola vez.
-- =============================================================

-- 1. Actualizar el trigger para nuevas usuarias

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, currency, monthly_goal, trial_ends_at, last_seen_at, subscription_status)
  values (new.id, 'COP', 0, now() + interval '30 days', now(), 'trial')
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

-- 2. Extender a 30 días las usuarias que aún están en trial activo

update public.profiles
set trial_ends_at = created_at + interval '30 days'
where subscription_status = 'trial'
  and trial_ends_at > now();
