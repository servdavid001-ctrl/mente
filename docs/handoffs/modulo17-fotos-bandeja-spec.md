# Spec — Modulo 17: Fotos en la Bandeja (captura sin fricción, FOUNDATION #1)

APROBADO por David ("si todo" al plan; video queda v2). Tabla de invariantes:
el sistemaajejesto ya existe; el captura usa DIRECTO al cliente (no server body).

## Cómo sube la foto (flujo)
1. CaptureBar (barra de captura de la Bandeja): botón cámara/foto (aria-label).
   `<input type=file accept="image/jpeg,image/png,image/webp" capture? movimiento de nombre>`
2. Validación cliente: mime de la lista (jpeg/png/webp), tamaño <= 8 MB,
   elegir nombre determinista según la extensión. Sin batería de errores: mensajes
   genéricos visibles.
3. Subida DIRECTA al storage con el cliente supabase (sesion del usuario):
   bucket `biblioteca-media`, ruta `<uid>/<uuid>.<ext>` (policies de 0003 ya
   permiten al propietario escribir su carpeta — NO nuevas policies).
4. POST /api/ideas con branch NUEVA kind:'arte' (photo): body
   { kind:'arte', mediaKey:'<uid>/<uuid>.<ext>' } — el server VALIDA que la
   ruta pertenezca al usuario (prefix `${user.id}/`) y construye fila igual
   a construirArte (tipo 'arte', estado 'bandeja', media_url), SIN aceptar
   campos adicionales. Si algo falla, borrar el objeto del storage si
   es posible (remove con admin para no dejar basura).
5. UI: button fotografía es el mismo estilo de la barre ya existente (mod 1).
6. Miniatura en el card: Bandeja preview va aquí (con imagen -> mostrar img
   mediaUrl 48x64 rounded, loading lazy, placeholder). Está permitido de la
   misma regla de módulo: `<img loading=lazy>` con warning lint aceptado.

## Reglas / límites
- Sin migraciones (bucket+policies 0003 ya existen), sin rutas nuevas (solo
  branch nueva en el POST de /api/ideas), sin dependencias (supabase-js ya está).
- El video NO en v1 (aceptar solo image/*). Regla v2 del FOUNDATION.
- Sin tildes JSX, aria-label, commits `feat: fotos...`, rama feat/fotos-bandeja-m17,
  NO push a main. No tocar modulos 9/10/extensión/mcp/pages/recados.
- CUE specs: photos quedan "visible abajo" del composer si composición nueva in
  createo,solo ideas captured no post-crear (Glad aún v1).

## Criterio de terminado
build/tsc/lint 0 · auth de la branch nueva (idea propietaria, ruta con prefix
de usuario, mime permitido) · QA prod con foto real: subir -> idea en bandeja,
miniatura visible en el card. El CTO hará QA con sesión y limpiará residuo.
## Verificación final antes de reportar
build canónico: build EXIT 0, tsc 0, lint 0 errores; listar archivos tocados; si
aviso leakage en cualquier defecto de flujo, describirlo sin arreglarlo.
