-- Paso 4 (cuadros del proyecto): subtareas en tareas. Self-reference en
-- tareas.parent_id; el NIVEL maximo (= 1, solo raices) se valida en server
-- (lib/subtareas.ts, mismo patron de paginas.ts). Borrar la raiz borra en
-- cascada sus subtareas. RLS intacto (owner-only).
alter table public.tareas add column if not exists parent_id uuid
  references public.tareas(id) on delete cascade;
create index if not exists tareas_parent_id_idx on public.tareas (parent_id);
