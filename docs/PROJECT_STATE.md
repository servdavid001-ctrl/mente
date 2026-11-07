# PROJECT_STATE — Mente (provisional)
Última actualización: 2026-11-06 (módulo 11)

## Estado actual
**Módulo 11 (Foco UI v2) en producción con QA end-to-end PASS.** `c3c7f9b` en main.
Security audit APROBADO (0 críticos, 4 menores). Clave AI de David activa en
`ai_credenciales` (su usuario). READY de David 2026-11-06 (v1 + higiene + externas).
Breaf de dirección post-v1 clasificado en Versión 2 del FOUNDATION.
Siguiente: **SESION DE PLANIFICACION agente/MCPs/AI en curso (David la llamó)** — bug P1 investigacion/subpaginas + editor Notion quedan para el build siguiente.

## Pendientes de decisión David
- **Módulos 12-13 (draft en docs/handoffs/modulo12-13-flujos-paginas-spec.md)**:
  M12 = dirección de flujos (quitar pull inverso de libreta, asegurar
  biblioteca→proyecto). M13 = páginas/subpáginas estilo Notion — TENSION con
  FOUNDATION (jerarquías): propuesto max 3 niveles + breadcrumb; falta su decisión
  (profundidad, modelo LIGHT vs NOTION, ¿REA a Notion?).
- Fotos en bandeja: ¿v1? · Coach de foco: ¿v1-copiloto o v2?
- **Sesión planificación agente/MCPs/AI + módulo extensión v2**: agenda lista en
  `docs/handoffs/sesion-agente-mcps-agenda.md` — espera su llamada.

## Distribución
- Extension: https://mente-ten-iota.vercel.app/downloads/mente-extension.zip (SOLO en /ajustes; regla módulo 11)
- APK (debug, Capacitor): https://github.com/servdavid001-ctrl/mente/releases/tag/apk-1
- /ajustes: clave AI · tema · extension · PWA/APK · datos · cuenta
- /higiene (card en Bandeja) · /foco tarjetas + tabs (Notas/Investigación/Tareas)

## Producción
- URL: https://mente-ten-iota.vercel.app
- Vercel: proyecto `mente`; `AI_KEY_SECRET` en prod/preview/dev.
- Supabase: `vgtbznppcthyitnzgmlt` (us-east-1), migraciones 0001-0010 aplicadas.
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
| 10 | Conexiones externas | /api/ai/externa/[id], ficha idea | ✓ deploy OK; QA con clave David pendiente |
| 11 | Foco UI v2 (tarjetas + proyecto simple) | /foco tarjetas, /foco/[id] tabs | ✓ QA prod PASS end-to-end |
| 12 | Direccion de flujos | /biblioteca -> proyecto, sin pull inverso | ✓ Audit IDOR pass |
| 13 | Paginas/subpaginas estilo Notion | ideas.parent_id, breadcrumb, max 3 | ✓ QA prod PASS |

## Deuda abierta (documentada, no bloquea)
- Paginas: 3 avisos del audit => 1 tarea unica (secretarian de integridad en BD: subarbol > 3, TOCTOU ciclo, FK bajo RLS).
- Test real de AI + externas: solo con la sesión de David (su clave, AAD=user_id).
- Externas MA2-MA5: cuota/merge jsonb/allowlist dominios/cap res.json.
- Foco UI M1: POST con destino:{} sin estado → 400 (strict correcto); M3 sin rate-limit.
- Higiene: 3 queries sin .limit(); DELETE ideas sin .select() (204 aunque no borre).
- Password admin@mente.local reseteada (está en /tmp/opencode/mente-admin.txt; rotar).
- Rate limits en memoria, magic bytes, CSP unsafe-eval, cookies no HttpOnly.
- React 18 deprecado · eslint-config-next 14 con 9 vulns devDeps.
- Capturas >4.5 MB (body limit Vercel) · APK debug · CI APK sin scope workflow.
- MCP Supabase global apunta a otro proyecto: migrar via CLI `--project-ref --linked`.
- Rotar AI_KEY_SECRET invalida claves (UI pide reingresar); rotar PAT sbp_ visible en logs.

## Bugs abiertos AHORA
- **P1 (módulo 13, reporte David 2026-11-07): "Investigación no guarda las subpáginas"** — diagnosticar y arreglar en el próximo build.
- **EME (módulo 13, David): la forma de mostrar/escribir no le gusta** — quiere editor estilo Notion (cursiva, negrita, títulos, checks, fotos = bloques). Alcanza a rehacer el flujo paginas con bloques enriquecidos; planifica tras la sesión de MCPs (la pide David explícitamente).

## Últimas decisiones
- 2026-11-06: Módulo 11: Foco UI v2 del boceto de David (tarjetas carrusel/grid, botones +/- con modales, progreso, plegar por menú, tabs Notas/Investigación/Tareas, libreta dual composer+mover). POST /api/ideas acepta destino+estado opcional con validación RLS. Extension/App SOLO /ajustes.
- 2026-11-06: Breaf post-v1 de David (agente MCPs, coach foco, memoria, biblioteca redesign, IA no-determinista) → Versión 2 con paula regul de clasificación pendiente.
- 2026-11-06: Módulo 10: híbridas catálogo+AI con fichas enlazadas dentro de la idea; migración 0010 (CHECK sugiere tipo externa). Audit RECHAZADO→APROBADO tras B1/B2/MA1.
- 2026-11-06: Módulo 9 higiene: proxy updated_at >14d, solo sugiere, acciones PUT/DELETE existentes, cap 20/tipo.
- 2026-11-05: Registro por invitación + claves por usuario (módulo 8, AES-256-GCM AAD=user_id).

## Alertas activas
- **Sesión de planificación pendiente** (David llama): agente+MCPs opencode/asistente+IA no-determinista + flujo extensión v2. Agenda lista.
- Probar extensión y share-target en dispositivo real.
- Rotar password admin y código de invitación si se filtra.
