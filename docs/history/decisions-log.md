# Decisions log (append-only)

[2026-11-01] Proyecto completo: MCP conector + programador/activador se movieron a v2. Razón: dependen de que la v1 exista (tareas, accionable). Afecta: módulo 8 eliminado de v1.
[2026-11-01] Módulo 2: "Biblioteca" genérica se redefine como "Biblioteca creativa" (colecciones de arte, copy, videos, referencias; sin carpetas rígidas). La función "explicar item a demanda" se ancla en el módulo 3 (AI). Razón: refine del alcance ya definido, no nuevo alcance. Afecta: módulos 2 y 3.
[2026-11-01] Backend: Supabase (decision de David). Convex MCP queda deshabilitado en opencode.json. Migraciones via SQL/CLI (sin MCP de Supabase en este host). Afecta: todos los módulos con BD.
[2026-11-01] Nombre del sistema: "mente" provisional hasta decisión final de David.
[2026-11-01] Estructura de la app definida por David: 3 apartados — Foco (proyectos con investigación/notas/tareas, pocos desplegados, resto plegado pero accesible), Bandeja de entrada (todo lo que entra, estado de categorización visible, AI categoriza si es obvio), Biblioteca creativa. Enmienda asociada: la premisa "proyectos siempre visibles" se ajusta a "el usuario decide cuáles se despliegan; el resto plegado pero accesible — el sistema nunca esconde por su cuenta". Afecta: módulos 1 (navegación), 4 (Foco), y modelo de datos global.
[2026-11-01] Deploy #1 y #2 por CLI quedaron UNKNOWN en build (plataforma). Envs de Supabase re-registradas si newline (root cuasa del 401 Invalid API key del QA prod). Vía final: deploy via push a GitHub (proyecto conectado).
[2026-11-01] Deploys CLI zombis (3) cancelados por bloquear la cola del plan free. Deploy via GitHub quedara re-trigger.

## 2026-11-01 - Modulo 3 (AI organizadora)
- Adicion documentada: CHECK tipo de sugerencias incluye 'minuta' (micro-contrato enumeraba 3 tipos; Foundation #6 obliga a la minuta de tareas; 'entidades' queda reservado sin UI).
- entidades jsonb shape: { lista: Entidad[], ai_minuta?: { pasos, guardada } } - la minuta aceptada vive en 'ai_minuta' como base mineralizada del modulo 7.
- Route GET /api/ai/sugerencias nueva (no estaba en el contrato): la Bandeja necesita leer chips pendientes por item.
- Rate limit diario 50 analisis (audit P3-5 pedida al entrar IA); contador sobre sugerencias.creadas del dia, devuelve 429 con copy de spec.
- Sin lucide-react (no nuevas deps sin aprobacion): iconos de entidades son inline SVG con los paths de lucide 16px.
- OPENROUTER_API_KEY no existe en el entorno; provider.ts la soporta como fallback del chat. Transcripcion requiere OpenAI (409 con copy claro si falta).
- ExplicarPanel: el hilo vive en el front (estado local), NO se guarda en DB (simplicidad del micro-contrato).
- Metadatos del detalle muestra estado del semaforo persistente (ajuste pedido del modulo 2) + pill Minuta.
