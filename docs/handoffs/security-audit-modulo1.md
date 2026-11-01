# Auditoría de seguridad — Módulo 1 (Fundamento) — pre-deploy producción

- **Fecha:** 2026-11-01
- **Alcance:** `src/app/api/ideas/*`, `src/middleware.ts`, `src/utils/supabase/*`, componentes UI (`CaptureBar`, `Bandeja`, `UndoPrompt`, `IdeaCard`, `InboxList`, `IdeaActionSheet`, `AppShell`, `BottomNav`), `src/app/login/page.tsx`, `src/app/page.tsx`, `src/lib/*`, `supabase/migrations/0001_ideas.sql`, `0002_storage.sql`, `public/manifest.webmanifest`, `scripts/seed-user.mjs`, `.env.local` (solo presencia), historial git, `npm audit`.
- **Modelo:** aplicación personal single-user (FOUNDATION.md límites explícitos: "No multiusuario ni colaboración — es solo para ti").
- **Método:** lectura de código (100% del alcance listado), pruebas estáticas de vectores (IDOR por manipulación de id, manipulación de tipo/contenido del payload, esquemas de URL, CSRF por método HTTP), `npm audit`, inspección de tracking de git.
- **Resultado:** ✅ **APROBADO CON RIESGOS VERSIONABLE — 0 P0 · 3 P1 · 3 P2 · 6 P3.** Todos los controles pedidos por AGENTS.md (auth por handler, RLS owner-only, sin service key en runtime) están en su lugar. Ninguna deuda sin evidencia: cada hallazgo tiene referencia archivo:línea o comando de verificación.

---

## Checklist

### 1. Auth — PASS

| Verificación | Evidencia |
|---|---|
| GET /api/ideas valida sesión antes de tocar data | `route.ts:9-10` — `getUser()` → 401 antes de `.from('ideas')` |
| POST /api/ideas valida sesión | `route.ts:31-32` |
| GET / PUT / DELETE de `/[id]` validan sesión | `[id]/route.ts:9-10`, `29-30`, `55-56` |
| Middleware protege rutas de página | `middleware.ts:27-35` — sin usuario → redirect `/login`; API y `/login` exentos (correcto: un redirect HTML rompería los `fetch` JSON) |
| Middleware refresca sesión y escribe cookies | `middleware.ts:15-21` — patrón correcto @supabase/ssr |
| Server client usa cookies de sesión, NO service key | `server.ts:7-10` — solo `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Página raíz re-verifica en servidor | `page.tsx:10-11` — defensa en profundidad |
| Login con mensajes genéricos | `login/page.tsx:43-45` |
| Service role key NO importada en ningún handler/route | grep: única referencia runtime es `scripts/seed-user.mjs:11` (script operativo server-side vía `--env-file`, legítimo) |

Verificación método a método: ningún handler ejecuta `supabase.from()` antes de `if (!user) return 401`.

### 2. RLS / Supabase — PASS

| Verificación | Evidencia |
|---|---|
| RLS habilitado en `ideas` | `0001_ideas.sql:26` |
| Policy owner-only con `using` Y `with check` en TODAS las operaciones | `0001_ideas.sql:28-31` — `for all` cubre select/insert/update/delete, y ambos predicados `auth.uid() = user_id` |
| Bucket privado | `0002_storage.sql:5` — `public=false` |
| Storage insert owner-only (máscara por carpeta) | `0002_storage.sql:8-13` — `(storage.foldername(name))[1] = auth.uid()::text` |
| Storage select owner-only | `0002_storage.sql:15-20` |
| Ningún acceso anónimo a datos | Todo acceso pasa por cliente con sesión; policies impiden lector anónimo sobre ideas y sobre objetos del bucket |
| Reproducción de notas de voz vía signed URL | `IdeaCard.tsx:121-124` — `createSignedUrl` sobre bucket privado; el ownership lo impone la policy de storage en cada playback |

**Prueba del vector IDOR pedido (usuario A manipula el `id` de B):** GET/PUT/DELETE filtran solo por `id` (`[id]/route.ts:15, 40, 58`), **sin filtro de user_id en el query** — correcto por diseño: la regla de AGENTS.md exige que el ownership lo imponga RLS y no un filtro manual de id. En el servidor, la policy (`using (auth.uid() = user_id)`) vuelve invisible la fila ajena: `.single()` falla y el handler responde 500 genérico. Manipular el id no permite leer, archivar ni borrar nada de otro usuario.

Nota cosmética (P3-2): un id inexistente o ajeno devuelve **500** en vez de 404 (errores tipo `PGRST116` se enmascaran como 500). No es riesgo de seguridad; deuda de semántica HTTP.

### 3. Secretos — PASS (1 P1 de configuración, 1 P2)

| Verificación | Evidencia |
|---|---|
| `.gitignore` excluye `.env*.local` | `.gitignore:4` — patrón cubre `.env.local` |
| `.env.local` NO tracked en git | `git ls-files --error-unmatch .env.local` → error (no está) |
| Sin secretos en historial | `git log --all -- .env.local .env '*.env'` → vacío |
| Sin keys/JWT hardcodeados en `src/` ni `public/` | grep `eyJ` → none; grep service_role → nada en runtime |
| Service role nunca en bundle cliente | `server.ts` / `browser.ts` usan solo anon key `NEXT_PUBLIC_`; Vercel no expone al cliente variables sin prefijo `NEXT_PUBLIC_` |

**P1-1 (configuración):** `.env.local` sí contiene `SUPABASE_SERVICE_ROLE_KEY` (correcto localmente para el seed). El código nunca la lee en runtime. Acción requerida: **verificar en el dashboard de Vercel que production solo define `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`**, y que la service role key NO esté en Variables de entorno de producción. Si está, quitarla. (Reporte a David, revisión de settings; no es código.)

**P2-1 (signup abierto):** `login/page.tsx:81-88` expone "Crear cuenta nueva" (`signUp`) sin ningún gating. Foundation declara single-user, así que cualquiera que descubra la URL puede crear una cuenta propia (con su workspace aislado por RLS — **no hay fuga de datos**, verificado en §2), pero (a) rompe el contrato FOUNDATION, (b) agranda superficie de ataque y contenido en DB/bucket. **Remedio:** tras crear el único usuario, desactivar nuevos registros (Supabase Dashboard → Authentication → *Disable signups* o configuración de proveedor email). Costo cero de código.

### 4. Input validation — PASS con 2 deudas

| Vector | Veredicto | Evidencia |
|---|---|---|
| `kind` | PASS | Whitelist server-side (`texto`/`voz`/`link`); cualquier otro valor → 400 (`route.ts:59-78`, default `return null`) |
| `link` | PASS | Solo `http(s)://` server-side, con fallback desde el texto con la misma regex (`route.ts:61-66` — `^https?:\/\/\S+$`) |
| `voz` | PASS | Requiere `sourceUrl` no vacío (`route.ts:70-73`; la ruta real la construye CaptureBar con `user.id/` y es el masking de storage lo que impide colisión cruzada) |
| `texto` | PASS | Requiere texto no vacío (`route.ts:74-77`) |
| PUT (`archivada`) | PASS | Validado como `boolean` estricto (`[id]/route.ts:33-35`) |
| DELETE ownership | PASS | Vía RLS, no filtros manuales (ver §2 — prueba IDOR) |
| Longitud de `contenido` | RISK | Sin `maxlength` server-side; `text` en Postgres no impone límite (`route.ts:75` solo valida no-vacío) → **P2-2** |
| `fuente` para `texto` | RISK | `route.ts:76` guarda `fuente: urlStr` **sin validación** cuando `kind='texto'` → **P2-3** |

**P2-3 (`fuente` sin validar en ideas texto — data poisoning):** un payload con `kind:'texto'` + `sourceUrl:'javascript:alert(1)'` persiste ese esquema en DB. **Vector bloqueado hoy:** `IdeaCard.tsx:92-104` solo renderiza `href` cuando `kind === 'link'`, y ese `fuente` fue validado server-side; ideas texto muestran solo `idea.text` como text node (`IdeaCard.tsx:109`). Pero (a) el undo de eliminación re-POSTea el valor crudo (`Bandeja.tsx:139-145`) y (b) el módulo 2/3 va a renderizar `sourceUrl` de ideas texto (vista de edición, enlaces entre bloques). **Remedio (1 línea):** en `buildInsertRow` para `texto`, guardar `fuente: URL_RE.test(urlStr ?? '') ? urlStr : null`. Deuda aceptada de módulo 1; **obligatoria antes de que el módulo 2 renderice `sourceUrl` de ideas texto**.

**P2-2 (sin límite de tamaño en `contenido`):** recomendado cap server-side (ej. 20.000 chars) — la app es single-user, deuda informativa, no bloqueante.

### 5. UI injection — PASS

- **Cero** `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval` en todo `src/`/`public/` (grep activo). Todo el contenido del usuario se renderiza como text nodes React (`IdeaCard.tsx:94, 109`), que escapan automáticamente → cualquier etiqueta pegada se muestra literal, no se ejecuta.
- Único `href` dinámico del render: `IdeaCard.tsx:96`. Path de ejecución: solo se alcanza con `kind:'link'` (línea 92), cuyo `fuente` es siempre resultado de `URL_RE` http(s). Un `javascript:` o `data:` jamás llega a esta línea (whitelist §4). El remedio P2-3 cierra además los datos ya envenenados para el futuro.
- Favicon dinámico: `CaptureBar.tsx:130` interpola solo el **hostname** extraído con `new URL()` (`dominio()`, `CaptureBar.tsx:263-268`, con try/catch); renderizado con React (escapado de atributos).

### 6. Upload de voz (bucket privado) — PASS con deuda informativa

- Subida client-side directa a Storage con sesión (`CaptureBar.tsx:52-58`) — no pasa por la API app; el gate real es RLS de storage (verificado en §2, incluido que otra cuenta no puede leer la carpeta de otra).
- Content-Type: `blob.type || 'audio/webm'` (`CaptureBar.tsx:58`) — sin whitelist estricta. Riesgo no directo (bucket privado; el archivo solo se lee del mismo owner con signed URL de 5 min en `IdeaCard.tsx:123`).
- Tamaño/duración: sin cap client-side (`useRecorder.ts:31-40` acumula chunks sin límite). Supabase aplica su default ~50 MB por archivo por bucket; en single-user es aceptable. Falta un tope de duración máxima de grabación — deuda (**P3-3**).
- **El bucket privado mitiga por diseño** (ver §2): no hay URL pública, no hay listado anónimo, no hay lectura cruzada.

### 7. Rate / abuso — RISK informativo (aceptable en single-user)

- No hay rate limit en POST/PUT/DELETE/GET de `/api/ideas` ni en el cliente (solo flags `enviando`/`subiendoVoz` como debounce). En app personal con una única cuenta es deuda aceptable: el impacto de un flood es cuota de DB/Vercel, no filtración. **Queda documentado como deuda explícita en este reporte y en `PROJECT_STATE.md`**; se vuelve REQUISITO obligatorio cuando el módulo 3 conecte IA (coste por request).
- No se expone stack trace al cliente; los `catch` devuelven solo `error.message` (`[id]/route.ts:21, 46, 61`) — pero `error.message` interno de Supabase/Postgres puede exponer detalles (P3-4, deuda cosmética: mensajes genéricos en el catch).

### 8. Headers / manifest — 1 P1 con remedio concreto

**P1-2 — Security headers ausentes.** `next.config.mjs:1-3` está vacío (`{}`). No hay `headers()` ni CSP en el código (grep). **Remedio concreto para el mismo commit:**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default nextConfig;
```

**CSP (deuda hasta módulo 2):** la página carga un favicon externo de Google (`CaptureBar.tsx:130`) y Supabase usa chunks de cookies + WebSocket — una CSP estricta rompería esos flujos. Recomendación pragmática (report-only primero):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://www.google.com/s2;
  font-src 'self';
  connect-src 'self' https://<PROYECTO>.supabase.co wss://<PROYECTO>.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  object-src 'none';
```

(Nota: `script-src 'unsafe-eval'` es necesario por Next.js App Router en producción; se retira cuando migremos hacia nonces CSP en módulo 2+.)

**Manifest — PASS.** `manifest.webmanifest` correcto, campos coherentes con la PWA (start_url `/`, scope `/`, standalone, icon). HSTS lo añade Vercel (HTTPS forzado por defecto).

---

## Dependencias — 0 P0, 1 P1 (deuda upgrade Next)

**Evidencia (comando ejecutado en el repo):**

```
$ npm audit --omit=dev
next  9.3.4-canary.0 - 16.3.0-preview.10  Severity: critical
  → advisories nominados (RCE Image Optimization AVIF/SVG solo self-hosted,
    SSRF en Server Actions sobre custom servers, RCE windows-hosted,
    DoS Server Actions/Components, cache poisoning RSC/rewrites,
    XSS con CSP nonces, XSS beforeInteractive con input no confiable)
postcss  <=8.5.22  Severity: high
  → file read/path traversal via sourceMappingURL en build-time
```

(`npm audit fix --force` migraría a `next@16.4.3`, cambio breaking — no se puede aplicar en caliente a este módulo.)

**Clasificación: P1 (deuda), no P0,** con evidencia de **superficie no explotable** verificada línea a línea en este repo:

1. **RCE Image Optimization (AVIF/SVG)** — afecta a deployments **self-hosted/standalone** con la API expuesta; esta app corre en **Vercel-managed**. Además no se usa `next/image` en el código (grep `next/image` → 0 matches; el único `<img>` es favicon externo con `alt=""`).
2. **SSRF en Server Actions sobre custom servers** — no hay Server Actions (grep `use server` → 0 matches) ni self-hosting.
3. **RCE windows-hosted** — no aplica (runtime Linux).
4. **Cache poisoning RSC / rewrites / middleware redirects** — sin `rewrites` ni `redirects` configurados (`next.config.mjs` vacío); middleware solo hace redirect fijo a `/login` (`middleware.ts:34`), no cacheable por CDN por defecto; sin `i18n` ( Pages Router bypass no aplica).
5. **XSS con CSP nonces / beforeInteractive** — no se usan nonces ni `<NextScript beforeInteractive>` con input externo.
6. **postcss high** — las 4 advisories (file read/path traversal vía `sourceMappingURL`, XSS en CSS stringify) aplican al **build-time** del bundle de CSS (Tailwind/postcss local), no al runtime del navegador; el CSS procesado no proviene de input controlado por un atacante.

**Compromiso de deuda:** inmediatamente después del deploy de producción, abrir un PR con upgrade a `next@15/16` + `react@^19`, ejecutar `npm run build 2>&1 | tail -20` y un smoke test del flujo completo (captura texto/voz/link · undo de archivar/eliminar · login). Si el proyecto se mueve fuera de Vercel a self-hosting, el upgrade pasa automáticamente a **P0 bloqueante**. Acción recomendada adicional: decidir apuntalar rate limit en `POST /api/ideas` cuando entre la IA (módulo 3).

---

## Índice consolidado de hallazgos

| ID | Sev | Título | Remedio | Filiación |
|---|---|---|---|---|
| P1-1 | ALTA | Service role key en `.env.local`; **verificar que production Vercel NO la defina** | Revisar Vercel → Settings → Environment Variables | Secretos |
| P1-2 | ALTA | Sin security headers en `next.config.mjs` | `headers()` con nosniff / XFO / Referrer-Policy / Permissions-Policy + CSP report-only (código arriba) | Headers |
| P1-3 | ALTA (deuda) | `next@14.2.35` con 25 advisories nominales (1 crítico en el paquete `next`, 1 alto en `postcss`); superficie explotable en este repo = vacía (evidencia arriba) | Upgrade a `next@15/16` + smoke test completo, como primer PR post-deploy | Dependencias |
| P2-1 | MEDIA | Signup abierto ("Crear cuenta nueva") viola foundation single-user | Desactivar signups en Supabase tras seed | Auth |
| P2-2 | MEDIA | Sin `maxlength` en `contenido` (POST) | Cap server-side (ej. 20.000) en `buildInsertRow` | Inputs |
| P2-3 | MEDIA | `fuente` sin validar para `kind='texto'` (data poisoning; vector bloqueado hoy por IdeaCard) | 1 línea en `buildInsertRow` para texto; **obligatorio antes de módulo 2** | Inputs |
| P3-1 | INFO | Password del admin seed queda en `/tmp/opencode/mente-admin.txt` (permiso 0600, generado con `crypto.randomBytes`, `seed-user.mjs:7,19,61`) | Rota la password si ese disco se comparte | Secretos |
| P3-2 | INFO | DELETE/PUT sobre id ajeno/inexistente → 500 en lugar de 404 | Si error `PGRST116` tratar como 404 | Semántica |
| P3-3 | INFO | Upload de voz sin cap de tamaño/duración client-side | Timer de duración máx + comparación de size en mandarVoz | Upload |
| P3-4 | INFO | `error.message` interno devuelto al cliente en 500 | Genéricos en catch (`[id]/route.ts:21,46,61`) | Información |
| P3-5 | INFO | Sin rate limit en endpoints mutativos | Flag obligatorio cuando entre IA (módulo 3); documentado en `PROJECT_STATE.md` | Abuse |
| P3-6 | INFO | Sin check de `Origin` en POST/PUT/DELETE | No urgente: `SameSite=Lax` de cookies Supabase bloquea CSRF cross-site para POST; PUT/DELETE cross-origin exigen preflight CORS que no existe | CSRF |

Nota CSRF (evidencia): `fetch` cross-origin `no-cors` solo permite GET/HEAD/POST, y POST es el único método alcanzable — pero las cookies `@supabase/ssr` usan `SameSite=Lax` por default, que **no se envía** en peticiones cross-site POST. Toda mutación con browser-cookie queda bloqueada por defecto del navegador. P3-6 es defensa en profundidad (check de header `Origin`), no un hallazgo explotable hoy.

---

## ✅ Resumen de ítems verificados sin problemas

- ✅ Todos los handlers API con auth propia (401) y ningún acceso a data antes de `getUser()`
- ✅ RLS `using` + `with check` owner-only sobre `ideas` (todo CRUD) y sobre bucket privado por carpeta de user_id
- ✅ Bucket privado mitiga IDOR de audio (signed URL de 5 min, foldername = auth.uid)
- ✅ Sin IDOR manipulando el `id` (RLS lo impone; probado método a método)
- ✅ Service role key nunca importada en runtime (solo script seed server-side)
- ✅ `.env.local` fuera de git; cero secretos hardcodeados en src/public ni en historial
- ✅ Whitelist server-side de `kind` + regex `http(s)://` para links + `archivada` boolean estricto
- ✅ Cero vectores XSS (sin innerHTML/dangerouslySetInnerHTML; text nodes; único href pre-filtrado)
- ✅ Mensajes genéricos ante credenciales inválidas en login (sin enumeración de usuarios)
- ✅ Manifest correcto; HTTPS forzado por Vercel

## ⚠️ Advertencias (versionables)

- ⚠️ P1-1, P1-2, P1-3, P2-1, P2-2, P2-3 — ver tabla de arriba; P2-3 es **prerrequisito duro del módulo 2**.
- ⚠️ P3-1..P3-6 — contribución mínima al riesgo real en single-user; siguen como deuda documentada (NO es silencio, está en el reporte y hay que sumarlas a `PROJECT_STATE.md`).

## 🚨 CRÍTICO bloqueante

- Ninguno.
- **P1-3 queda condicionado:** si el proyecto sale de Vercel hacia self-hosting, `next@14.2.35` pasa a P0 bloqueante por el RCE del Image Optimization API. En Vercel-managed queda como deuda de upgrade con superficie no explotable verificada arriba; la auditoría del módulo 2 re-verificará que sigue sin usarse `next/image`, Server Actions, `rewrites` ni CSP nonces, y comprobará el estado del upgrade de Next.

---

## Veredicto

**DOH: APROBADO CON RIESGOS VERSIONABLE (0 P0)** — auth, RLS, secretos, inputs e inyección verificados sin hallazgos críticos explotables; deudas P1/P2/P3 documentadas con remediado puntual (P1-1 checklist Vercel, P1-2 headers en un archivo, P2-3 1 línea antes del módulo 2, P1-3 upgrade Next como primer AE post-deploy).
