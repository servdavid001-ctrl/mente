# Módulo 5 — Extensión de Chrome

## Qué hace
Extensión MV3 para guardar texto, el link de la pestaña, la selección de una web o una captura de pantalla en Mente sin abrir la app.

## Piezas
- `extension/` — manifest MV3, popup y README de instalación.
- `device_tokens` — token por dispositivo; en BD solo SHA-256.
- API de sesión: `GET/POST/DELETE /api/captura/token` (genera/lista/revoca; el token plano se muestra una vez).
- API de captura: `POST /api/captura` con `Authorization: Bearer mente_...` (texto, link, arte).
- UI: tarjeta "Extension de Chrome" en `/foco` para generar y revocar tokens.

## Seguridad
- Token de 256 bits (`randomBytes(32)`), hash SHA-256, comparación por hash; `token_hash` no legible por PostgREST.
- Captura con service role solo en servidor; imágenes ≤10 MB y MIME jpeg/png/webp.
- Screenshot va a `biblioteca-media/<user_id>/<uuid>.<ext>` y crea idea `arte` en Biblioteca.

## Limitaciones
- Sin rate limit específico en `/api/captura` (deuda).
- Capturas >4.5 MB fallan por el límite de body de Vercel (deuda funcional).
- Magic bytes no validados (solo MIME declarado).

## Alineación
FOUNDATION #2 (extensión Chrome: guardar web, screenshot, subrayar).
