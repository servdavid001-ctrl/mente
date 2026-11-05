-- 0006: modulo 4 (Foco) — proyectos + objetivos + ideas.proyecto_id
-- RLS owner-only en todas las tablas; updated_at automatico.

create table if not exists public.proyectos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  nombre      text not null check (char_length(nombre) between 1 and 80),
  descripcion text check (descripcion is null or char_length(descripcion) <= 1000),
  color       text not null default '#C96F4A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  plegado     boolean not null default false,
  orden       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.proyectos enable row level security;
drop policy if exists rights_owner_all on public.proyectos;
create policy rights_owner_all on public.proyectos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists set_updated_at_proyectos on public.proyectos;
create trigger set_updated_at_proyectos before update on public.proyectos
  for each row execute function extensions.moddatetime(updated_at);

create table if not exists public.objetivos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  proyecto_id uuid references public.proyectos(id) on delete set null,
  titulo      text not null check (char_length(titulo) between 1 and 160),
  descripcion text check (descripcion is null or char_length(descripcion) <= 4000),
  estado      text not null default 'activo' check (estado in ('activo','logrado','archivado')),
  fecha       date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.objetivos enable row level security;
drop policy if exists rights_owner_all on public.objetivos;
create policy rights_owner_all on public.objetivos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists set_updated_at_objetivos on public.objetivos;
create trigger set_updated_at_objetivos before update on public.objetivos
  for each row execute function extensions.moddatetime(updated_at);

-- una idea puede pertenecer a un proyecto (categorizar desde Bandeja)
alter table public.ideas add column if not exists proyecto_id uuid
  references public.proyectos(id) on delete set null;
create index if not exists ideas_proyecto_id_idx on public.ideas (proyecto_id);
create index if not exists objetivos_proyecto_id_idx on public.objetivos (proyecto_id);
