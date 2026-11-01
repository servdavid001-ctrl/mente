-- 0001: tabla public.ideas para el modulo 1 (Fundamento)
-- RLS siempre sobre user_id (AGENTS.md)

create extension if not exists moddatetime with schema extensions;

create table if not exists public.ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  tipo        text not null check (tipo in ('texto','voz','link')),
  contenido   text,
  titulo_pagina text null,
  audio_url   text null,
  fuente      text null,
  estado      text not null default 'bandeja'
              check (estado in ('bandeja','biblioteca','proyecto','investigacion')),
  -- NOTA: columna archivada es la unica adicion al contrato del modulo 1.
  -- Requerida por el alcance (acciones archivar/eliminar con undo): el enum de
  -- estado no contempla 'archivada' y una idea archivada no es lo mismo que
  -- categorizada. Documentada y reportada como desviacion justificada.
  archivada   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- solo el propietario lee/escribe sus filas (both using + with check)
alter table public.ideas enable row level security;

create policy "rights_owner_all"
  on public.ideas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at automatico
create trigger set_updated_at_ideas
  before update on public.ideas
  for each row
  execute function extensions.moddatetime(updated_at);
