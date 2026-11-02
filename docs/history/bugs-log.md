# Bug.md — Mente (errores P0/P1)

Formato: diagnóstico #N numerado, historial, estado `Pendiente` → `Corregido con commit <hash>`.

---

## Diagnóstico #1 (QA en vivo 2026-11-01, localhost:3000 prod) — Capturar link falla con error genérico y no guarda
- **Severidad:** P0 (flujo core de captura, Escenario 4 del handoff `docs/handoffs/modulo1-ui-spec.md`)
- **Flujo:** usuario escribe o pega `https://example.com/articulo` y envía.
- **Síntoma:** la idea no aparece; toast genérico (`ERROR_ENVIO`) tras ~1s. Optimistic item se elimina.
- **Evidencia:** 3× `POST /api/ideas → 400` desde la Bandeja (agente-browser, network log). Captura de texto ASCII (`kind:'texto'`) sí funciona (201).
- **Capa:** agent-browser + código local (contrato frontend/backend).
- **Causa raíz:** desalineación de contrato. `CaptureBar.tsx` envía `{ text: url, kind: 'link', sourceUrl: undefined }` cuando el usuario teclea una URL (línea 27). El servidor (`src/app/api/ideas/route.ts` → `buildInsertRow`) solo acepta `sourceUrl` para `kind === 'link'` y lee `sourceUrl`, no `text`; con `sourceUrl` undefined devuelve `null` → `400 'Datos de la idea invalidos'`.
- **Archivos:**
  - `src/components/CaptureBar.tsx` línea 27 (constructor de payload)
  - `src/app/api/ideas/route.ts` líneas 51-56 (`buildInsertRow`, rama `kind === 'link'`)
- **Fix propuesto (uno de dos):**
  1. Backend: en la rama `kind === 'link'`, aceptar `urlStr = sourceUrl ?? (URL_RE.test(text) ? text.trim() : null)`.
  2. Frontend: enviar `{ kind: 'link', sourceUrl: t, ... }` (y mover `text` a un campo no usado por el insert).
  - Preferir (1): mantiene el contrato estable para el pegar-link futuro (botón link).
- **Estado:** Pendiente → (troubleshooter)

## Diagnóstico #2 (QA en vivo 2026-11-01) — Toast de error al capturar observa texto con tilde / genérico
- **Severidad:** P2 (copys y regla de estilo)
- **Síntoma:** al fallar el POST de link el usuario solo ve `ERROR_ENVIO` (mensaje genérico), sin distinguir contrato vs red.
- **Causa raíz:** `Bandeja.tsx` `enviarIdea` descarta el cuerpo del response (`if (!res.ok) throw`) en vez de leer `{ error }` (líneas 55-74).
- **Archivo:** `src/components/Bandeja.tsx` líneas 55-67.
- **Fix propuesto:** leer `await res.json()` en `!res.ok` y mostrar `(json as {error:string}).error` cuando exista.
- **Estado:** Pendiente

## Diagnóstico #3 (QA en vivo 2026-11-01) — favicon.ico 404
- **Severidad:** P2
- **Síntoma:** `GET /favicon.ico → 404` (solo chrome heredado; `icon.svg` 200).
- **Causa propuesta:** no hay `favicon.ico` en `src/app` con Next 14 `appDir` (basta `icon.svg`, chorme antiguo pide `.ico`).
- **Fix propuesto:** opcional: `app/favicon.ico` o reescritura en `next.config.mjs`.
- **Estado:** Pendiente

## Diagnóstico #4 (QA en vivo 2026-11-01) — Prompt de Deshacer aparece con ~1s de retraso
- **Severidad:** P2 (delay intrusivo; ventana sigue siendo 6s desde el mount)
- **Síntoma:** al archivar/eliminar, el `UndoPrompt` tarda ~0.9-1.2s en aparecer (poling 300ms observado). La ventana de 6s empieza tras el mount, así que el margen real del usuario queda reducido.
- **Causa raíz:** `setUndo` se llama después de `await fetch(...)` (PUT/DELETE), no optimistamente.
- **Archivo:** `src/components/Bandeja.tsx` líneas 72-96.
- **Fix propuesto:** mover `setUndo(...)` antes del fetch y sanear si falla (revertir lista). CONFIRMAR PRODUCTO antes, semántica actual es "undo solo si servidor confirmo".
- **Estado:** Pendiente

## Diagnóstico #5 (QA en vivo 2026-11-01) — Re-test fix P0 blockeado: servidor sirve build desincronizado, Bandeja inaccessible
- **Severidad:** P0 (re-test del fix P0 de captura de link NO puede ejecutarse)
- **Sintoma:** login OK (admin@mente.local, credencial valida), tras navegar a la ruta principal aparece "Application error: a client-side exception has occurred". Console: `ChunkLoadError: Loading chunk 931 failed (page-807e8acca7fd45ce.js)` -> 404; el”。“ chunk que SI referencia el HTML servido (`page-ea53298666f9e1e1.js`) tambien devuelve 404. Ningun chunk de `/` existe en disco.
- **Causa raiz:** proceso `npm start` (PID 14647, iniciado 13:10) sirviendo memoria de un build anterior; `.next` en disco fue recompilado despues del arranque (BUILD_ID `Pe6e-Qoh6WCbj-WZ0uCAn3`,unicos chunks app en disco: `page-e19865751c9b45d7.js` + `login/`, `_not-found`). El proceso expone HTML/manifest del build viejo y sus chunks ya no existen -> 404 -> ChunkLoadError tras el login. No es cache del navegador: reproducido con perfil 100% limpio.
- **Archivo/proceso:** no es codigo fuente; es el proceso `next start` corriendo con build residual. Fix: REINICIAR `npm start` (relaunch con build actual en disco) y re-ejecutar el re-test completo (pasos 2-5 pendientes).
- **Estado:** Pendiente (qa-navigator no restart servidores por instruccion del CTO)

## Diagnóstico #6 (QA en vivo 2026-11-01 ~21:0x UTC) — P0 — Build desincronizado: chunks app/login inexistentes (400) en next start sin reiniciar
- **Flujo:** abrir `/login` o `/` → página en blanco / skeleton permanente; app no hidrata.
- **Error exacto:** `ChunkLoadError: Loading chunk 626 failed. (/_next/static/chunks/app/login/page-f8bddd2fbe1981f9.js)`. También `139-9215d0f78e067402.js` → 400.
- **Causa raíz:** `next start` (PID 30945, arrancado 20:11) sirvió HTML de un BUILD_ID viejo mientras el build nuevo (20:13) ya había reemplazado los chunks en disco. Mismatch build/servidor, no código.
- **Estado:** Corregido por reinicio de `next start` (restart 21:11). *Re-verificado en este re-test 20:41 UTC: chunk `139-bc9a84257299dda4.js` sirve 200 y login hidrata sin errores.*
- **Nota:** este es el mismo bug con nuevo incidente, numeración nueva porque ambos incidentes añadidos en la misma fecha.

## Diagnóstico #7 (QA en vivo 2026-11-01, 20:37 UTC) — P0 — Página /biblioteca SIEMPRE muestra placeholder “Tu Biblioteca llega pronto”
- **Severidad:** P0 (bloquea los escenarios del módulo 2 Biblioteca).
- **Flujo:** login OK → categorizar una idea con 🟢 → navegar a `/biblioteca` → heading placeholder, pagina vacía.
- **Causa raíz verificada en código:**
  `src/components/AppShell.tsx` debe entrar por la condición `tab === 'bandeja'` para renderizar `props.children` y terminar con `<EmptyState …>` en cualquier otro tab. La orquestadora `src/components/biblioteca/Biblioteca.tsx` monta `<BibliotecaGrid …>` como children de `<AppShell activeTab="biblioteca">`, así que si datos nos cargan, NUNCA son renderizados.
- **Archivo:** `src/components/AppShell.tsx` (líneas 45-49 aprox) — bypass completo de los children para el tab `biblioteca`.
- **Estado:** RESUELTO 2026-11-01 (troubleshooter): AppShell ahora renderiza `props.children` para `bandeja`/`biblioteca` y conserva el placeholder solo para `foco`. Build verde + re-test en vivo S3-S6 PASS (ver PROJECT_STATE).

## Historial
- 2026-11-01 — QA en vivo por qa-navigator. 4 diagnosticos. URL: http://localhost:3000 (prod local).
- 2026-11-01 — QA en vivo por qa-navigator. Diagnóstico #5 añadido: re-test fix P0 blockeado por build desincronizado en server (P0). Fix requerido: reiniciar npm start, luego re-test pasos 2-5 del plan.

---
## QA RETEST FINAL P0 (captura de link) — 2026-11-01
URL: http://localhost:3000/bandeja (login admin@mente.local OK) | Scope: re-test P0 fix link
PASS · FIX VERIFICADO:
- Composer pega link "https://example.com/articulo" → item tipo LINK renderizado (IdeaCard.tsx:92, href sourceUrl) + POST /api/ideas 201 (no 400).
- Composer texto "texto de control" → guarda OK + POST /api/ideas 201.
- Consola: 0 errores / 0 warnings. Chunks correctos (404 inicial solo pre-fallback).
- Screenshots: qa-link-item.png, qa-texto-control.png.
Cierre: P0 "captura de link" resuelto y verificado. Sin regresiones detectadas.
