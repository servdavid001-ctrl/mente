-- 0005: cierre de bloqueantes de seguridad (auditoria 2026-11-04)
-- A2 rate limit atomico de AI + M4 limites de storage + M7 integridad de conexiones
-- Idempotente: seguro de re-aplicar.

-- A2: contador atomico por usuario/dia (cuenta intentos, no sugerencias)
create table if not exists public.ai_usage (
  user_id uuid not null default auth.uid(),
  dia     date not null default current_date,
  count   integer not null default 0,
  primary key (user_id, dia)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
revoke truncate on public.ai_usage from anon, authenticated;

-- A2: el limite vive en la funcion (no en un parametro del cliente)
create or replace function public.consumir_analisis(p_max integer default 50)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  insert into public.ai_usage (user_id, dia, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, dia) do update set count = public.ai_usage.count + 1
  returning count into v_count;
  return v_count <= 50;
end;
$$;
revoke all on function public.consumir_analisis(integer) from public, anon;
grant execute on function public.consumir_analisis(integer) to authenticated;

-- M7: una conexion solo puede unir ideas del mismo dueno
create or replace function public.validar_conexion_propia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.ideas where id = new.desde_id and user_id = new.user_id)
     or not exists (select 1 from public.ideas where id = new.hacia_id and user_id = new.user_id) then
    raise exception 'conexion_invalida';
  end if;
  return new;
end;
$$;
drop trigger if exists validar_conexion_propia on public.conexiones;
create trigger validar_conexion_propia
  before insert or update on public.conexiones
  for each row execute function public.validar_conexion_propia();

-- M4: limites de tamano y MIME por bucket
update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'biblioteca-media';

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-m4a']
where id = 'ideas-audio';

-- M4: el dueno puede borrar su audio (antes solo insert/select: huerfanos)
drop policy if exists "rights_owner_delete_ideas_audio" on storage.objects;
create policy "rights_owner_delete_ideas_audio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ideas-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
