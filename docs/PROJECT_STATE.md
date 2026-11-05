# PROJECT_STATE — Mente (provisional)
Última actualización: 2026-11-05

## Estado actual
**v1 completa + UI v2 (responsive, ajustes, tema, extension y APK) desplegada en producción.** Build verde, 0 vulnerabilidades npm, security audit APROBADO, QA en vivo de módulos 1-7 sin errores de página.
Siguiente: pulido de UI y backlog v2 del FOUNDATION.

## Distribución
- Extension: https://mente-ten-iota.vercel.app/downloads/mente-extension.zip
- APK (debug, Capacitor): https://github.com/servdavid001-ctrl/mente/releases/tag/apk-1
- Panel de ajustes: /ajustes

## Producción
- URL: https://mente-ten-iota.vercel.app
- Vercel: proyecto `mente`, SSO protection activa (prod accesible, previews protegidas).
- Supabase: `vgtbznppcthyitnzgmlt` (us-east-1), migraciones 0001-0008 aplicadas y registradas.
- GitHub: `servdavid001-ctrl/mente`, rama `main`.

## Módulos completados
| # | Módulo | Rutas principales | Estado |
|---|---|---|---|
| 1 | Fundamento (login, bandeja, captura, PWA) | /, /login, /api/ideas[/id] | ✓ |
| 2 | Biblioteca creativa | /biblioteca[/id], /api/colecciones[/id], /api/conexiones | ✓ |
| 3 | AI organizadora | /api/ai/analizar, /sugerencias, /explicar | ✓ código (requiere key) |
| 4 | Foco: proyectos, objetivos, guardián, copiloto | /foco[/id], /api/proyectos[/id], /api/objetivos[/id] | ✓ |
| 5 | Extensión Chrome + tokens de captura | extension/, /api/captura[/token] | ✓ |
| 6 | Share-target móvil + service worker | /compartir (POST), public/sw.js | ✓ |
| 7 | Tareas (idea/plan→tareas, Hoy) | /api/tareas[/id], /api/ideas/[id]/tareas | ✓ |

## Deuda abierta
- **AI no operativa en prod**: falta `OPENROUTER_API_KEY` u `OPENAI_API_KEY`. La UI degrada con 503 claro.
- Rate limit en `/api/captura` y `/compartir` (solo AI lo tiene).
- Magic bytes de imágenes (hoy solo MIME declarado).
- Triggers de pertenencia cross-tenant en FKs de proyectos/objetivos/tareas (la API ya valida).
- Errores PostgREST crudos al cliente en algunas rutas.
- CSP Report-Only con `unsafe-eval`; cookies de sesión no HttpOnly.
- React 18 deprecado en Next 16 (subir a 19 antes de Next 17); `eslint-config-next` 14.
- Capturas >4.5 MB fallan por body limit de Vercel.
- Sin service worker de caché offline (solo passthrough para share-target).
- Sin framework de tests configurado (gate = build + tsc + lint + QA en vivo).
- CI del APK bloqueada: el PAT no tiene scope `workflow` para versionar `.github/workflows/`; el workflow vive en `docs/ci/`.
- APK en debug (sin firma de release ni Play Store); el wrapper carga produccion por URL.
- Iconos PWA solo SVG (Android puede pedir PNG para instalar).
- Rate limit de registro best-effort por instancia (Map en memoria); reinicia con cold start.
- MCP Supabase global corregido a `vgtbznppcthyitnzgmlt`; requiere reiniciar opencode.

## Bugs abiertos AHORA
(ninguno)

## Últimas decisiones
- 2026-11-05: UI v2: sidebar desktop (md+), grid 2/3/4, detalle a 2 columnas, tema claro/oscuro/sistema, /ajustes con 7 secciones, export JSON, ZIP de extension y APK Capacitor publicado.
- 2026-11-05: Registro por invitacion (`/registro` + `REGISTRO_INVITE_CODE`); el signup publico de Supabase sigue cerrado. Logout anadido al header. Contrato single-user intacto.
- 2026-11-05: Módulos 4-7 construidos sin IA: copiloto por líneas, captura por token de dispositivo, share-target solo POST (GET eliminado por CSRF), tareas extraídas de minuta/líneas.
- 2026-11-05: `/compartir` exento del proxy pero con auth propia; mutación solo por POST.
- 2026-11-04: Next 16.4.5, registro cerrado, rate limit AI atómico, SSRF con DNS fijado, migración 0005.
- 2026-11-01: 3 apartados (Foco/Bandeja/Biblioteca); proyectos plegables por decisión del usuario.

## Alertas activas
- **Falta AI key** para activar módulo 3 (David).
- **Codigo de invitacion activo**: `REGISTRO_INVITE_CODE` en Vercel y `.env.local` (rotarlo si se filtra).
- Rotar token `sbp_...` de la config global de opencode (visible en logs de sesión).
- Probar la extensión y el share-target en un dispositivo real (requiere instalar PWA y pegar token).

---
## QA REPORT — 2026-11-05 (UI v2)
390/768/1440 sin overflow; sidebar/bottom nav correctos; biblioteca 4 columnas en 1440; ajustes 7 secciones; tema oscuro persiste; export 200; ZIP 200; APK 200; 0 pageerrors.

## QA REPORT — 2026-11-05 (producción, módulos 4-7)
URL: https://mente-ten-iota.vercel.app | Playwright + sesión real
- Crear proyecto y abrir detalle: PASS
- Objetivo con plan (3 pasos) → "3 tareas creadas": PASS
- Crear tarea manual y verla en "Hoy": PASS
- Generar token de extensión y capturar texto por API: 201 PASS
- Revocar token: PASS
- Share-target POST → idea en bandeja: PASS
- Errores de página: 0
- Datos de prueba eliminados (15 ideas, 0 proyectos/objetivos/tareas/tokens).
