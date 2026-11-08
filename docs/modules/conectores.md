# Modulo 19 — Conectores (muse/grok fácil), permisos por tool, docs públicas

Fecha: 2026-11-08 · Merge main: b4755a3 · Audit APROBADO (53 vectores) · Migración 0014 aplicada · Deploy OK · QA PASS

## Qué hace
1. **Wizard 'Añadir conector'** en /ajustes: nombre (opencode/muse/grok/otro)
   → token en un paso con TODA la vista (token + config JSON + interruptores).
   muse/grok sin MCP: nota de 'Copiar recado' por tarea.
2. **Permisos por herramienta**: cada token tiene los 9 interruptores
   (worker_tokens.permisos text[]). Server: tools/call rechaza -32002 +
   log 'bloqueada'; tools/list SOLO muestra las permitidas; PUT del owner
   con validación contra catálogo compartido src/lib/mcp/tools.ts.
3. **/integraciones pública** (estática, sin auth, link desde /login y
   /ajustes): flow del token + device flow con curls, tabla de 9 tools,
   ejemplos de config JSON (opencode + cliente genérico), seguridad y
   limitaciones v1. Espejo legible en docs/INTEGRACIONES.md del repo.

## Decisiones
- Source of truth de tools movida a lib/mcp/tools.ts (dados server+ui).
- Migración: columna text[] con default = las 9 (byte a byte vs catálogo).
- La lista vacía de permisos = bloquear TODO (fail-closed), advertido en UI.

## QA prod
/integraciones 200 sin sesión ✓ · PUT permisos ok ✓ · tool bloqueada -32002 ✓
· tools/list filtrada ['buscar_tareas'] ✓ · revocar 200 ✓ · residuo 0.
