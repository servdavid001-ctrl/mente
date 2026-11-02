# Módulo: Fundamento (módulo 1)

**Qué hace:** puerta del system — auth (email/password con Supabase Auth) + esqueleto de 3 apartados (Foco placeholder · Bandeja funcional · Biblioteca placeholder), CaptureBar estilo WhatsApp (texto optimista con Enter, voz por MediaRecorder → bucket `ideas-audio`, link por detección de URL sin scraping), semaforo de categorización (todo ✗ en este módulo por diseño), archivar/eliminar con undo de 6s, PWA manifest, API con auth 401 + modelo `error: unknown` + PUT.

**Tablas:** `ideas` (RLS owner-only, estado bandeja/biblioteca/proyecto/investigacion, tipo texto/voz/link, audio_url) · bucket `ideas-audio` con policies owner-only.
**Rutas:** `/` (Bandeja) · `/login` · `/api/ideas` [GET, POST] · `/api/ideas/[id]` [GET, PUT, DELETE] · `api/ideas/[id]/audio urine STORAGE` vía client RLS.

**Decisiones técnicas:**
- `@supabase/ssr` con cookies en middleware (sesión server-side compartibles con los route handlers).
- Optimistic UI: el texto nunca se pierde si la red falla.
- Undo de 6s: eliminación re-inserta copia; archivar restaura la fila (columna `archivada` añadida fuera del micro-contract original — enmienda documentada en decisions-log).

**Errores resueltos (ver bugs-log):**
- P0 contrato link: CaptureBar envía sourceUrl + backend con fallback regex sobre text (4668c1e / 8fa8abb).
- P2s: toast ValueError body del error, favicon, delay del undo prompt.

**Alineación con FOUNDATION:** punto #1 (captura cero-fricción <5s) y #3 (Inbox único); estructura de 3 apartados definida por David implementada como shell.

**Deuda para esta sesión siguiente módulos:** UI de columnas (hecho módulo 2), orphan de audio al eliminar, email confirm SignUp (UX), service worker offline, rate limit.
