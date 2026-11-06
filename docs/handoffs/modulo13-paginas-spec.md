# Spec final — Modulo 13: paginas/subpaginas estilo Notion (aprobado David)

Decisiones tomadas: modelo LIGHT (self-reference en ideas, parent_id). Max 3
niveles. Breadcrumbs siempre visibles. REA a Notion: saltado (patron conocido).

## Migración 0011_paginas.sql (PRIMERO)
```sql
alter table public.ideas add column if not exists parent_id uuid
  references public.ideas(id) on delete cascade;
create index if not exists ideas_parent_id_idx on public.ideas (parent_id);
```
RLs no cambia: sigue ideas owner-only; quien pone parent de otra persona no
puede (no existe para él). El CTO aplica la migración en prod via CLI DESPUES
del build OK; el agente SOLO escribe el archivo (mism regla repo).

## Jerarquía y capas
- Nivel 0: listados de la vista de proyecto (root: notas estado 'proyecto',
  investigación estado 'investigacion' — como hoy).
- Nivel 1..2: SUBPÁGINAS — ideas tipo texto anidadas via parent_id.
- Las notas de un page child son ideas texto con parent_id del sub page.
- CAMINO hero: al terminar una página sirve CUALQUERA estado
  ('proyecto'|'investigacion'), siempre del usuario.
- depth validacion SERVER: function calcularProfundidad(idea): sube parent_id
  hasta raiz; rechazar si la nueva child tendria > 3 niveles (1 raiz + 2 hijos).
  En INSERT (composer de subpágina) y en PUT que cambia parent_id: validar.

## API (cambios mínimos, sin rutas nuevas)
- POST /api/ideas: acepta opcional `destino:{parent_id}` (con RLS check de que
  la idea existe y es del usuario; validar profundidad maxima 3).
- GET /api/ideas: acepta `?parent=<uuid>` para obtener los HIJOS del usuario
  ordenados created_at. Devuelve hijos directos (1 NIVEL, no recusivo
  inspirado: el cliente pide por nivel si abre).
- PUT /api/ideas/[id]: whitelist añade `parent_id` con validación (existe, es
  del usuario, prof. max, no ciclos — parent no puede ser descendiente).
- DELETE: existente ya con cascade por schema.

## UI (estilo libre, simple, concepto visual del módulo 11)
- Nota/Investigación en listado: tap abre la PAGINA (sub vista simple o reuse
  /biblioteca/[id] si ya carga ideas de cualquier estado).
- Página vista: BREADCRUMB visible (Proyecto / Página / Subpágina) siempre;
  bloque lista de SUBPÁGINAS (títulos clicables) + botón "Nueva subpágina"
  (composer inline igual al de la libreta) + notas de la pagina abajo.
- Si una subpagina tiene hijos: badge con count; su detalle hereda la vista.
- Atrás = breadcrumb anterior. NO drag: mover = menu contextual 'Mover a' que
  da a PUT parent_id (elegir dentro de la misma investigación, max prof).
- Reglon: no fundear el tamaño de alternator grid global del detalle biblioteca:
  asegurar que el detalle cargue ideas de estados 'proyecto'/'investigacion'
  también (la query del route autorizado ya no filtra estado... revisar).

## Convenciones / límites files valentıkları
- Sin tildes en JSX. Sin auto-creación. Sin drag. Commits `feat: paginas`.
- Rama feat/paginas-m13. NO push a main.
- Archivos<100 lineas. No tocar: features/, tests, /api/ai/*, /api/higiene,
  extension/, sw.js, sugerencias flows módulo 10, flows fija del mod 12.

## Criterio de terminado (gate)
build/tsc/lint 0 · migración 0011 escrita para aplicar · curl: hijo de un
proyecto propiedad propia pasa depth max; hijo de otro usuario imposible via
destino (parent ajeno = 400). Report diff + file list; el CTO aplica migración
y despliega.
