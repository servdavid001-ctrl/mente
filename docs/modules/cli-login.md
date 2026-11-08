# Modulo 18 — CLI login para MCP (device flow) + Camara en captura

Fecha: 2026-11-08 · Merge main: 899e54a · Audit RECHAZADO->APROBADO (Dfix del CTO) · Migración 0013 aplicada · Deploy OK · QA e2e PASS

## Qué hace
A. Device flow estilo CLI: POST /api/mcp-login/start (publico rate-limited)
devuelve device_code + url /conectar?device=... ; el usuario autoriza/rechaza
en la web con su sesión; el CLI recoge el token EN POLL (una sola vez,
estado 'entregado'). El token vive/revoca igual que los de /ajustes
("Acceso para agentes"). El plain del token JAMÁS pasa por el browser UI.
B. Cámara: CaptureBar ahora tiene 2 botones — Galeria y Camara
(capture='environment'); mismo pipeline useFoto (idénticas validaciones).

## Decisiones / debate del audit
- Token plain transitorio en login_solicitudes.token (elección (a)), ACEPTADO
  solo con ventana acotada: reaper ampliado (aprobado expirado => token=null;
  entregadas/rechazadas viejas >24h borradas) + guard de expiración en el poll
  del branch aprobado (jamás entrega vencidas) — fixes del CTO tras RECHAZO.
- device_code: plain solo en respuesta; sha256 en DB; regex ^[w-]{43}$.
- login_solicitudes sin policies (revoke todo, patron ai_credenciales 0009).

## QA prod e2e
start -> poll pendiente 200 -> aprobar con sesión 200 -> poll granted
(mt_Bh...+43) -> segundo poll 410 (no re-servel) -> tools/list con token: 9
tools -> tras entregar, columna token=null en BD -> revocar 200 -> 0 activos.

## Menores (backlog)
url de start usa request.origin (hoop header) · rate in-memory por lambda ·
comparación ISO en aprobar es string-lexico (funciona, sugerencia Date).

## Alineación
Pedido literal David 'mcps con login', 'desde la galeria o tomar foto' (v1).
