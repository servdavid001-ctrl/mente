-- 0008: modulo 7 — tareas ligadas a ideas, objetivos y proyectos
-- "guardado" se vuelve "hecho" (FOUNDATION #13).

create table if not exists public.tareas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  proyecto_id uuid references public.proyectos(id) on delete cascade,
  objetivo_id uuid references public.objetivos(id) on delete set null,
  idea_id     uuid references public.ideas(id) on delete set null,
  titulo      text not null check (char_length(titulo) between 1 and 200),
  nota        text check (nota is null or char_length(nota) <= 2000),
  estado      text not null default 'pendiente' check (estado in ('pendiente','hecha')),
  fecha       date,
  orden       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.tareas enable row level security;
drop policy if exists rights_owner_all on public.tareas;
create policy rights_owner_all on public.tareas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists set_updated_at_tareas on public.tareas;
create trigger set_updated_at_tareas before update on public.tareas
  for each row execute function extensions.moddatetime(updated_at);

create index if not exists tareas_proyecto_idx on public.tareas (proyecto_id);
create index if not exists tareas_estado_fecha_idx on public.tareas (estado, fecha);
create index if not exists tareas_idea_idx on public.tareas (idea_id);
