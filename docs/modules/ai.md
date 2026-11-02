# Módulo: AI organizadora + expansión semántica + explicar (módulo 3)

**Qué hace:** la AI analiza capturas (link con fetch seguro, voz con Whisper, texto), guarda `transcripcion` + `entidades` en ideas y crea **sugerencias aprobables** (Foundation #4: sugiere, nunca aplica): categoría (colección existente o nueva), conexiones embedding-lite (keywords vs items de biblioteca) y minuta si detecta pasos. En el Detalle: expansión discreta con transcripción/cita ("✦ Sacado del articulo", "Anadir a mi nota"), entidades con icono por tipo, ConexionesPropuestas (Aceptar = POST real + promo al ConexionesPanel), minuta aceptada guardada en `ai_minuta` (base del módulo 7), y **ExplicarPanel** chat en streaming que responde qué es / por qué puede funcionarte / técnica o patrón, con hilo que persiste al cerrar.

**Tablas:** ALTER `ideas` (+transcripcion, +entidades jsonb `{lista, ai_minuta?}`) · `sugerencias` (RLS owner, CHECK tipo categoria|conexion|entidades|minuta, estado pendiente|aceptada|descartada|descartada_permanente).

**Rutas:** `POST /api/ai/analizar/[id]` (rate 50/día, audio cap 25MB, sin key OpenAI → 409) · `GET /api/ai/sugerencias` (pendientes por user, opcional idea_ids) · `PUT /api/ai/sugerencias/[id]` (aceptar/descartar/descartar_permanente con hash) · `POST /api/ai/explicar` (streaming SSE→texto plano, hilo NO se guarda en DB).

**Decisiones técnicas:**
- Provider abstraction `lib/ai/provider.ts`: OPENAI precedence (chat + whisper) → OPENROUTER fallback (chat only, `openai/gpt-4o-mini`); sin keys → chat null y transcripcion 409 con copy claro.
- Fetch externo seguro: bloqueo SSRF (localhost, 127/8, 10/8, 172.16-31, 192.168, 169.254, ::1, fe80/fc/fd, .local, .internal), redirect manual ≤2 re-validado, timeout 10s, cap 1MB html / 25MB media; HTML→texto con regex (sin DOM).
- Estado 'descartada_permanente' bloquea re-sugerencias del mismo tipo para el item ('descartada' normal puede reaparecer).
- UI: ChipSugerencia borde discontinuo + dot fantasma ('Nueva'), banner primera vez (localStorage), FAB ✦ 56px, EntidadesTags spam con aria-label, `anim-dot-seq` pensada para `prefers-reduced-motion` (texto estático).
- Sin lucide-react (dep nueva no aprobada): iconos lucide inline 16px en `IconoEntidad`.

**Alineación con FOUNDATION:** puntos #4 (AI sugiere, aprueba el usuario), #5 (expansión semántica), #7 (explicar item bajo demanda), #13 (minuta → semilla del módulo 7).

**Deuda heredada / abierta:** OPENROUTER_API_KEY aún no existe en el entorno (el código la soporta); transcripción solo con key OpenAI; rate limit es counter por día (50), no token-bucket; CSP aún report-only; orphan audio sigue (higiene asistida la trae); las conexiones propuestas no persisten contexto más allá del payload (máx 4 por análisis).
