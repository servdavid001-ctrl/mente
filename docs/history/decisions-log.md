# Decisions log (append-only)

[2026-11-01] Proyecto completo: MCP conector + programador/activador se movieron a v2. Razón: dependen de que la v1 exista (tareas, accionable). Afecta: módulo 8 eliminado de v1.
[2026-11-01] Módulo 2: "Biblioteca" genérica se redefine como "Biblioteca creativa" (colecciones de arte, copy, videos, referencias; sin carpetas rígidas). La función "explicar item a demanda" se ancla en el módulo 3 (AI). Razón: refine del alcance ya definido, no nuevo alcance. Afecta: módulos 2 y 3.
[2026-11-01] Backend: Supabase (decision de David). Convex MCP queda deshabilitado en opencode.json. Migraciones via SQL/CLI (sin MCP de Supabase en este host). Afecta: todos los módulos con BD.
[2026-11-01] Nombre del sistema: "mente" provisional hasta decisión final de David.
[2026-11-01] Estructura de la app definida por David: 3 apartados — Foco (proyectos con investigación/notas/tareas, pocos desplegados, resto plegado pero accesible), Bandeja de entrada (todo lo que entra, estado de categorización visible, AI categoriza si es obvio), Biblioteca creativa. Enmienda asociada: la premisa "proyectos siempre visibles" se ajusta a "el usuario decide cuáles se despliegan; el resto plegado pero accesible — el sistema nunca esconde por su cuenta". Afecta: módulos 1 (navegación), 4 (Foco), y modelo de datos global.
[2026-11-01] Deploy #1 y #2 por CLI quedaron UNKNOWN en build (plataforma). Envs de Supabase re-registradas si newline (root cuasa del 401 Invalid API key del QA prod). Vía final: deploy via push a GitHub (proyecto conectado).
[2026-11-01] Deploys CLI zombis (3) cancelados por bloquear la cola del plan free. Deploy via GitHub quedara re-trigger.
