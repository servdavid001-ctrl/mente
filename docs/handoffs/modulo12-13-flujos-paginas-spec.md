# Spec draft — Módulo 12 (flujos de ideas) + Módulo 13 (páginas estilo Notion)

Origen: David 2026-11-06 (post módulo 11). ESTADO: DRAFT — 3 decisiones de David
abiertas antes de programar. Se construye DESPUES de su confirmación.

## Módulo 12 — Dirección correcta de los flujos de ideas (pequeño)
Regla de David: las ideas VIAJAN en esta única dirección:
- Bandeja de entrada → proyecto (o investigación del proyecto)
- Directo: creada ya dentro del proyecto (composer de la libreta — ya existe, módulo 11)
- Biblioteca → proyecto
PROHIBIDO: que un proyecto "traiga" ideas desde la bandeja de entrada (el pull
inverso agregado en módulo 11, SelectorBandeja, SE QUITA).
Cambios:
1. Quitar "Traer de la Bandeja" de la libreta del proyecto (NotasProyecto).
2. ASEGURAR que existe (y es claro) "Mover/Enviar a proyecto" desde la vista
   detalle de Biblioteca (/biblioteca/[id]) — hay categorizar-sheet; verificar
   que cubre enviar a proyecto/investigación concreta y deja el rastro visible.
3. La libreta del proyecto queda: composer directo + mover items ya presentes
   del mismo proyecto entre apartados (notas <-> investigación).
Auditoria de contrato: los PUT ya lo permiten (ideaAcciones whitelist cubre
estado + proyecto_id); es cambios de UI y copy, sin rutas nuevas.

## Módulo 13 — Investigación y Notas como páginas/subpáginas (estilo Notion)
Referencia de David: Notion. También autorisé a REA si es necesario.

### Propuesta de modelo (decisión pendiente de David)
LA OPCIÓN LIGHT (recomendada): self-reference en ideas —
- alter ideas: add column parent_id uuid REFERENCES ideas(id) on delete cascade
- Inversión asignada: página raíz de investigación = idea estado 'investigacion'
- una PAGINA = idea tipo texto con contenido; SUBPAGINAS = ideas con parent_id
  hacia ella (vista con breadcrumb, at esc depth)
- Notas dentro de página = mismos bloques del FOUNDATION #8 (ideas ligadas)
La OPCIÓN NOTION (más grande): tabla nueva `paginas` con parent_id + título +
contenido, UI más cercana a Notion (sidebar árbol, drag) = migración + UI grande.

### Decisión pendiente (TENSION con FOUNDATION)
FOUNDATION dice: "bloques ligeros con enlaces, SIN jerarquías rígidas" y "el
LÍMITE: no jerarquías que se pudren". Pages/subpages jerárquicas SON una
jerarquía — no es prohibido documentación mía (David manda), pero para cumplir
el espíritu del FOUNDATION propongo:
- **Profundidad acotada: máximo 3 niveles** (página > subpágina > notas)
- la página siempre accesible desde su proyecto (1 clic, como foco)
- sin jerarquía oculta: breadcrumbs siempre visibles

## Decisiones pendientes de David (bloquean M13, no M12)
1. ¿Profundidad max 3 niveles como propuso? (u otra cifra / sin límite)
2. ¿Opción LIGHT (ideas con parent_id) u OPCIÓN NOTION (tabla paginas)?
3. ¿REA a Notion: lo salto (conozco el patrón y lo saco con la opción elegida)
   o quieres la ingeniería inversa como referencia visual? (costo de tiempo)

## QA/criterio M12 (puede arrancar ya — no vendeentan)
Bandeja -> proyecto visible desde CategorizarSheet ✓ ya existe
Biblioteca -> proyecto visible y funcional
Proyecto no pulleja desde bandeja (SelectorBandeja eliminado)
build/tsc/lint 0 + audit + deploy.
