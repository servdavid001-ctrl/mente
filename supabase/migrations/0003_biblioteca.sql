-- 0003: biblioteca creativa (modulo 2)
-- colecciones + conexiones + extension de ideas + bucket biblioteca-media
-- RLS siempre sobre user_id (AGENTS.md)

create table if not exists public.colecciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  nombre      text not null,
  color       char(7) null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- UNIQUE por usuario: dos colecciones del mismo dueno no comparten nombre
  constraint colecciones_nombre_unico unique (user_id, nombre)
);

alter table public.colecciones enable row level security;

create policy "rights_owner_all"
  on public.colecciones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger set_updated_at_colecciones
  before update on public.colecciones
  for each row
  execute function extensions.moddatetime(updated_at);

create table if not exists public.conexiones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  desde_id    uuid not null references public.ideas(id) on delete cascade,
  hacia_id    uuid not null references public.ideas(id) on delete cascade,
  nota        text null,
  created_at  timestamptz not null default now(),
  -- un item no se conecta consigo mismo y el par dirigido es unico
  constraint conexiones_par_distinto check (desde_id <> hacia_id),
  constraint conexiones_par_unico unique (desde_id, hacia_id)
);

alter table public.conexiones enable row level security;

create policy "rights_owner_all"
  on public.conexiones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- extension de ideas para la Biblioteca
alter table public.ideas
  add column if not exists coleccion_ids uuid[] not null default '{}',
  add column if not exists media_url text null,
  add column if not exists nota text null;

-- NOTA: adicion documentada necesaria para el modulo 2 (patron de 0001 con
-- 'archivada'): el filtro 'Arte' de la spec (§2) alimenta un tipo real y la
-- imagen subida a biblioteca-media convierte la idea en arte. Documentado
-- como adicion justificada del micro-contrato.
alter table public.ideas drop constraint if exists ideas_tipo_check;
alter table public.ideas
  add constraint ideas_tipo_check check (tipo in ('texto','voz','link','arte'));

-- 0002 Storage: bucket biblioteca-media + policies owner-only
-- ruta de archivo: '<user_id>/<nombre>.<ext>'
insert into storage.buckets (id, name, public)
values ('biblioteca-media', 'biblioteca-media', false)
on conflict (id) do nothing;

create policy "rights_owner_insert_biblioteca_media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'biblioteca-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "rights_owner_select_biblioteca_media"
  on storage.objects for select
  using (
    bucket_id = 'biblioteca-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "rights_owner_delete_biblioteca_media"
  on storage.objects for delete
  using (
    bucket_id = 'biblioteca-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
