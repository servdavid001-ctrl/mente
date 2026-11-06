# Decisions log (append-only)

[2026-11-01] Proyecto completo: MCP conector + programador/activador se movieron a v2. Razón: dependen de que la v1 exista (tareas, accionable). Afecta: módulo 8 eliminado de v1.
[2026-11-01] Módulo 2: "Biblioteca" genérica se redefine como "Biblioteca creativa" (colecciones de arte, copy, videos, referencias; sin carpetas rígidas). La función "explicar item a demanda" se ancla en el módulo 3 (AI). Razón: refine del alcance ya definido, no nuevo alcance. Afecta: módulos 2 y 3.
[2026-11-01] Backend: Supabase (decision de David). Convex MCP queda deshabilitado en opencode.json. Migraciones via SQL/CLI (sin MCP de Supabase en este host). Afecta: todos los módulos con BD.
[2026-11-01] Nombre del sistema: "mente" provisional hasta decisión final de David.
[2026-11-01] Estructura de la app definida por David: 3 apartados — Foco (proyectos con investigación/notas/tareas, pocos desplegados, resto plegado pero accesible), Bandeja de entrada (todo lo que entra, estado de categorización visible, AI categoriza si es obvio), Biblioteca creativa. Enmienda asociada: la premisa "proyectos siempre visibles" se ajusta a "el usuario decide cuáles se despliegan; el resto plegado pero accesible — el sistema nunca esconde por su cuenta". Afecta: módulos 1 (navegación), 4 (Foco), y modelo de datos global.
[2026-11-01] Deploy #1 y #2 por CLI quedaron UNKNOWN en build (plataforma). Envs de Supabase re-registradas si newline (root cuasa del 401 Invalid API key del QA prod). Vía final: deploy via push a GitHub (proyecto conectado).
[2026-11-01] Deploys CLI zombis (3) cancelados por bloquear la cola del plan free. Deploy via GitHub quedara re-trigger.

## 2026-11-01 - Modulo 3 (AI organizadora)
- Adicion documentada: CHECK tipo de sugerencias incluye 'minuta' (micro-contrato enumeraba 3 tipos; Foundation #6 obliga a la minuta de tareas; 'entidades' queda reservado sin UI).
- entidades jsonb shape: { lista: Entidad[], ai_minuta?: { pasos, guardada } } - la minuta aceptada vive en 'ai_minuta' como base mineralizada del modulo 7.
- Route GET /api/ai/sugerencias nueva (no estaba en el contrato): la Bandeja necesita leer chips pendientes por item.
- Rate limit diario 50 analisis (audit P3-5 pedida al entrar IA); contador sobre sugerencias.creadas del dia, devuelve 429 con copy de spec.
- Sin lucide-react (no nuevas deps sin aprobacion): iconos de entidades son inline SVG con los paths de lucide 16px.
- OPENROUTER_API_KEY no existe en el entorno; provider.ts la soporta como fallback del chat. Transcripcion requiere OpenAI (409 con copy claro si falta).
- ExplicarPanel: el hilo vive en el front (estado local), NO se guarda en DB (simplicidad del micro-contrato).
- Metadatos del detalle muestra estado del semaforo persistente (ajuste pedido del modulo 2) + pill Minuta.

## 2026-11-04 - Release de producción (seguridad + Next 16)
- Proyecto Supabase corregido: `vgtbznppcthyitnzgmlt` (el anterior `emquosormmqyfoxtqtea` estaba borrado). Env de Vercel re-apuntadas.
- Upgrade Next 14.2.35 → 16.4.5 (audit C1: advisories críticos). `middleware.ts` → `proxy.ts`, `cookies()`/`params` async, `createClient()` async. Build verde y `npm audit --omit=dev` = 0.
- Registro cerrado: `disable_signup=true`, password mínimo 12, botón "Crear cuenta nueva" eliminado (contrato single-user del FOUNDATION).
- Rate limit AI atómico: tabla `ai_usage` + RPC `consumir_analisis` (50/día, cuenta intentos, límite fijo en la función). Aplicado en analizar y explicar.
- SSRF: `fetchSeguro` con undici Agent y DNS lookup validado/fijado; rangos IPv4/IPv6 completos; revalidación por redirect.
- Integridad/entrada: validación UUID en conexiones, trigger `validar_conexion_propia`, cotas de URL/audio en ideas, color hex en colecciones, límites MIME/size de buckets y policy DELETE de audio.
- Migración `0005_seguridad.sql` creada, aplicada y registrada.
- Deuda aceptada (no bloqueante): CSP Report-Only con unsafe-eval, cookies no HttpOnly, errores PostgREST crudos, React 18 deprecado, `eslint-config-next` 14.

## 2026-11-05 - Modulos 4-7 (v1 completa)
- Modulo 4: `proyectos` + `objetivos` + `ideas.proyecto_id`; plegado persistente; guardian >3 desplegados o >14 dias sin ideas; copiloto guarda el plan como lineas en `objetivos.descripcion`.
- Modulo 5: captura por token de dispositivo (`device_tokens`, SHA-256; plano solo una vez). `/api/captura` con service role para subir screenshots; extension MV3 en `extension/`. Se revoco SELECT de `token_hash` a authenticated.
- Modulo 6: `share_target` POST multipart + service worker passthrough; `/compartir` exento del proxy pero con auth propia. GET eliminado por CSRF (mutacion solo POST).
- Modulo 7: `tareas` + vista Hoy + conversion idea/plan→tareas (minuta o lineas). Extraccion sin IA.
- Deuda aceptada: rate limits de captura/share, magic bytes, triggers de pertenencia, CSP/cookies, React 18, eslint 14.

## 2026-11-05 - Registro por invitacion y logout
- Registro funcional sin reabrir el signup publico: `/registro` + `POST /api/registro` valida `REGISTRO_INVITE_CODE` (timingSafeEqual) y crea el usuario con service_role + `email_confirm: true`. `disable_signup` sigue en true (signup directo = 422).
- Rate limit del registro: 5 intentos/hora por IP en memoria (best-effort por instancia serverless).
- Logout en el header (`signOut` + redirect a /login); verificado que invalida la sesion (API 401).
- El contrato single-user del FOUNDATION se mantiene: no hay signup publico ni multiusuario abierto; las cuentas se crean con el codigo.

## 2026-11-05 - UI v2 (responsive, ajustes, tema y distribucion)
- Shell dual: movil con bottom nav; desktop (md+) con sidebar 240/256px, header de seccion y contenido con max-width por pantalla. Bottom nav oculta en desktop.
- Biblioteca grid 2/3/4 columnas; detalle y Foco a 2 columnas desde lg; login/registro como tarjeta de 26rem.
- `/ajustes`: Cuenta (cambio de contrasena), Apariencia (Claro/Oscuro/Sistema persistido), Extension (ZIP + tokens), App movil (PWA + APK), AI (estado booleano), Datos (export JSON autenticado), Acerca de.
- Tema oscuro con variables CSS y script pre-paint; contraste AA.
- Extension empaquetada con iconos en `/downloads/mente-extension.zip`.
- APK via Capacitor (WebView de produccion) compilado localmente con JDK 21 + Android SDK 35 y publicado en release `apk-1`. El workflow de CI queda en `docs/ci/` porque el PAT no tiene scope `workflow`.

## 2026-11-06 - Modulo 8: clave AI por usuario (enmienda de implementacion)
- La clave deja de ser solo env (`OPENROUTER_API_KEY`/`OPENAI_API_KEY`): se gestiona en `/ajustes` y vive por usuario en `ai_credenciales` (migracion 0009). FOUNDATION intacto: sigue single-user y la AI sigue sugiriendo con aprobacion; cambia solo el origen de la credencial.
- Un proveedor activo por usuario (OpenRouter u OpenAI), sin fallback cruzado entre claves de usuario. La env queda como fallback de desarrollo si no hay fila.
- Cifrado AES-256-GCM en la app con `AI_KEY_SECRET`: `v2.<iv>.<tag>.<cipher>` con AAD = `user_id` (mover la fila a otro usuario invalida el descifrado); lectura de `v1` por compatibilidad. La DB nunca ve texto plano; rotar el secreto obliga a reingresar la clave (la UI reporta "no configurada").
- `ai_credenciales`: RLS ON sin policies + `revoke all` a anon/authenticated; solo service_role. Verificado en vivo: anon 401/42501, service_role 201/204. El cliente solo recibe `proveedor`, `last4`, `actualizado`; `/api/exportar` no incluye la tabla.
- Validacion al guardar contra endpoint autenticado (OpenAI `/models`, OpenRouter `/key`; `/models` de OpenRouter es publico y no valida). Rate limit 10/h por usuario en memoria (best-effort, consistente con las demas deudas).
- Desviacion justificada del plan: el MCP Supabase global apunta a otro proyecto (`tlkvqcgkrkmtcvutjcbz`); la migracion se aplico via Management API contra `vgtbznppcthyitnzgmlt` y se registro en `supabase_migrations` (version 0009). El MCP sigue pendiente de reinicio.
- Endurecimiento aplicado tras audit: `credencialesUsuario` cae a env si falla la lectura admin (no tumba `/api/ai/*`); errores 500 genericos en la ruta nueva; `Cache-Control: private, no-store`; timeout 30s en chat.
- `.eslintignore` (mobile/, builds, downloads, scripts): el lint vuelve a 0 errores; era el unico fallo del gate local.
