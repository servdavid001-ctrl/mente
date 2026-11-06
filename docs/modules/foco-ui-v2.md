# Modulo 11 — Foco UI v2 (tarjetas + proyecto simple)

Fecha de cierre: 2026-11-06 · Merge main: c3c7f9b · Security audit: APROBADO · Deploy prod: OK · QA end-to-end PASS

## Qué hace
Vista principal de Foco simplificada al boceto de David: fila de tarjetas
(color + iniciales + nombre + barra progreso de tareas), carrusel mobile /
grid desktop, botones flotantes "+" (crear) y "P+N" (ocultos plegados),
menu contextual para plegar, guardián avisa a los 4+ visibles pero nunca
bloquea. /foco/[id] simplificado con tabs Notas | Investigación | Tareas
(objetivos listados arriba en tareas hasta decision final). Extension/App
SOLO en /ajustes (ExtensionCard eliminada de Foco).

## Decisiones tecnicas
- Libreta dual: composer inline crea idea estado='proyecto' con proyecto_id
  (POST /api/ideas nuevo campo opcional destino+estado con validacion RLS);
  "Traer de la Bandeja" reusa PUT ideaAcciones.
- Progreso: conteo tareas hechas/total en GET /api/proyectos (query paralela).
- Sin tablas nuevas, sin rutas nuevas, sin fondo perdida: objetivos intactos.

## QA de produccion (end-to-end, admin session)
proyecto POST 201 -> tarea 201 -> idea con destino 201 -> progreso 0/1 ->
PUT hecha 200 -> progreso 1/1 -> plegado true -> limpieza 204 x3. Distribucion
solo /ajustes verificada por el audit.

## Menores del audit (no bloquean)
M1 POST con destino:{} sin estado ahora 400 (strict) · M2 9 vulns npm de
toolchain de lint (devDeps) · M3 POST ideas sin rate-limit (preexistente) ·
M4 test cross-tenant con 2 cuentas no posible (single-user; garantia RLS).

## Alineacion con FOUNDATION
Estructura de 3 apartados + punto #10 (panel de foco, guardián sugiere) ✓.
Es refinamiento UI, no scope v1 nuevo — estil David literal del boceto.
