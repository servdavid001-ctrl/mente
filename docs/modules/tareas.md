# Módulo 7 — Tareas

## Qué hace
Convierte ideas y planes en tareas accionables, con vista "Hoy" y vínculo a proyecto, objetivo e idea.

## Rutas
- `/api/tareas` GET (`proyecto_id`, `estado`, `hoy=1`) / POST
- `/api/tareas/[id]` PUT / DELETE
- `POST /api/ideas/[id]/tareas` — pasos desde `entidades.ai_minuta.pasos` o líneas de nota/texto/transcripción.
- `POST /api/objetivos/[id]/tareas` — líneas del plan del copiloto.

## UI
- `/foco` sección "Hoy": pendientes con fecha nula o ≤ hoy, toggle y borrado.
- `/foco/[id]`: sección Tareas del proyecto + crear tarea con fecha opcional.
- `/biblioteca/[id]`: botón "Convertir en tareas" cuando la idea tiene contenido.

## Tabla
`tareas` (titulo, nota, estado pendiente/hecha, fecha, orden, proyecto_id, objetivo_id, idea_id), RLS owner-only.

## Decisiones
- Extracción de pasos sin IA: minuta si existe; si no, líneas/bullets (3-200 chars, máx 20).
- `proyecto_id` con `on delete cascade`; `objetivo_id`/`idea_id` con `set null`.

## Deuda
- Triggers de pertenencia cross-tenant en FKs (la API ya valida).
- Sin recordatorios ni recurrencia (v2).

## Alineación
FOUNDATION #6 (contenido→tareas), #12 (plan del copiloto), #13 (guardado→hecho).
