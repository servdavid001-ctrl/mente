# Fix P1 — "Investigacion no guarda las subpaginas" (David, 2026-11-07)

## Diagnostico base del CTO (probado en prod 2026-11-07, session real)
- BACKEND OK: POST /api/ideas con estado 'investigacion' + destino {parent_id}
  crea la subpagina (201) y GET /api/ideas?parent=<raiz> la devuelve con su
  estado correcto. NO es bug de servicio ni de permisos.
- Ruta del UI: PaginaIdea (hereda estado del padre correctamente, linea 36-37)
  -> useAccionesIdeas.crearSubpaginaEn -> lib/foco.crearSubpagina (POST correcto).
- HIPOSIS PRIMARIA: la lista de subs paginas NO se refresca tras guardar (el
  hijo se crea pero no aparece => David percibe "no guarda"). Revisar
  usePaginasProyecto/ListaSubpaginas: tras crearSubpaginaEn, la debe refetchear
  GET ?parent (u optimistic insert) y actualizar conteoHijos del padre en el
  tree Psychic AI de origen.
## Delegar a code-implementer
Trace COMPLETO (componente por componente) de: crearSubpaginaEn -> estados ->
que props lista Podria re-renderizar. Buscar al menos 1 causa raiz real - no
parchear ciego. Fix:
1. Tras guardar con exito: refresh SIEMPRE de la lista de hijos (GET ?parent o
   insert optimista + confirmation server) y badge del padre al dia.
2. Manejo error visible (fallback si el POST falla => toast + fila tempro).
3. NotasProyecto - mismo fix (muy similar tree).
4. Rollback si Save-desi/ Succeeded con atributo incorrecto
   (nota: duplicado: si no aparece, David el segundo click -> duplicar).
## Verificacion y criterio (repo canónico)
- Probar manualmente con curl: no afecta - es bug de Estado UI (local con tests
  de build y parse). build/tsc/lint 0 · disciplina posible local garment.
- Escribir test:/comme subpágina creada & visible en la UI (npm test_);
- rama feat/p1-subpaginas. commits `fix: pv1-subpaginas...`. NO push de main.
- En el reporte: causa raiz exacta (archivo:linea), el fix, y por que el
  backend ya estoy culprit.
