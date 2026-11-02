-- 0004: AI organizadora + expansion semantica (modulo 3)
-- ideas +transcripcion/+entidades y tabla sugerencias (RLS owner-only, AGENTS.md)
--
-- NOTA (adiciones documentadas del micro-contrato):
-- 1. el CHECK de tipo incluye 'minuta': la sugerencia de pasos accionables se
--    guarda como sugerencia minuta (Foundation #6; tareas reales llegan en mod 7).
--    'entidades' queda reservado (sin UI de accion hoy).
-- 2. entidades jsonb guarda { lista: Entidad[], ai_minuta?: { pasos, guardada } }:
--    la minuta aceptada vive en 'ai_minuta' (base mineralizada para el modulo 7).

alter table public.ideas
  add column if not exists transcripcion text null,
  add column if not exists entidades jsonb null;

create table if not exists public.sugerencias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  idea_id     uuid not null references public.ideas(id) on delete cascade,
  tipo        text not null check (tipo in ('categoria','conexion','entidades','minuta')),
  payload     jsonb not null,
  estado      text not null default 'pendiente'
              check (estado in ('pendiente','aceptada','descartada','descartada_permanente')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.sugerencias enable row level security;

create policy "rights_owner_all"
  on public.sugerencias for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger set_updated_at_sugerencias
  before update on public.sugerencias
  for each row
  execute function extensions.moddatetime(updated_at);

create index if not exists sugerencias_idea_idx on public.sugerencias (idea_id, estado);
