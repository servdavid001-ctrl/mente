-- 0009: credenciales AI por usuario (modulo 8)
-- La clave se cifra en la app (AES-256-GCM, AI_KEY_SECRET) antes de guardarse:
-- la DB nunca ve texto plano. RLS habilitada SIN policies + revoke a anon y
-- authenticated: solo service_role (route handlers del servidor) accede.
-- El cliente jamas recibe la clave; /ajustes solo ve proveedor + last4.

create table if not exists public.ai_credenciales (
  user_id     uuid primary key default auth.uid(),
  proveedor   text not null check (proveedor in ('openrouter','openai')),
  key_cifrada text not null,
  last4       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.ai_credenciales enable row level security;

-- sin policies: nadie con JWT de usuario puede leer ni escribir
revoke all on public.ai_credenciales from anon, authenticated;
revoke truncate on public.ai_credenciales from anon, authenticated;

drop trigger if exists set_updated_at_ai_credenciales on public.ai_credenciales;
create trigger set_updated_at_ai_credenciales
  before update on public.ai_credenciales
  for each row
  execute function extensions.moddatetime(updated_at);
