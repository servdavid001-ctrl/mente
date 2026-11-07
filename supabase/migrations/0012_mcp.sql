-- 0012: modulo 15 — servidor MCP: etiqueta asignado_a en tareas,
-- worker_tokens (sha256, revocables) y log token_acciones.
-- El token plano mt_* solo existe una vez en la respuesta de la API;
-- en BD solo vive su hash SHA-256. Ninguna operacion destructiva.

alter table public.tareas
  add column if not exists asignado_a text not null default 'yo'
  check (asignado_a in ('yo','opencode','muse','grok'));
create index if not exists tareas_asignado_idx
  on public.tareas (user_id, asignado_a, estado);

create table if not exists public.worker_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid(),
  nombre       text not null check (char_length(nombre) between 1 and 40),
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revocado_en  timestamptz
);
alter table public.worker_tokens enable row level security;
drop policy if exists rights_owner_all on public.worker_tokens;
create policy rights_owner_all on public.worker_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists worker_tokens_user_idx on public.worker_tokens (user_id);

-- el hash y el user_id no deben ser legibles por el dueno con su JWT
-- (patron 0007): solo el admin/service_role del servidor los consulta.
-- audit: revoke TABLE-completo de authenticated (los revokes de columna
-- solos SON NO-OP frente al default grant de authenticated)
revoke all on public.worker_tokens from anon;
revoke select on public.worker_tokens from authenticated;
grant select (id,nombre,created_at,last_used_at,revocado_en)
  on public.worker_tokens to authenticated;
grant insert (nombre, token_hash) on public.worker_tokens to authenticated;
grant update (revocado_en) on public.worker_tokens to authenticated;

create table if not exists public.token_acciones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  token_id   uuid references public.worker_tokens(id) on delete set null,
  worker     text not null,
  accion     text not null,
  proyecto   text,
  resumen    text check (resumen is null or char_length(resumen) <= 200),
  created_at timestamptz not null default now()
);
alter table public.token_acciones enable row level security;
drop policy if exists rights_owner_all on public.token_acciones;
create policy rights_owner_all on public.token_acciones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists token_acciones_user_idx
  on public.token_acciones (user_id, created_at desc);
