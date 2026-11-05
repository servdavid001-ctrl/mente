# Módulo 4 — Foco (proyectos, objetivos, guardián y copiloto)

## Qué hace
Panel de Foco: proyectos desplegados y plegados, métricas de atención, objetivos, guardián suave y copiloto que convierte un objetivo en un plan de pasos.

## Rutas
- `/foco` — panel: métricas, guardián, Hoy, proyectos desplegados/guardados, crear proyecto, copiloto, tarjeta de extensión.
- `/foco/[id]` — detalle: objetivos, ideas del proyecto, tareas y crear tareas del plan.
- API: `/api/proyectos[/id]`, `/api/objetivos[/id]`.

## Tablas
- `proyectos` (nombre, descripcion, color, plegado, orden)
- `objetivos` (titulo, descripcion, estado activo/logrado/archivado, fecha, proyecto_id)
- `ideas.proyecto_id` (categorizar una idea a un proyecto)

## Decisiones
- Plegar/desplegar es decisión del usuario; nada se oculta de forma permanente (FOUNDATION #9).
- Guardián: avisa si hay >3 proyectos desplegados o un proyecto lleva >14 días sin ideas. Nunca bloquea.
- Copiloto sin IA: el plan se guarda como líneas en `objetivos.descripcion`; módulo 7 las convierte en tareas.
- Conteos calculados en servidor (ideas no archivadas, objetivos activos).

## Alineación
FOUNDATION #9 (Panel de Foco), #10 (guardián suave), #12 (copiloto de objetivos).
