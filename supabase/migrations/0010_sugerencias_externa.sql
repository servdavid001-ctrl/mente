-- Modulo 10 (punto #5 FOUNDATION): el tipo de sugerencia 'externa'
-- (conexiones con conocimiento externo via catalogos publicos + AI)
alter table public.sugerencias drop constraint if exists sugerencias_tipo_check;
alter table public.sugerencias
  add constraint sugerencias_tipo_check
  check (tipo in ('categoria','conexion','entidades','minuta','externa'));
