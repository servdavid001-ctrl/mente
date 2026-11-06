# Modulo 9 — Higiene asistida (punto #11 del FOUNDATION)

Fecha de cierre: 2026-11-06 · Commit: 86cca96 · Security audit: APROBADO · Deploy prod: OK

## Qué hace (2-3 lineas)
El sistema detecta lo que lleva tiempo sin uso lo pregunta directo: ideas de la Bandeja
sin cambios >14 dias, ideas de Biblioteca apartadas (sin conexiones ni coleccion),
tareas pendientes viejas y colecciones vacias. Solo SUGIERE; archivar/eliminar
siempre requiere clic explicito (doble confirm para eliminar).

## Tablas
Ninguna nueva. Solo lectura sobre ideas, tareas, colecciones, conexiones (RLS por user_id).
Proxy de "sin uso": `updated_at` (no hay tracking de aperturas; v2 podria anadir `visto_en`).

## Rutas
- API `GET /api/higiene` — auth 401, read-only, cap 20 por tipo, error generico (no PostgREST crudo).
- Page `/higiene` — redirect a login sin sesion, `force-dynamic`.
- Componentes: `HigienePanel` (+ Grupos, Fila, Estado, useHigieneAcciones), card generous `/higiene` en Bandeja.
- Acciones reutilizan rutas existentes: `PUT /api/ideas/[id] {archivada:true}`, `DELETE /api/ideas|tareas|colecciones/[id]`, `PUT /api/tareas/[id] {estado:'hecha'}`.

## Decisiones tecnicas
- Umbrales fijos v1 (14 dias), sin configuracion: simplicidad del sistema de higiene.
- Acciones optimistas con rollback + toast; `window.confirm` x2 en eliminar.
- Badge de contador en el BottomNav: NO en este modulo (siguiente posible avance).

## Errores resueltos (regla del modulo)
- `pkill -f <patron>` se suecida a si mismo cuando el patron aparece en tu propia
  command line; falsos positivos de pgrep. Verificar procesos con
  `ps aux | awk '/node/ && !/awk/'`, nunca el substring contra tu propio comando.

## Deuda / hardening posterior (del audit, no bloquea)
- Queries del GET: 3 sin `.limit()` (biblioteca apartada, conexiones, colecciones) — anadir `.limit()` (200-500).
- `DELETE /api/ideas/[id]` sin `.select()` devuelve 204 aunque no borre nada (preexistente).
- Badge de contador en nav para higiene (bajo demanda).

## Alineacion con FOUNDATION
Punto #11: "detecta lo que lleva tiempo sin usarse y pregunta directamente:
¿lo necesitas realmente? — archivar/eliminar en un clic, con tu aprobacion." ✓
Flujo paso 7: "biblioteca se mantiene ligera sin esfuerzo" ✓
