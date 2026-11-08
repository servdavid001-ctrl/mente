# Modulo 16 — Recados de tarea + Fundamento generado (agente)

Fecha: 2026-11-07 · Merge main: 3cfcee3 · Audit APROBADO · Deploy OK · QA prod PASS

## Qué hace
A. **Copiar recado** (tarea): genera el paquete determinista para el worker
(muse/grok/opencode): encargo, asignado, proyecto, objetivo, fundamento del
proyecto (si existe), nota, criterio de terminado y cómo devolver (nota en el
proyecto o MCP crear_nota). Previsualización + clipboard con fallback.
B. **Fundamento** (proyecto): el botón genera un draft fundacional con la AI
del usuario (rate consumir_analisis, 503 sin clave), con vista previa y
Creación EXPLICITA como página del proyecto (regla FOUNDATION: nada automático).
Si ya existe, la sheet lo muestra (existe:true, no gasta llamada).

## Decisiones
- Recado = template determinista (sin AI). Fundamento = 1LL llamada AI con
  caps (total ~1920<=2000 chars) y salida JSON parseada.
- Objetivo/fundamento vacios -> "-" placeholder (no número crudo).

## QA prod
PUT asignado_a 200 · GET recado correcto con todos los campos ·
fundamento sin clave 503 (copy previsto) · limpieza 204×2.

## Menores (audit)
- Rate se gasta aunque no haya clave (orden explicar/analizar igual) — backlog.
- Race doble gastol fundamento si doble POST concurrente (single-user).
- POST tareas no acepta asignado_a en creacion (chips lo asignan post-creacion;
  el MCP tool sí lo acepta) — asimetría documentada.

## Alineación
Arquitectura almacén-mensajero: Mente EMPACA el paquete (prepáralo listo);
el fundamento del FOUNDATION.md técnico queda como página de proyecto
(obtener_plan del MCP lo expone a opencode ahora mismo).
