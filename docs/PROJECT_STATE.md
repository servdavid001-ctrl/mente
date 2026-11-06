# PROJECT_STATE — Mente (provisional)
Última actualización: 2026-11-06 (módulo 10)

## Estado actual
**Módulo 10 (conexiones externas) en producción + QA en vivo de higiene PASS.**
`23237d4` en main; deploy verificado (`/api/ai/externa` 401). Security audit APROBADO
tras fixes B1 (migración 0010 aplicada: CHECK con 'externa') + B2 + MA1. Higiene
(módulo 9) probado end-to-end en prod con fixtures: 3/3 detecciones + acciones ✓.
Siguiente: David testea AI real + conexiones externas con SU clave/usuario → con su
"READY" cierran módulos 9 y 10. Luego: deuda menor (MA2-MA5) y Versión 2.

## Distribución
- Extension: https://mente-ten-iota.vercel.app/downloads/mente-extension.zip
- APK (debug, Capacitor): https://github.com/servdavid001-ctrl/mente/releases/tag/apk-1
- Panel de ajustes: /ajustes (clave AI, tema, extension, datos)
- Higiene: /higiene (card acceso en Bandeja)
- Externas: botón "Buscar conexiones externas" en ficha de idea analizada

## Producción
- URL: https://mente-ten-iota.vercel.app
- Vercel: proyecto `mente`; `AI_KEY_SECRET` en prod/preview/dev.
- Supabase: `vgtbznppcthyitnzgmlt` (us-east-1), migraciones 0001-0010 aplicadas y registradas.
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
| 9 | Higiene asistida | /higiene, /api/higiene | ✓ QA prod PASS |
| 10 | Conexiones externas | /api/ai/externa/[id], ficha idea | ✓ deploy; QA con clave pendiente |

## Deuda abierta
- **Test real de AI y externas con clave de David**: solo puede ejecutarlo SU usuario (clave cifrada AAD=user_id; admin@mente.local no tiene clave). Entra → idea → Analizar → luego "Buscar conexiones externas".
- Externas MA2-MA5 (audit): orden de cuota, merge jsonb sin transacción, allowlist de dominios de coverUrl, cap de respuesta de catálogos.
- Password de admin@mente.local reseteada por el CTO (está en /tmp/opencode/mente-admin.txt; guardar en gestor y rotar desde /ajustes → Cuenta).
- Higiene: 3 queries del GET sin `.limit()` (hardening del audit); badge contador en nav bajo demanda.
- DELETE /api/ideas/[id] sin `.select()` devuelve 204 aunque no borre nada (preexistente).
- Rotar `AI_KEY_SECRET` invalida las claves guardadas (la UI pide reingresar); rotar el PAT `sbp_...` visible en logs.
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
- **MCP Supabase global apunta a otro proyecto** (`tlkvqcgkrkmtcvutjcbz`, prospección), no a `vgtbznppcthyitnzgmlt`: reiniciar opencode. Mientras tanto, migraciones vía CLI con `--project-ref --linked`.

## Bugs abiertos AHORA
(ninguno)

## Últimas decisiones
- 2026-11-06: Módulo 10: conexiones externas híbridas (Google Books + OpenLibrary + AI del usuario) en ficha enlazada DENTRO de la idea, aceptadas van a ideas.entidades.externa. Migración 0010 amplía CHECK de sugerencias.tipo (indicación de David: combinación de fuentes y fichas sin notas fantasma). Audit RECHAZADO→APROBADO tras fixes B1/B2/MA1.
- 2026-11-06: Módulo 9: higiene asistida (#11). Detecta por proxy `updated_at` (>14 días): bandeja vieja, biblioteca apartada, tareas pendientes viejas, colecciones vacías. Solo sugiere; acciones = rutas existentes (PUT/DELETE). Caps 20/tipo. Security audit APROBADO, deploy OK.
- 2026-11-06: Módulo 8: clave AI por usuario en /ajustes. Proveedor único (OpenRouter/OpenAI), validación contra endpoint autenticado, AES-256-GCM con AAD=user_id (v2, lee v1), tabla `ai_credenciales` RLS sin policies + revoke (solo service_role), `AI_KEY_SECRET`, fallback a env en dev.
- 2026-11-06: `.eslintignore` añadido (mobile/, builds, downloads): lint vuelve a 0 errores.
- 2026-11-05: UI v2: sidebar desktop, grid 2/3/4, tema claro/oscuro/sistema, /ajustes, export JSON, ZIP y APK.
- 2026-11-05: Registro por invitacion (`/registro` + `REGISTRO_INVITE_CODE`); signup publico cerrado. Contrato single-user intacto.
- 2026-11-05: Módulos 4-7 sin IA: copiloto por líneas, captura por token, share-target solo POST, tareas desde minuta/líneas.

## Alertas activas
- **Testear AI + externas con tu usuario y clave** (David): idea → Analizar → "Buscar conexiones externas". Con confirmación, cierro módulos 9-10.
- **MCP Supabase mal apuntado** (ver deuda): migrar via CLI `supabase db query --project-ref vgtbznppcthyitnzgmlt --linked -f <sql>`.
- Código de invitación activo (`REGISTRO_INVITE_CODE`): rotarlo si se filtra.
- Probar extensión y share-target en dispositivo real.

---
## QA — 2026-11-06 (módulo 8, local + producción autenticada)
tsc 0 · lint 0 · build 0 · REST anon 401 · service_role 201/204 · sin sesión 401/405 · con sesión (admin@mente.local): GET estado 200 no-configurada, PUT formato/proveedor inválido 400, PUT clave falsa 400 con validación remota OK, DELETE 200, /ajustes renderiza chip+form, explicar sin clave 503 copy nuevo, idea ajena por RLS bloqueada. Tabla `ai_credenciales` vacía. Falta solo: clave real de David para probar sugerencia + explicar reales.

## QA — 2026-11-05 (UI v2 y módulos 4-7)
390/768/1440 sin overflow; sidebar/bottom nav correctos; ajustes 7 secciones; tema oscuro persiste; export 200; ZIP 200; APK 200. Proyecto/objetivo→3 tareas, tarea manual en Hoy, token de captura 201, revocar token, share-target POST: PASS. 0 pageerrors. Datos de prueba eliminados.
