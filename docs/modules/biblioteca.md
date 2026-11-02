# Módulo: Biblioteca creativa (módulo 2)

**Qué hace:** destino y hogar de las ideas creativas — colecciones como etiquetas flexibles multi-valor (con paleta de 8 dots), grid visual estilo albo con filtros (colección multi-select, tipo, búsqueda, toggle archivadas), CategorizarSheet desde la Bandeja (semáforo tappable ✗→✓ con destino Biblioteca + colecciones inline), ItemDetail en página dedicada `/biblioteca/[id]`: nota editable mínima, imagen(s) de arte (upload a `biblioteca-media` o URL), embed YouTube/Vimeo si el link es video, y **conexiones dirigidas idea→idea** con nota "por qué lo conecto" (duplicado bloqueado con copy "Ya estan conectadas").

**Tablas:** `colecciones` (RLS owner, nombre unique por user, color) · `conexiones` (RLS owner, CHECK desde≠hacia, UNIQUE par) · ALTER `ideas` (+coleccion_ids uuid[], +media_url, +nota, +tipo arte en el flujo de categorizacion) · bucket `biblioteca-media` policies owner-only.
**Rutas:** `/biblioteca` · `/biblioteca/[id]` · `/api/colecciones` [GET,POST] · `/api/colecciones/[id]` [PUT,DELETE] · `/api/conexiones` [GET (por item), POST, DELETE] · `/api/ideas/[id]` [PUT extendido con acciones categorizar_biblioteca / regresar_bandeja / archivada] · POST media a bucket vía client RLS.

**Decisiones técnicas:**
- Categorizar vive en el semáforo (la ✗ de IdeaCard es tappable) → un solo sheet; ✓ se muestra con chips visibles.
- Conexión duplicada: UNIQUE (desde_id, hacia_id) en DB + UI disabled (double defense).
- Colecciones como array `coleccion_ids` en ideas (sin FK) para mantener las etiquetas ligero; borrado de colección limpia el array server-side.

**Errores resueltos:** P0 AppShell descartaba children en tab biblioteca (residuo del placeholder del módulo 1) → placeholder solo queda en 'foco' (7328f1a).

**Alineación con FOUNDATION:** punto #7 (biblioteca creativa sin carpetas) y #8 (ideas conectadas); la explicación de items con AI queda para el módulo 3 según el documento.

**Deuda heredada / abierta:** orphan de audio/audio media al eliminar item (limpieza de storage), CSP estricta (report-only activo), rate limit.
