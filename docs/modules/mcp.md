# Modulo 15 — Servidor MCP de Mente (agentealmacén-mensajero)
Fecha: 2026-11-07 · Merge main: 72ae67f · Audit APROBADO · Migración 0012 aplicada · Deploy OK · QA e2e PASS

## Qué es
Mente expone su propio MCP para workers (opencode/muse/grok):
JSON-RPC 2.0 stateless en /api/mcp, autenticación Bearer con token revocable
(`mt_` + 40, sha256 en DB), rate 60/min, log token_acciones (resumen sin contenido).
Tools (v1 lectura/creación/terminar_tarea, sin delete):
buscar_tareas · obtener_plan · leer_investigacion · crear_nota ·
crear_subpagina · crear_tarea · terminar_tarea (nota '[resultado worker]') ·
importar_investigacion (raiz + subpaginas por parent_id) · pedir_anexo.

user_id SIEMPRE viene del token (0 queries sin filtro — audit). Tokens se
crean/revocan SOLO en /ajustes (patrón módulo 5). tareas.asignado_a
(yo/opencode/muse/grok) con chips en UI y PUT whitelist.

## QA prod (token real, revocación incluida)
initialize 2025-06-18 ✓ · tools/list 9 ✓ · crear_tarea 201 ✓ ·
buscar_tareas filtra por worker ✓ · terminar_tarea ✓+nota ✓ ·
revocar->401 ✓ · residuo cero (0 tokens activos, log preservado).

## Menores (audit, no bloquean)
error.message de constraint al worker propio · POST tokens sin rate-limit
(patrones device_tokens coherente) · rate in-memory por lambda (serverless).
