# AGENTS.md — Mente (provisional)

REGLA PERMANENTE (David, 2026-11-01): SIEMPRE operar bajo el flujo completo del CTO-agent (FASES 0-5, delegación a subagentes con andamiaje, quality gate determinista, QA en vivo, security-auditor antes de deploy, cierre con "READY" de David). No atajos, no silencio en desviaciones.

Documento de verdad: `docs/FOUNDATION.md` — no escribir código sin haberlo leído (una vez por sesión).
Memoria viva: `docs/PROJECT_STATE.md` — se lee al inicio de cada sesión.

## Stack
- Next.js 16.4.5 App Router + TypeScript + Tailwind (React 18, deprecado: subir a 19 antes de Next 17)
- Next 16: `cookies()` y `params` son async (`await createClient()`, `await params`); middleware vive en `src/proxy.ts`; lint = `eslint .`
- Backend: Supabase proyecto `vgtbznppcthyitnzgmlt` (us-east-1) — migraciones 0001-0005 aplicadas; SQL/CLI
- Deploy: Vercel proyecto `mente`, producción https://mente-ten-iota.vercel.app

## Reglas de código (obligatorias)
- Auth en cada API route: `if (!user) return 401`
- Error handling: `catch (error: unknown)` → `error instanceof Error ? error.message : 'Error'`
- PUT (no PATCH) para updates · nunca mock data · RLS sobre user_id siempre (o equívolvo por usuario)
- `no-explicit-any: OFF` · variables no usadas con prefijo `_`
- Sin tildes en strings JSX · `>` en JSX → `→` · iconos lucide con `aria-label`, no `title`
- Archivos <100 líneas: cortar en partes y verificar cada una
- Antes de cualquier commit: `npm run build 2>&1 | tail -20` — nunca commit con build roto
- REGLA CRÍTICA (lección 2026-11-01): NUNCA `npm run build` con un `next start` vivo — desync de chunks (HTML pide chunks que ya no existen → ChunkLoadError). Secuencia canónica: `pkill -9 -f next-server` → `rm -rf .next` → build → `npm start`. Verificar parse pás deben coindicir con `curl | grep page-` vs `find .next`
- Commits: `feat: [modlulo]` / `fix: [modlulo]` / `db: [tabla]` / `doc: [que]`

## Quality gates
Cobertura líneas ≥80% · branches ≥70% · complejidad ≤10 · CRAP ≤10 · mutation kill ≥85% (si está configurado). Exenciones = enmienda documentada + confirmación de David.

## Skills NO usadas en este proyecto
caveman · diagnose · email-tone · find-skills · reverse-engineer-anything (ya usada en fase 0) · stitch-code-to-design · stitch-remotion · stitch-react-native · dev-workflow-pro (archivada, fusionada al orquestador)

## Skills del dominio SÍ usadas en fase de diseño
ux-framework · taste-skill-v2 · soft-skill · emil-design-eng · a11y-wcag · impeccable

## Agentes deshabilitados via opencode.json del proyecto
android-* (5) · chromebook-hardener · network-discovery · opsec-visibility · binary-investigator · redesign-scout · ai-trainer
