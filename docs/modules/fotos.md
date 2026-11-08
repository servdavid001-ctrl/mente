# Modulo 17 — Fotos en la Bandeja (captura de imagen)

Fecha: 2026-11-08 · Merge main: 35ad4ec · Audit APROBADO · Deploy OK · QA prod PASS

## Qué hace
Botón foto en la barra de captura: jpg/png/webp hasta 8 MB, subida DIRECTA del
browser al bucket biblioteca-media (<uid>/<uuid>.<ext>, policies 0003
owner-only), luego idea tipo 'arte' estado 'bandeja' via branch nueva
kind:'arte' en POST /api/ideas (mediaKey con prefix user + whitelist ext). No
toca el límite 4.5 MB de Vercel (bytes nunca pasan por el server route).
Miniatura en el card con signed URL 300s on demand + placeholder.

## Decisiones
- Subida client-side con supabase-js de sesión (sin bytes en el server)
- Insert falla -> storage.remove con admin (best-effort) — patrón capturaArte
-Sin migraciones, sin dependencias, sin rutas nuevas. <img> con suppress
 comentado igual que LibCard (patrón ya aprobado del repo).

## QA prod
Upload 200 -> idea 201 estado bandeja con mediaUrl ✓ -> mediaKey cross-user
rechazada 400 ✓ -> idea+d_blob borrados (204/200) ✓ residuo cero.

## Menores (audit, backlog)
- Branch arte acepta destino/estado (se sobre-conserva con conservarse que viene
  de la libreta) — documentar o forzar {} en arte.
- MiniaturaArte sin .catch (shimmer eterno si signed falla) + 1 signed por card
  sin cache (n llamadas auth en la lista).

## Alineación
FOUNDATION #1: captura cero fricción desde web/PWA (<5s): fotos ya funcionan
(sin videos — v2, propuesta de David).
