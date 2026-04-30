-- =============================================================
-- Neta. — Códigos de invitación (beta cerrada)
-- Idempotente. Correr en SQL Editor de Supabase una sola vez.
-- =============================================================

-- ----------------------------------------
-- Tabla: invitation_codes
-- ----------------------------------------

create table if not exists public.invitation_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  max_uses int not null default 20,
  used_count int not null default 0,
  expires_at timestamptz,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists invitation_codes_code_idx on public.invitation_codes(lower(code));

alter table public.invitation_codes enable row level security;

-- Solo admin puede ver/editar la tabla. La validación pública usa RPC con security definer.
drop policy if exists "invitation_codes_admin_all" on public.invitation_codes;
create policy "invitation_codes_admin_all" on public.invitation_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------
-- Campo en profiles para trazar qué código usó cada usuaria
-- ----------------------------------------

alter table public.profiles add column if not exists invitation_code_used text;

-- ----------------------------------------
-- RPC público: validar código (lo llama el signup antes de crear cuenta)
-- ----------------------------------------

create or replace function public.validate_invitation_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  rec public.invitation_codes%rowtype;
begin
  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('valid', false, 'reason', 'empty');
  end if;

  select * into rec from public.invitation_codes
    where lower(code) = lower(trim(p_code));

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  if not rec.active then
    return jsonb_build_object('valid', false, 'reason', 'inactive');
  end if;

  if rec.expires_at is not null and rec.expires_at < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;

  if rec.used_count >= rec.max_uses then
    return jsonb_build_object('valid', false, 'reason', 'exhausted');
  end if;

  return jsonb_build_object(
    'valid', true,
    'remaining', rec.max_uses - rec.used_count
  );
end;
$$;

grant execute on function public.validate_invitation_code(text) to anon, authenticated;

-- ----------------------------------------
-- RPC autenticado: redimir código (lo llama el cliente justo después del signUp)
-- ----------------------------------------

create or replace function public.redeem_invitation_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.invitation_codes%rowtype;
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('ok', false, 'reason', 'empty');
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

-- ----------------------------------------
-- RPC admin: listar todos los códigos con uso actual
-- ----------------------------------------

create or replace function public.admin_list_invitation_codes()
returns table (
  id uuid,
  code text,
  max_uses int,
  used_count int,
  expires_at timestamptz,
  notes text,
  active boolean,
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
    select c.id, c.code, c.max_uses, c.used_count, c.expires_at,
           c.notes, c.active, c.created_at
    from public.invitation_codes c
    order by c.created_at desc;
end;
$$;

grant execute on function public.admin_list_invitation_codes() to authenticated;

-- ----------------------------------------
-- RPC admin: crear código nuevo
-- ----------------------------------------

create or replace function public.admin_create_invitation_code(
  p_code text,
  p_max_uses int default 20,
  p_expires_at timestamptz default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_code is null or trim(p_code) = '' then
    raise exception 'code_required';
  end if;
  if p_max_uses is null or p_max_uses <= 0 then
    raise exception 'max_uses_must_be_positive';
  end if;

  insert into public.invitation_codes (code, max_uses, expires_at, notes, created_by)
    values (trim(p_code), p_max_uses, p_expires_at, p_notes, auth.uid())
    returning id into new_id;

  insert into public.admin_audit_log (admin_id, action, details)
    values (auth.uid(), 'create_invitation_code',
            jsonb_build_object('code', p_code, 'max_uses', p_max_uses));

  return new_id;
end;
$$;

grant execute on function public.admin_create_invitation_code(text, int, timestamptz, text) to authenticated;

-- ----------------------------------------
-- RPC admin: activar/desactivar código
-- ----------------------------------------

create or replace function public.admin_toggle_invitation_code(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.invitation_codes set active = p_active where id = p_id;

  insert into public.admin_audit_log (admin_id, action, details)
    values (auth.uid(), 'toggle_invitation_code',
            jsonb_build_object('id', p_id, 'active', p_active));
end;
$$;

grant execute on function public.admin_toggle_invitation_code(uuid, boolean) to authenticated;

-- ----------------------------------------
-- RPC admin: eliminar código
-- ----------------------------------------

create or replace function public.admin_delete_invitation_code(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  removed_code text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select code into removed_code from public.invitation_codes where id = p_id;
  delete from public.invitation_codes where id = p_id;

  insert into public.admin_audit_log (admin_id, action, details)
    values (auth.uid(), 'delete_invitation_code',
            jsonb_build_object('id', p_id, 'code', removed_code));
end;
$$;

grant execute on function public.admin_delete_invitation_code(uuid) to authenticated;
