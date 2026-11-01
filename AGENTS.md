# AGENTS.md — Mente (provisional)

Documento de verdad: `docs/FOUNDATION.md` — no escribir código sin haberlo leído (una vez por sesión).
Memoria viva: `docs/PROJECT_STATE.md` — se lee al inicio de cada sesión.

## Stack
- Next.js 14 App Router + TypeScript + Tailwind
- Backend: Supabase (confirmado por David 2026-11-01) — migraciones vía SQL/CLI, no hay MCP de Supabase en este host
- Deploy: Vercel (MCP activo)

## Reglas de código (obligatorias)
- Auth en cada API route: `if (!user) return 401`
- Error handling: `catch (error: unknown)` → `error instanceof Error ? error.message : 'Error'`
- PUT (no PATCH) para updates · nunca mock data · RLS sobre user_id siempre (o equívolvo por usuario)
- `no-explicit-any: OFF` · variables no usadas con prefijo `_`
- Sin tildes en strings JSX · `>` en JSX → `→` · iconos lucide con `aria-label`, no `title`
- Archivos <100 líneas: cortar en partes y verificar cada una
- Antes de cualquier commit: `npm run build 2>&1 | tail -20` — nunca commit con build roto
- Commits: `feat: [modlulo]` / `fix: [modlulo]` / `db: [tabla]` / `doc: [que]`

## Quality gates
Cobertura líneas ≥80% · branches ≥70% · complejidad ≤10 · CRAP ≤10 · mutation kill ≥85% (si está configurado). Exenciones = enmienda documentada + confirmación de David.

## Skills NO usadas en este proyecto
caveman · diagnose · email-tone · find-skills · reverse-engineer-anything (ya usada en fase 0) · stitch-code-to-design · stitch-remotion · stitch-react-native · dev-workflow-pro (archivada, fusionada al orquestador)

## Skills del dominio SÍ usadas en fase de diseño
ux-framework · taste-skill-v2 · soft-skill · emil-design-eng · a11y-wcag · impeccable

## Agentes deshabilitados via opencode.json del proyecto
android-* (5) · chromebook-hardener · network-discovery · opsec-visibility · binary-investigator · redesign-scout · ai-trainer
