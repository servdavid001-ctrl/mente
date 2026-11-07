# Modulo 14 — Editor de paginas estilo Notion (bloques ligeros)

Fecha: 2026-11-07 · Merge main: 33dc6df · Audit APROBADO · Deploy OK · QA prod PASS (PUT contenido)

## Que hace
El cuerpo de página/subpágina es EDITABLE in-place bajo el titulo (requisito #0
de David: "tiene que verse alli debajo"): escribes, Guardar -> "Guardar" y el
texto se ve debajo del transferido. Recargar $-> desde la BD. Markdown ligero:
# h1, **negrita**, *cursiva*, checks [ ] [x], imagen !imagen(url) o ![alt](url)
(match a http(s) y parsesito propio no-dangerous). El guardado del composer
(subpágina) + P1 fix se mantienen (optimistic + refresh árbol).

## Decisiones
- Store de contenido: ideas.contenido como markdown light (sin migración, cap
  2000). titulo = primera linea; body editado preserva titulo (Regla 4).
- PUT contenido añadido al whitelist de ideaAcciones (cap, vacio rechazado, RLS).
- RenderBloques componentes React (no dangerouslySetInnerHTML); checks click
  con estado local (no persiste; text VA integral).
- Detector de confusion: el parser test/correcto con vectores js:/data:/HTML.

## Menores audit no bloquea
- Check [x] necesita 2 clicks para des-marcar (simple fix pero pendiente).
- Cap servidor aplio a completa (title+body); title larga silencia mismatch.
- Orden de ramas PUT: nota prioridad antes de contenido (si se envian juntos).

## Alineación
Pedido literal de Dqvid estilo Notion Methyl blocks: simple minimalista mod 11.
