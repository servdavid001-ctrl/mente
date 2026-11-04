
---
## QA REPORT — 2026-11-01 19:22 UTC
URL: https://mente-ten-iota.vercel.app | Activado por: CTO (checklist post-deploy) | Scope: módulo 1
Resultado: 4 OK | 0 P1 | 1 P0

### P0 — CRÍTICOS
#### [ ] Login roto en producción — anon key Supabase rechazada
- Flujo: login en /login con admin@mente.local (password leído de /tmp/opencode/mente-admin.txt, no impreso).
- Síntoma: el click "Entrar" no navega; página se queda en /login sin mensaje de error visible en la UI (también es un bug de feedback, P2).
- Capas: agent-browser (POST https://vgtbznppcthyitnzgmlt.supabase.co/auth/v1/token?grant_type=password → 400) + reproducción cURL directa → HTTP 401 {"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}
- Causa raíz: el NEXT_PUBLIC_SUPABASE_ANON_KEY horneado en el bundle prod (idéntico a .env.local; JWT ref vgtbznppcthyitnzgmlt, role anon, iat 2026-11-01 ~15:03 UTC) es RECHAZADO por Supabase. La clave es válida en parsing pero no reconocida por el backend de auth del proyecto (rotación/invalidación de claves legacy o JWT secret cambiado tras hornear). No es mismatch prod-vs-local: ambas usan la misma clave.
- Archivo: .env.local línea NEXT_PUBLIC_SUPABASE_ANON_KEY + re-secretize en Supabase Dashboard → Auth → API keys; luego re-build.
- Estado: Pendiente (no toco código; requiere clave nueva de David o regeneración en dashboard).

### PASADOS
- [1] Vercel READY: / → 307 a /login → 200, server: Vercel
- [2] Consola: 0 errores/warnings en /login
- [3] Excepciones: 0 (agent-browser errors vacío)
- [8] Headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin + HSTS + Permissions-Policy
- [6 parcial] /login cargó; vitals no medidos (shell no accesible)

### NO VERIFICADOS (bloqueados por P0 login)
- [4] API ideas POST 201/PUT/DELETE en flujo logueado — no ejecutable
- [5] React tree AppShell/BottomNav — no accesible sin sesión
- [6] Vitals del shell — no accesible
- [7] Datos reales: "primera idea en produccion" y link github — no ejecutable

### PENDIENTE DEL CTO (no mío)
- Docs se actualizarán hoy v2 (notas módulo).

### PENDIENTES PARA TROUBLESHOOTER
- [ ] Regenerar anon key válida (legacy o sb_publishable_) para vgtbznppcthyitnzgmlt y actualizar Vercel envs + rebuild
- [ ] Añadir mensaje de error visible en UI cuando signInWithPassword falla (nada en pantalla ahora)

---
## QA REPORT — 2026-11-01 21:0x UTC
URL: http://localhost:3000 (prod local, next-start 20:11 20:11 + build sobrescrito 20:13) | Activado por: David (qa-navigator, módulo 2) | Scope: módulo 2 Biblioteca
Resultado: 0 OK | 1 P0 | 8 escenarios BLOQUEADOS

### P0 — CRÍTICOS
#### [ ] Build roto: chunk hash no existe — app no hidrata (~7 sketches)
- Flujo: abrir /login y /home; no hay sesión.
- Síntoma: página en blanco / skeleton permanente en `/`; NO hay login ni bandeja ni biblioteca.
- Error exacto: `ChunkLoadError: Loading chunk 626 failed. (http://localhost:3000/_next/static/chunks/app/login/page-f8bddd2fbe1981f9.js)` — también chunk `139-9215d0f78e067402.js` → 400.
- Capa: agent-browser (consola) + curl: `/login` HTML estable refiere `app/login/page-f8bddd2fbe1981f9.js` y `139-9215d0f78e067402.js`; ambos devuelven 400. En DISCO existe `139-bc9a84257299dda4.js` (toque 20:13) que el server devuelve 404.
- Causa raíz: `next start` arrancó a 20:11 y el build nuevo se sobrescribió encima a 20:13 → server sirve HTML de un BUILD_ID viejo una vez chunks ya reemplazados en disco. Build en caliente sin reiniciar `next start`.
- Archivo: `/.next/BUILD_ID` desincronizado vs `/.next/static/chunks/…`. Fix: reiniciar `next start` (no tocamos código ni server por instrucción).

### Evidencia
- screenshot: /tmp/opencode/qa-screens/biblioteca-evidencia-p0.png
- otros 8 screenshots previos (01-06 + bandeja) scripts / smoke test en /tmp/opencode/.

### NO VERIFICADOS (bloqueados por P0 build)
- [2] Categorizar idea → CategorizarSheet → colección "prueba" inline → ✗→✓ Biblioteca
- [3] Grid Biblioteca por colección "prueba" + búsqueda
- [4] Detalle conexión con nota "qa" + replicada "Ya estan conectadas" + delete
- [5] Nota editable persistente
- [6] Toggle archivadas (contador)
- [7] 0 errores en consola/red
- [8] Screenshot Biblioteca grid lleno
- Veredicto: RECHAZADO (no se puede pasar en estas condiciones).

### FIXES (Troubleshooter)
- [ ] Servidor: `kill 30945 && next start` (reboot en mismo build ID)
- [ ] Adicional (bloqueado): server dev 400/endpoint desconocido probablemente vìa forzar hardbrowser cache expirada — reinicio mismo ya aplica.

### Verificadas OK en ejecución
- (ninguna, bloqueo del build)

---
## QA REPORT — 2026-11-01 20:41 UTC (RETEST módulo 2 Biblioteca)
URL analizada: http://localhost:3000 (server REINICIADO por CTO, build limpio) | Activado por: usuario | Scope: módulo 2
Resultado: 3 OK | 2 P0 nuevos | 1 P0 re-test

- ChunkLoadError: NO aparece. Chunk 139 / app chunks 200. Login OK (admin@mente.local). Consola 0 errores/warnings, 0 4xx-5xx.
### OK
- [x] S1 Login — POST /auth/token 200, hidratación 0 errores.
- [x] S2 Categorizar — ⋯ → CategorizarSheet → colección "prueba2" inline → POST /api/colecciones 201 → PUT /api/ideas/{id} 200 (estado=biblioteca + coleccion_ids ✓ DB confirmada). Nota: al crear la col. nueva llega SELECCIONADA; click en su chip la deselecciona (comportamiento esperado, no bug).
- [x] S6 Archivadas Bandeja — toggle "Ver archivadas (5)" ↔ "Ocultar archivadas": cuenta cambia, muestra 5 archivadas al activar, oculta al desactivar.
### P0 NO RESUELTOS (nuevos)
- [ ] S3/S4/S5 BLOQUEADOS — /biblioteca SIEMPRE muestra "Tu Biblioteca llega pronto" aunque GET /api/ideas?estado=biblioteca devuelve 1 item (DB confirmada: 1 fila estado=biblioteca no-archivada). Causa raíz verificada en código: Biblioteca.tsx pasa el grid como children de AppShell, pero AppShell.tsx:44-48 hace `{tab === 'bandeja' ? children : <EmptyState/>}` → los children del tab 'biblioteca' NUNCA se renderizan.
### PENDIENTES PARA TROUBLESHOOTER
- [ ] AppShell.tsx:44-48 — condicional children-only para tab 'bandeja'; renderizar children en 'biblioteca' (y revisar 'foco') antes de aplicar vacio cuando items.length===0.
### Archivos
- screenshots: /tmp/opencode/qa-screens/biblioteca.png (evidencia del placeholder), bandeja.png.
- Bug.md raiz elimine; su contenido + esta nueva P0 movidos a docs/history/bugs-log.md (#6, #7).
- Veredicto: RECHAZADO

---
## QA REPORT — 2026-11-04 05:15 (modulo 3 AI, prod local localhost:3000)
URL analizada: http://localhost:3000 | Activado por: CTO | Scope: modulo 3 (AI)
Resultado: 3 OK | 1 P1 | 2 P0

### P0 — CRITICOS
#### [ ] Analisis automatico falla en links de Wikipedia (Esc 2)
- Flujo: pegar https://es.wikipedia.org/wiki/Fotografia en Bandeja -> auto-analisis
- Sintoma: POST /api/ai/analizar -> 500 luego 422 "No encontramos contenido en este link."; sin transcripcion/entidades/conexiones
- Capa: agent-browser + diagnostico local
- Causa raiz: src/lib/ai/fetchSeguro.ts descargarSeguro() hace fetch SIN header User-Agent -> Wikipedia devuelve 403 -> _http_403 -> mapea a 422 falsa "sin contenido" (el HTML es parseable: verificado extraccion local OK, 411KB)
- Archivo: src/lib/ai/fetchSeguro.ts ~linea 80 (agregar headers: {'User-Agent': 'Mozilla/5.0 (compatible)'} en el fetch)
- Estado: Pendiente (troubleshooter)
- NOTA: 500 inicial adicional detectado en POST /api/ai/analizar/5374868f (2x) — probable chat AI fallando; revisar body/capacidad OpenRouter

#### [ ] POST /api/ai/explicar -> 502 (Esc 5)
- Flujo: boton Explicar en item "texto de control"
- Sintoma: panel abre con estado de error y boton Reintentar (sin crash), nunca hay respuesta en 3 secciones
- Capa: agent-browser
- Causa raiz probable: ninguna credencial OpenAI/OpenRouter valida o ambas fallando (chat() lanza AI-500 tras cascada); verificar env vars en el server local
- Archivo: src/lib/ai/provider.ts chat() + ruta /api/ai/explicar
- Estado: Pendiente (troubleshooter)

### P1 — IMPORTANTES
#### [ ] Esc 3/4/6 no ejecutables por bloqueo del P0 de analisis
- Sugerencia de categoria, conexion propuesta y minuta dependen de que el analisis corra. La UI ya renderiza chip "Pedir sugerencia de la AI" (item 8ed35aea) — re-testear tras fix P0.

### FLUJOS SIN ERRORES
- [x] Esc 1 Login: supabase auth token 200, redirect a Bandeja, 0 errores consola
- [x] Esc 7 Resilencia: link example.com/404page -> 422, item visible, mensaje claro, sin crash, sin 'sk-' en payloads
- [x] Esc 8 Consola/red: 0 errores/warnings JS; requests fallidas solo las esperadas (422 analisis, 502 explicar); 0 logs con 'sk-'

### PENDIENTES PARA TROUBLESHOOTER
- [ ] User-Agent en descargarSeguro — src/lib/ai/fetchSeguro.ts:~80
- [ ] Verificar OPENAI_API_KEY/OPENROUTER_API_KEY del entorno local + body real del 502 en /api/ai/explicar
- [ ] Re-ejecutar Esc 2,3,4,5,6 tras fixes

---
## QA REPORT — 2026-11-04 19:05 UTC
URL analizada: https://mente-7ywfj2ksx-servdavid001-2819s-projects.vercel.app (Preview Vercel Ready, deployment protection off, build 18:55 UTC) | Activado por: usuario | Scope: módulos 1, 2 y 3 (Bandeja/Biblioteca/AI)
Resultado: 18 flujos OK | 0 P1 | 1 P0 | 2 P2 · Veredicto: **NO APTO**

### P0 — CRÍTICOS
#### [ ] #8 BottomNav no navega: los 3 apartados son cosméticos y Biblioteca es inaccesible desde la UI
- Flujo: login → Bandeja → tap "Biblioteca" (y viceversa: /biblioteca → tap "Bandeja"/"Foco").
- Síntoma: la pestaña se resalta (`aria-current="page"`) pero la URL no cambia, el header no cambia y el contenido sigue siendo el de la página actual; al pasar a "Biblioteca" desaparece la CaptureBar y no aparece buscador/grid. Desde `/biblioteca`, "Bandeja" deja el grid y el header "biblioteca".
- Evidencia: `S3 FAIL` (`url=/`, `searchInput=0`, `captureInput=0`, `aria-current="Ir a la Biblioteca"`); inverso (`url=/biblioteca`, `searchInput=1`, `cardsBiblioteca=4`, `current="Ir a la Bandeja de entrada"`, `header="biblioteca"`). `GET /biblioteca` directo = 200 con 4 cards (el módulo sí funciona; falla la navegación).
- Capa: navegador real (Playwright headless contra la URL de preview) + código local.
- Causa raíz: `AppShell` guarda el tab en `useState` local (`AppShell.tsx:21`) y `BottomNav` sólo llama a `setTab` (`BottomNav.tsx:56`); no hay `router.push` ni `usePathname`. `AppShell.tsx:40-47` renderiza siempre los children de la página actual y `:50` esconde la CaptureBar según el tab local. `/biblioteca` sólo se alcanza escribiendo la URL.
- Archivo: `src/components/AppShell.tsx:21,40-47,50-51` · `src/components/BottomNav.tsx:56`. Falta `src/app/foco/page.tsx`.
- Fix propuesto: navegación real desde BottomNav (`/`, `/biblioteca`, `/foco`), crear ruta `/foco`, y derivar el tab activo de `usePathname()`/`props.activeTab` (quitar el estado local). Detalle completo en `Bug.md` #8.
- Estado: Pendiente (CTO/troubleshooter). Bug.md creado en la raíz.

### P1 — IMPORTANTES
(ninguno)

### P2 — MENORES
#### [ ] Copy de AI en Bandeja descarta el mensaje claro del servidor
- Síntoma: "Pedir sugerencia" sin keys → API responde `503 {"error":"La AI no esta disponible todavia: agrega tu OPENROUTER_API_KEY en el panel de config"}`, pero la card muestra "No se pudo procesar. Reintentar".
- Causa raíz: `pedirSugerencia()` mapea cualquier `!ok` a `'error'` y `BotonPedirSugerencia` pinta copy genérico.
- Archivo: `src/components/ai/cliente.ts:6-15` · `src/components/ai/BotonPedirSugerencia.tsx:9-16` · `src/components/Bandeja.tsx:226-239`.
- Fix propuesto: estado `'indisponible'` para 503 y mostrar el `body.error` (o toast con el mensaje del servidor).

#### [ ] Auto-análisis de links se dispara sin keys en cada apertura de detalle
- Síntoma: al abrir el detalle de un link se hace `POST /api/ai/analizar/<id>` → 503 y queda "Failed to load resource" en consola cada vez.
- Causa: `ExpansionItem` auto-analiza links sin transcripción en `useEffect` sin comprobar disponibilidad de AI.
- Archivo: `src/components/biblioteca/ExpansionItem.tsx:29-37`.
- Fix propuesto (opcional): gate por disponibilidad de AI o recordar el 503 para no repetir la llamada.

### FLUJOS SIN ERRORES
- [x] S1 Sin sesión → `GET /` 307 → `/login` 200, 1 campo email + 1 password.
- [x] S2 Login: `POST /auth/v1/token` 200, redirect `/`, shell con 3 tabs y `aria-current` Bandeja, header "mente", composer presente.
- [x] S4 Bandeja: `GET /api/ideas` 200 (10), `?archivadas=1` 200 (5), `/api/colecciones` 200 (1), toggle "Ver archivadas (5)".
- [x] S5 Texto: `POST /api/ideas` 201, item visible, composer vacío.
- [x] S6 Link: `POST /api/ideas` 201, DB `kind=link` y `sourceUrl` exacto, card con href exacto → **fix P0 sourceUrl verificado**.
- [x] S7 Archivar + Deshacer: PUT 200, item sale, undo vuelve con PUT 200.
- [x] S8 Archivar sin undo: persiste en `?archivadas=1` (archivada=true).
- [x] S9 Eliminar 2 pasos + Deshacer: DELETE 204 → POST 201 restaura.
- [x] S10 Eliminar sin undo: DELETE 204, ya no existe tras 7s.
- [x] S11 Categorizar + colección existente: PUT 200, `estado=biblioteca`, `coleccion_ids=[prueba2]`, badge ✓.
- [x] S12 Biblioteca: 5 activos/5 cards; filtros Link 2/2, Texto 3/3, Voz 0/0, Arte 0/0; búsqueda 1/1.
- [x] S13 Filtro colección "prueba2": 4/4.
- [x] S14 Detalle + nota: secciones nota/conexiones y botón conectar; PUT 200 y nota persiste tras reload.
- [x] S15 Conexión idea→idea: POST 201; duplicado bloqueado (hint 1 + botón disabled); DELETE 204.
- [x] S16 Explicar sin keys: POST 503 → UI "Tu AI no respondio." + Reintentar, sin crash.
- [x] S17 Sugerencias: `GET /api/ai/sugerencias` 200, 0 pendientes (BD tenía 0 → render de chips N/A).
- [x] S18 Expansión AI en link Wikipedia: `POST /api/ai/analizar` 503 (no 422) y UI "La AI no esta disponible todavia…" → **fix User-Agent de fetchSeguro verificado**.
- [x] S19 Consola/red/vitals: 0 excepciones JS (`pageerror=0`); 3 "Failed to load resource" esperados (422 de un link de prueba inexistente en example.com + 2×503 AI). TTFB servidor `/login` 149-190 ms (curl); FCP/LCP 452 ms, CLS 0.
- [x] Extra: creación inline de colección nueva → aparece seleccionada, PUT 200, filtro devuelve 1; limpieza DELETE 204 (item+colección).
- [x] Auth APIs sin sesión: `/api/ideas`, `/api/colecciones`, `/api/ai/sugerencias`, `/api/conexiones` → 401; rutas HTML → 307 a /login.

### Evidencia
- Capturas: `/tmp/opencode/qa-screens/01-login.png` … `19-coleccion-nueva.png` (03/16/17 son las del P0; 14/15 degradación AI; 11/12/13 nota y conexiones).
- JSON completo: `/tmp/opencode/qa-screens/qa-results-8817999.json`.

### Notas de entorno (no bugs de app)
- `agent-browser` NO está instalado en este host (`command not found`) pese a la premisa; no se reinstaló. Se usó Playwright 1.64.1 + Chromium headless shell en `/tmp/opencode` (fuera del repo). Sin React DevTools nativo; se cubrió DOM/roles/aria, consola, red y vitals.
- El MCP de Supabase apunta a otro proyecto (`emquosormmqyfoxtqtea`) y falla; la BD objetivo `vgtbznppcthyitnzgmlt` se verificó vía REST con `SUPABASE_SERVICE_ROLE_KEY` de `.env.local` (sin exponer secretos). Recomendación: corregir el MCP.
- Vercel Preview: sólo `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`; sin `OPENROUTER_API_KEY`/`OPENAI_API_KEY` → 503 de AI esperado. Login P0 previo (anon key) queda resuelto: token 200.
- Datos restaurados tras el QA: 15 ideas, 5 archivadas, 4 biblioteca, 1 colección, 1 conexión, 0 sugerencias, 0 restos `QA-*`.

### PENDIENTES PARA TROUBLESHOOTER
- [ ] P0 #8 — navegación BottomNav/AppShell + ruta `/foco` (Bug.md #8) — `src/components/AppShell.tsx`, `src/components/BottomNav.tsx`, `src/app/foco/page.tsx`
- [ ] P2 — propagar mensaje 503 de AI en Bandeja — `src/components/ai/cliente.ts:6-15`
- [ ] P2 — evitar auto-análisis repetido sin keys — `src/components/biblioteca/ExpansionItem.tsx:29-37`

### Veredicto
**NO APTO para producción** hasta resolver el P0 #8 (navegación entre los 3 apartados). Los módulos 1 y 2 funcionan correctamente por URL directa; el módulo 3 degrada de forma controlada sin keys.
