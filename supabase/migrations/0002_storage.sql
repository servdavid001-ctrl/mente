-- 0002: bucket ideas-audio + policies (insert/select solo propietario)
-- ruta de archivo: '<user_id>/<nombre>.webm'

insert into storage.buckets (id, name, public)
values ('ideas-audio', 'ideas-audio', false)
on conflict (id) do nothing;

create policy "rights_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ideas-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "rights_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'ideas-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
