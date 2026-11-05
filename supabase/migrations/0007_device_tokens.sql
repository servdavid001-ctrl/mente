-- 0007: modulo 5 (extension Chrome) — tokens de captura por dispositivo
-- El token plano se muestra una sola vez; en BD solo vive su hash SHA-256.

create table if not exists public.device_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid(),
  nombre       text not null default 'extension' check (char_length(nombre) between 1 and 60),
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.device_tokens enable row level security;
drop policy if exists rights_owner_all on public.device_tokens;
create policy rights_owner_all on public.device_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists device_tokens_hash_idx on public.device_tokens (token_hash);

-- el hash no debe ser legible por PostgREST con el JWT del dueno
revoke all on public.device_tokens from anon;
revoke select (token_hash) on public.device_tokens from authenticated;
revoke select on public.device_tokens from authenticated;
grant select (id,user_id,nombre,created_at,last_used_at) on public.device_tokens to authenticated;
