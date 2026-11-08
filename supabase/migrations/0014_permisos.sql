-- 0014: modulo 19 — permisos por tools en worker_tokens (conectores).
-- Cada token guarda la lista de herramientas MCP permitidas; el default son
-- las 9 del catalogo v1 (todo permitido, como hasta ahora). Sin policies
-- nuevas: la policy rights_owner_all (0012) ya cubre read/write del owner;
-- solo se abre la columna al JWT authenticated para la UI (GET/PUT tokens).
-- El enforcement vive en /api/mcp: gate en tools/call (-32002) y tools/list
-- filtrada. Lista vacia = token sin herramientas (bloquea TODO).

alter table public.worker_tokens
  add column permisos text[] not null default
  '{buscar_tareas,obtener_plan,leer_investigacion,crear_nota,crear_subpagina,crear_tarea,terminar_tarea,importar_investigacion,pedir_anexo}';

-- el owner ve y cambia los permisos con su JWT desde /ajustes
grant select (permisos) on public.worker_tokens to authenticated;
grant update (permisos) on public.worker_tokens to authenticated;
