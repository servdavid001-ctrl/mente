# Arquitectura — Mente como almacén + mensajería de agentes (v2)
Estado: BORRADOR de la sesión de planificación (David, 2026-11-07). No programar
antes de cerrar las decisiones abiertas del final. Basada en las palabras de
David a lo largo de la sesión.

## Principio central (dicho de David)
"El agente solo mueve lo que está dentro de Mente. Mente almacena la información
y la puede pasar a muse o opencode, y viceversa — ellos pueden dejar información
allí si yo se los pido: contribuir con una investigación, buscar algo que
necesitan para alguna tarea."

- Mente = ALMACÉN (páginas/notas/investigaciones/tareas/proyectos) + MENSAJERO
  (empaca, entrega y recibe). La inteligencia externa solo ejecuta el trabajo.
- El flujo SIEMPRE pasa por Mente: nada de sesiones paralelas donde la
  información queda fuera David decide qué va y qué vuelve.
- Origen trazable: cada cosa dice su origen: creada por David / creada por el
  agente / hecha por opencode / hecha por muse-grok.

## Los 3 mecanismos (palabras literales de David)
1. **Documento técnico de proyecto (FOUNDATION.md)** — El agente de Mente puede
   GENERAR el fundamento de proyecto (o David lo escribe como tarea/investi-
   gación y se promociona a fundamento). Se guarda DENTRO de Mente como página
   del proyecto con etiqueta "plan técnico". opencode pasa a buscarlo CON MCP
   cuando lo necesita (pull, no push forzado), y David lo edita en cualquier
   momento (Mente mantiene el histórico).
2. **Tareas con etiqueta asignada_a** ('yo'|'opencode'|'muse'|'grok').
   - opencode: pasa a buscar sus tareas etiquetadas y las hace (ya montado el
     MCP de Mente en su config).
   - muse/grok: Mente genera el PAQUETE de recado (prompt + contexto + criterio
     de terminado + cómo devolver) — v1 manual (cargar/pegar), v2 automático
     (activador ya en Versión 2 del FOUNDATION) con aprobación por defecto.
3. **Import/Export investigaciones completas**: opencode/muse pueden DEJAR una
   investigación entera en Mente vía MCP (crea página raíz + subitems + etiqueta
   de origen), y Mente les entrega datos preparados (determinable por: proyecto,
   investigación, notas, requisitos de tareas).

## Flujo de un encargo (extensible)
David asigna (tarea con etiqueta opencode) → Mente empaca el paquete (tarefa +
fundamento si hace falta + criterio de terminado) → opencode busca por MCP →
trabaja → entrega por MCP: nota/página/investigación/tareas en el proyecto
correcto → David lo ve con el origen claro y aprueba.

## Tools MCP necesarios del servidor (v2)
- auth: token revocable per-worker (patrón módulo 5; SOLO se obtiene en /ajustes).
- buscar_tareas(asignado_a) · obtener_plan(proyecto) · leer_pagina(investigación)
- crear_pagina/idea/nota/tarea(s) · importar_investigacion(proyecto, payload)
- marcar_tarea(estado, resultado) · pedir_anexo(worker, que_necesita) → genera
  nota en el proyecto con etiqueta "para David" (esto cubre "buscan algo que
  les falta": dicen qué necesitan, David lo autoriza).
## Seguridad (nivel de nivel)
- Cada worker ve SOLO lo asignado a él + sus vinculaciones; NADA personal (el
  resto le queda invisible).
- Token revocable y auditado (log de acciones por token).
- Nada destructivo sin aprobación explícita de David (mismo ADN del FOUNDATION).

## Decisiones abiertas (David cierra en sesión)
- A. muse/grok: módulo v1 = manual (cargar/pegar) y auto v2 (recomendado) — sí/no
- B. token revocable per worker OK? (recommended) — sí/no
- C. resuelto en sesión: fundamento vive DENTRO de Mente (página editable, origen trazable) ✓

## Orden de build propuesto (tras la sesión)
1. P1: bug subpáginas de investigación (David lo reporto; procedural)
2. Editor Notion (bloques: negrita/cursiva/títulos/check/fotos)
3. Servidor MCP de Mente (tools + tokens + etiqueta asignada_a)
4. Fundamento técnico generado por agente + paquetes muse/grok (v1 manual)
5. Luego v2: Activador automático, auditoría de tiempo, etc.
