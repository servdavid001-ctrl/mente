# PROJECT_STATE — Mente (provisional)
Última actualización: 2026-11-04

## Estado actual
Módulos 1-3 completados y **desplegados en producción** (2026-11-04) sobre Next 16.4.5 + Supabase `vgtbznppcthyitnzgmlt`. Security audit: APROBADO. Build verde, 0 vulnerabilidades npm.
Siguiente módulo: 4. Proyectos, Objetivos y Panel de Foco.

## Producción
- URL: https://mente-ten-iota.vercel.app
- Vercel: proyecto `mente` (team servdavid001-2819s-projects), SSO protection reactivada.
- Supabase: `vgtbznppcthyitnzgmlt` (us-east-1). Migraciones 0001-0005 aplicadas y registradas.
- GitHub: `servdavid001-ctrl/mente`, rama `main`.

## Módulos completados
| Módulo | Rutas | Estado |
|---|---|---|
| 1. Fundamento | /, /login, /api/ideas[/id] | ✓ |
| 2. Biblioteca creativa | /biblioteca[/id], /api/colecciones[/id], /api/conexiones | ✓ |
| 3. AI organizadora | /api/ai/analizar/[id], /api/ai/sugerencias[/id], /api/ai/explicar | ✓ (requiere AI key) |
| Navegación | /foco + BottomNav con Link real | ✓ (fix P0 #8) |

## Deuda abierta
- **AI no operativa en prod**: faltan `OPENROUTER_API_KEY` u `OPENAI_API_KEY` en Vercel. La UI degrada con 503 claro.
- Transcripcion solo con key OpenAI (OpenRouter cubre chat, no audio).
- React 18 deprecado en Next 16 (subir a React 19 antes de Next 17).
- `eslint-config-next` sigue en 14 y eslint 8; `npm run lint` funciona con `eslint .`.
- CSP en Report-Only con `unsafe-eval`; cookies de sesión no HttpOnly; errores PostgREST crudos al cliente (deudas Medias del audit, no bloqueantes).
- Minuta AI guardada en `ideas.entidades.ai_minuta` (base del módulo 7). Higiene asistida pendiente de limpiar audio huérfano.
- Sin service worker custom (PWA mínima).
- MCP Supabase global corregido a `vgtbznppcthyitnzgmlt`; requiere reiniciar la sesión de opencode.

## Módulos pendientes (orden)
1. Proyectos, Objetivos y Panel de Foco
2. Extensión Chrome
3. Share-target móvil
4. Acciones/tareas

## Bugs abiertos AHORA
(ninguno)
- 2026-11-04 RESUELTO: P0 #8 BottomNav no navegaba. Fix: `BottomNav` con `next/link`, `AppShell` sin estado local, ruta `/foco`. Verificado en producción.

## Últimas decisiones
- 2026-11-04: Proyecto Supabase correcto = `vgtbznppcthyitnzgmlt`; el anterior del MCP (`emquosormmqyfoxtqtea`) estaba borrado.
- 2026-11-04: Upgrade Next 14.2.35 → 16.4.5 por advisories críticos (C1). `middleware.ts` → `proxy.ts`; cookies/params async.
- 2026-11-04: Registro cerrado (`disable_signup=true`, password mínimo 12) y botón de signup eliminado (contrato single-user).
- 2026-11-04: Rate limit AI atómico por RPC `consumir_analisis` (50/día, cuenta intentos); SSRF con DNS fijado (undici); validación UUID en conexiones; migración 0005.
- 2026-11-01: Estructura de 3 apartados (Foco / Bandeja / Biblioteca). Proyectos plegables por decisión del usuario, nunca bloqueados.

## Alertas activas
- **Falta AI key** para activar módulo 3 en producción (David).
- Rotar el token `sbp_...` de la config global de opencode (quedó visible en logs de sesión).
- Referencias de diseño: albo.inc + notion.com (REA, 2026-11-01).

---
## QA REPORT — 2026-11-04 (producción)
URL: https://mente-ten-iota.vercel.app | Playwright headless + sesión real
- Login 307→/login y signIn 200: PASS
- Captura texto (POST /api/ideas 201 + item visible): PASS
- Navegación Bandeja → Biblioteca → Bandeja → Foco con URL real: PASS
- 0 pageerrors, 0 excepciones; vitals previos FCP/LCP 452ms, CLS 0.
- Preview QA previo: 18 flujos OK, 0 P1; P2 de copy AI corregido (estado `indisponible`).
