-- 0013: modulo 18 — CLI login (device flow) de /api/mcp: login_solicitudes.
-- El device_code nunca vive plain en la BD (sha256 hex unique; el plain va
-- solo en la respuesta de POST /api/mcp-login/start y en la URL /conectar).
-- Patron 0009 (ai_credenciales): RLS habilitada SIN policies + revoke a
-- anon y authenticated; solo service_role (route handlers admin) accede.
-- token: el plain mt_* que /api/conectar/aprobar crea; se entrega UNA vez en
-- poll (pasa a entregado y se limpia) para que nunca pase por el browser UI.

create table if not exists public.login_solicitudes (
  id          uuid primary key default gen_random_uuid(),
  device_code text not null unique,
  nombre      text not null check (char_length(nombre) between 1 and 40),
  estado      text not null default 'pendiente'
              check (estado in ('pendiente','aprobado','rechazado','entregado')),
  user_id     uuid null,
  token_id    uuid null references public.worker_tokens(id) on delete set null,
  token       text null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  expira_en   timestamptz not null
);

alter table public.login_solicitudes enable row level security;

-- sin policies: nadie con JWT de usuario puede leer ni escribir esta tabla
revoke all on public.login_solicitudes from anon, authenticated;

create index if not exists login_solicitudes_created_idx
  on public.login_solicitudes (created_at);
create index if not exists login_solicitudes_expira_idx
  on public.login_solicitudes (estado, expira_en);

drop trigger if exists set_updated_at_login_solicitudes on public.login_solicitudes;
create trigger set_updated_at_login_solicitudes
  before update on public.login_solicitudes
  for each row
  execute function extensions.moddatetime(updated_at);
