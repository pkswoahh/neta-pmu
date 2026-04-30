-- =============================================================
-- Neta. — Schema de base de datos
-- Ejecutar este archivo completo en el SQL Editor de Supabase.
-- =============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ----------------------------------------
-- Tabla: profiles
-- ----------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  currency text not null default 'COP',
  monthly_goal numeric default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;

create policy "profiles_self_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

-- ----------------------------------------
-- Tabla: user_options
-- ----------------------------------------
create table if not exists public.user_options (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('procedure','payment_method','client_source','expense_category')),
  value text not null,
  "order" int not null default 0
);

create index if not exists user_options_user_idx on public.user_options(user_id);
create index if not exists user_options_user_type_idx on public.user_options(user_id, type);

alter table public.user_options enable row level security;

drop policy if exists "user_options_owner_all" on public.user_options;
create policy "user_options_owner_all" on public.user_options
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------
-- Tabla: procedures
-- ----------------------------------------
create table if not exists public.procedures (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  client_name text not null,
  client_phone text,
  procedure_type text not null,
  amount numeric not null,
  payment_method text not null,
  client_source text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists procedures_user_idx on public.procedures(user_id);
create index if not exists procedures_user_date_idx on public.procedures(user_id, date desc);

alter table public.procedures enable row level security;

drop policy if exists "procedures_owner_all" on public.procedures;
create policy "procedures_owner_all" on public.procedures
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------
-- Tabla: expenses
-- ----------------------------------------
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  description text not null,
  category text not null,
  amount numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_idx on public.expenses(user_id);
create index if not exists expenses_user_date_idx on public.expenses(user_id, date desc);

alter table public.expenses enable row level security;

drop policy if exists "expenses_owner_all" on public.expenses;
create policy "expenses_owner_all" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- Trigger: al crear un usuario en auth.users, sembrar perfil + opciones por defecto
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, currency, monthly_goal)
  values (new.id, 'COP', 0)
  on conflict (id) do nothing;

  -- Procedimientos
  insert into public.user_options (user_id, type, value, "order") values
    (new.id, 'procedure', 'Labios', 0),
    (new.id, 'procedure', 'Cejas', 1),
    (new.id, 'procedure', 'Delineado', 2);

  -- Métodos de pago
  insert into public.user_options (user_id, type, value, "order") values
    (new.id, 'payment_method', 'Efectivo', 0),
    (new.id, 'payment_method', 'Transferencia', 1),
    (new.id, 'payment_method', 'Nequi', 2);

  -- Origen del cliente
  insert into public.user_options (user_id, type, value, "order") values
    (new.id, 'client_source', 'Instagram', 0),
    (new.id, 'client_source', 'Referido', 1),
    (new.id, 'client_source', 'Google', 2),
    (new.id, 'client_source', 'TikTok', 3),
    (new.id, 'client_source', 'Cliente frecuente', 4),
    (new.id, 'client_source', 'Cliente antiguo', 5);

  -- Categorías de gastos
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
