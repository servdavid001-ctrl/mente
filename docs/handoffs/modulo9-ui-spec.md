# Spec — Modulo 9: Higiene asistida (punto #11 FOUNDATION)

DELEGA A: code-implementer · DISENO: UX-framework pendiente de aplicacion (frontend-ui no se requiere: no hay flujos nuevos complejos, es un panel + acciones sobre datos existentes).

## Micro-contrato (REGLAS SAGRADAS)
- El sistema SOLO SUGIERE: nunca archiva ni elimina sin clic explicito del usuario.
- Detecta y pregunta; el usuario aprueba. Todo lo contrario al contrato "no componentes nuevos automaticos".
- Sin nuevas tablas ni migraciones. Solo lectura + updates en existentes (ideas, tareas, colecciones).
- Umbrales fijos: 14 dias sin cambios = "posiblemente sin uso". No configuracion extra en v1.
- Eliminacio siempre exige confirmacion doble (UI pide confirmar de nuevo).

## Criterio de terminado
`npm run build` 2>&1 | tail -20 devuelve 0 · tsc 0 · lint 0 · flujo QA manual descrito en la ultima seccion · sin data falsa (ningun mock, todo contra Supabase real).

## Datos existentes (NO llegar con supuestos)
- `ideas`: `id, user_id, tipo(texto|voz|link|arte), contenido, titulo_pagina, audio_url, fuente, estado(bandeja|biblioteca|proyecto|investigacion), archivada bool, coleccion_ids uuid[], media_url, nota, updated_at`
- `tareas`: `id, user_id, titulo, nota, estado('pendiente'|'hecha'), fecha, updated_at`
- `colecciones`: `id, user_id, nombre, color, updated_at` (NO tiene count de itens)
- `conexiones`: `id, user_id, desde_id, hacia_id, nota` (desde_id/hacia_id → ideas)
- RLS sobre user_id en todas. REGLA: service-side SIEMPRE filtra por user_id (o equiv por auth.uid).

## API (nueva): GET /api/higiene
`src/app/api/higiene/route.ts` — solo GET.
Auth: `if (!user) return 401` (patron identico a otras rutas con `createClient()` + `await supabase.auth.getUser()`).
Devuelve JSON:
```ts
type RespHigiene = {
  recomendaciones: Recomendacion[];
}
type Recomendacion = {
  tipo: 'idea_bandeja' | 'idea_biblioteca_apartada' | 'tarea_vieja' | 'coleccion_vacia';
  id: string;              // id de la entidad correspondiente (no composita)
  titulo: string;          // idea.contenido (o titulo_pagina, o tareas.titulo, o colecciones.nombre)
  detalle: string;         // ej: "14 dias sin cambios"
  dias: number;            // dias sin updated_at
};
```
- `idea_bandeja`: ideas en `estado='bandeja'`, `archivada=false`, `updated_at < now() - 14d`. Cap 20, mas viejas primero.
- `idea_biblioteca_apartada`: ideas en `estado='biblioteca'`, `archivada=false`, SIN conexiones (ni desde ni hacia en `conexiones`), SIN coleccion_ids, `updated_at < now()-14d`. Cap 20.
- `tarea_vieja`: tasks con `estado='pendiente'`, `updated_at < now()-14d`. Cap 20.
- `coleccion_vacia`: colecciones sin ninguna idea que las referencie en `ideas.coleccion_ids` (usa la granularidad por `&& coleccion_ids @> ARRAY[colecciones.id]`). Cap 20.
- NO debe nunca alterar datos ni pasar por AI. Es una consulta sesión-de-usuario pura.
- Error handling: `catch (error: unknown)` → `error instanceof Error ? error.message : 'Error'` con status 500. Nunca filtrar errores PostgREST crudos al cliente (patron de rutas nuevas).

## Acciones (reutilizan rutas existentes — NO crear rutas nuevas)
- Archivar idea: `PUT` NO EXISTE… hay `DELETE /api/ideas/[id]`? Busca en codigo; si `archivada` se modifica con PUT inexistente, usa el patron de update de ideas que ya este. Si no existe, crea `PUT /api/ideas/[id]` para actualizar `archivada` (regla: PUT nunca PATCH).
- Eliminar idea: `DELETE /api/ideas/[id]` si existe.
- Para tareas: `PUT /api/tareas/[id]` (marcar `hecha`), `DELETE /api/tareas/[id]`.
- Para colecciones vacias: `DELETE /api/colecciones/[id]`.
- NINGUNA accion automatica en el GET. Todo por botones explicitos en la UI.

## UI
1. `src/components/higiene/HigienePanel.tsx` (cell-side): lista de recomendaciones agrupadas por tipo, con acciones por item: `[Archivar] [Eliminar]` para ideas, `[Marcar hecha] [Eliminar]` para tareas, `[Eliminar]` para colecciones. Botoón Eliminar: `window.confirm` adicional (destructivo).
2. `src/app/higiene/page.tsx`: server-side auth (redirect a login sin sesion, copia de `page.tsx`), renderiza `<HigienePanel />` + `<BottomNav active='bandeja' />` (mismo layout que las otras pages, revisar una para copiar estructura).
3. Badge del BottomNav: NO lo toques (mouseleave el scope de la spec seria agrandar la tarea). Solo crea una afluencia de avisos si en el GET de recomendaciones hay `recomendaciones.length > 0`. Accion extra OPCIONAL si sobra tiempo: añadir un punto en la Bandeja… NO es comercial, salta al siguiente PR.
4. Sin tildes en strings JSX. `>` en JSX → `→`. Iconos de lucide con `aria-label`. Link `/higiene` visible en la Bandeja (titulo o card suave arriba derecho, estilo parecido al card del Guardian de foco — mira `src/components/foco/Guardian.tsx` para el tono visual suave).

## Convenciones inalterables del repo
- Archivos >100 líneas: escribir en partes y verificar cada una.
- `npm run build 2>&1 | tail -20` antes de cada commit (nunca ejecutar con un `next start` vivo; si hay proceso, `pkill -9 -f next-server` primero y `rm -rf .next`).
- Commits: `feat: higiene-asistida` al final con codigo, NO dividir en commits WIP si es un feature completo.
- Contract de estilo: MIRA `src/app/foco/page.tsx` + `Guardian.tsx` ANTES de escribir HUD (tono, colores, tipografia).

## Verificacion final antes de reportarme
1. `npm run build 2>&1 | tail -20` → 0 errores.
2. `npm start` local → login como admin@mente.local NO funciona (password cambio); usar el flujo de sesion que te otorgue David si te pregunta por credenciales; si no puedes crear sesion, reporta que el flujo QA manual es el siguiente a ejecutar por el CTO con David en produccion.
3. Curl contra localhost:3000/api/higiene SIN sesion → 401.
4. NO hagas push a main; reporta el diff (files changed) y deja el trabajo listo para mi building/QA.
