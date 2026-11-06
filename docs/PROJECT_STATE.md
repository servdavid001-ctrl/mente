# PROJECT_STATE — Mente (provisional)
Última actualización: 2026-11-06 (módulo 9)

## Estado actual
**Módulo 9 (higiene asistida) en producción** — `86cca96` en main, deploy verificado
(`/api/higiene` 401 sin sesión, `/higiene` 307 → login). Build/tsc/lint verificados por el
CTO; security audit APROBADO. Clave AI de David guardada y validada en `ai_credenciales`
(1 registro, 2026-11-06). QA en vivo del módulo 9 y test real de AI pendientes de sesión.
Siguiente: QA en vivo (higiene + AI con clave real) → conexiones con conocimiento
externo (#5).

## Distribución
- Extension: https://mente-ten-iota.vercel.app/downloads/mente-extension.zip
- APK (debug, Capacitor): https://github.com/servdavid001-ctrl/mente/releases/tag/apk-1
- Panel de ajustes: /ajustes (clave AI, tema, extension, datos)
- Higiene: /higiene (card acceso en Bandeja)

## Producción
- URL: https://mente-ten-iota.vercel.app
- Vercel: proyecto `mente`; `AI_KEY_SECRET` en prod/preview/dev.
- Supabase: `vgtbznppcthyitnzgmlt` (us-east-1), migraciones 0001-0009 aplicadas y registradas.
- GitHub: `servdavid001-ctrl/mente`, rama `main`.

## Módulos completados
| # | Módulo | Rutas principales | Estado |
|---|---|---|---|
| 1 | Fundamento (login, bandeja, captura, PWA) | /, /login, /api/ideas[/id] | ✓ |
| 2 | Biblioteca creativa | /biblioteca[/id], /api/colecciones[/id], /api/conexiones | ✓ |
| 3 | AI organizadora | /api/ai/analizar, /sugerencias, /explicar | ✓ (requiere clave) |
| 4 | Foco: proyectos, objetivos, guardián, copiloto | /foco[/id], /api/proyectos[/id], /api/objetivos[/id] | ✓ |
| 5 | Extensión Chrome + tokens de captura | extension/, /api/captura[/token] | ✓ |
| 6 | Share-target móvil + service worker | /compartir (POST), public/sw.js | ✓ |
| 7 | Tareas (idea/plan→tareas, Hoy) | /api/tareas[/id], /api/ideas/[id]/tareas | ✓ |
| 8 | Clave AI por usuario | /ajustes, /api/ajustes/ai | ✓ QA prod PASS |
| 9 | Higiene asistida | /higiene, /api/higiene | ✓ deploy; QA en vivo pendiente |

## Deuda abierta
- **QA en vivo módulo 9 en prod**: /higiene con datos >14 días, archivar/marcar hecha/eliminar (doble confirm) — falta sesión de David (password de admin@mente.local cambió; la copia en /tmp está obsoleta).
- **Test real de AI con clave de David**: clave guardada y validada al guardar (diseño módulo 8); falta probar analizar/explicar/sugerencias con respuesta real en prod.
- Higiene: 3 queries del GET sin `.limit()` (hardening del audit); badge contador en nav bajo demanda.
- Conexiones con conocimiento externo (#5): no implementado (solo keywords internas).
- Rate limit de `/api/captura`, `/compartir` y de guardar clave (Map en memoria, por instancia).
- Magic bytes de imágenes (hoy solo MIME declarado).
- Triggers de pertenencia cross-tenant en FKs de proyectos/objetivos/tareas (la API ya valida).
- Errores PostgREST crudos al cliente en rutas antiguas (la nueva ruta ya devuelve genérico).
- CSP Report-Only con `unsafe-eval`; cookies de sesión no HttpOnly.
- React 18 deprecado en Next 16; `eslint-config-next` 14.
- Capturas >4.5 MB fallan por body limit de Vercel.
- Sin framework de tests (gate real = build + tsc + lint + QA en vivo).
- CI del APK bloqueada: el PAT no tiene scope `workflow` (workflow en `docs/ci/`).
- APK en debug (sin firma de release); iconos PWA ya en PNG.
- **MCP Supabase global apunta a otro proyecto** (`tlkvqcgkrkmtcvutjcbz`, prospección), no a `vgtbznppcthyitnzgmlt`: reiniciar opencode. Mientras tanto, migraciones vía Management API/CLI.
- Rotar `AI_KEY_SECRET` invalida las claves guardadas (la UI pide reingresar); rotar el PAT `sbp_...` visible en logs.

## Bugs abiertos AHORA
(ninguno)

## Últimas decisiones
- 2026-11-06: Módulo 9: higiene asistida (#11). Detecta por proxy `updated_at` (>14 días): bandeja vieja, biblioteca apartada, tareas pendientes viejas, colecciones vacías. Solo sugiere; acciones = rutas existentes (PUT/DELETE). Caps 20/tipo. Security audit APROBADO, deploy OK.
- 2026-11-06: Módulo 8: clave AI por usuario en /ajustes. Proveedor único (OpenRouter/OpenAI), validación contra endpoint autenticado, AES-256-GCM con AAD=user_id (v2, lee v1), tabla `ai_credenciales` RLS sin policies + revoke (solo service_role), `AI_KEY_SECRET`, fallback a env en dev.
- 2026-11-06: `.eslintignore` añadido (mobile/, builds, downloads): lint vuelve a 0 errores.
- 2026-11-05: UI v2: sidebar desktop, grid 2/3/4, tema claro/oscuro/sistema, /ajustes, export JSON, ZIP y APK.
- 2026-11-05: Registro por invitacion (`/registro` + `REGISTRO_INVITE_CODE`); signup publico cerrado. Contrato single-user intacto.
- 2026-11-05: Módulos 4-7 sin IA: copiloto por líneas, captura por token, share-target solo POST, tareas desde minuta/líneas.

## Alertas activas
- **Password de admin@mente.local cambió**: necesito la actual (o demo session) para QA en vivo — higiene + test real de AI con tu clave.
- **MCP Supabase mal apuntado** (ver deuda): no usar para migraciones hasta reiniciar opencode.
- Código de invitación activo (`REGISTRO_INVITE_CODE`): rotarlo si se filtra.
- Probar extensión y share-target en dispositivo real.

---
## QA — 2026-11-06 (módulo 8, local + producción autenticada)
tsc 0 · lint 0 · build 0 · REST anon 401 · service_role 201/204 · sin sesión 401/405 · con sesión (admin@mente.local): GET estado 200 no-configurada, PUT formato/proveedor inválido 400, PUT clave falsa 400 con validación remota OK, DELETE 200, /ajustes renderiza chip+form, explicar sin clave 503 copy nuevo, idea ajena por RLS bloqueada. Tabla `ai_credenciales` vacía. Falta solo: clave real de David para probar sugerencia + explicar reales.

## QA — 2026-11-05 (UI v2 y módulos 4-7)
390/768/1440 sin overflow; sidebar/bottom nav correctos; ajustes 7 secciones; tema oscuro persiste; export 200; ZIP 200; APK 200. Proyecto/objetivo→3 tareas, tarea manual en Hoy, token de captura 201, revocar token, share-target POST: PASS. 0 pageerrors. Datos de prueba eliminados.
