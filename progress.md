
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
