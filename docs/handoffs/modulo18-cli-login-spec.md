# Spec — Modulo 18: CLI login para MCP (device flow) + Camara en captura

Pedido David 2026-11-08: "existen mcps que se conectan con login, cli login;
el nuestro podria tener esa opcion" + "deberia permitir tomar foto también,
desde la galeria o desde tomar la foto".

## A. Device flow del MCP (login por CLI)
Ruta del flujo:
1. CLI: POST /api/mcp-login/start {"nombre":"opencode"} (rate limit basica;
   publico pero cap) -> {device_code, url: https://.../conectar?device=<code>,
   expira_en: 900}
2. El usuario abre la URL -> page /conectar (server-side auth: redirect /login
   con return). Muestra: 'La CLI <nombre> pide acceso a tu cuenta Mente.
   Expira en 10 min.' -> boton Autorizar (o Rechazar).
3. POST /api/conectar/aprobar {device_code, aprobar:boolean} (auth sesion):
   lookup por hash del code (admin), estado pendiente y no expirado.
   Si aprobar: crear worker_token (mismo patron del POST /api/ajustes/tokens:
   mt_ + sha256, nombre=worker) y marcar solicitud {estado:'aprobado',
   user_id, token_id}. Si rechazar: estado 'rechazado'. Respuesta UI solo
   devuelve el RESULTADO (NO el token — el token nunca pasa por el browser UI).
4. CLI: POST /api/mcp-login/poll {device_code} (cap 200/intento per code? la
   misma rate limit global) — estados:
   pendiente -> {estado:'pendiente'} · aprobado -> {estado:'granted', token:
   mt_... , user_id} (UNA VEZ: al entregar pasa a 'entregado'; si pierde el
   token, honroso rehacer) · rechazado/expirado -> error de fin.
5. El token resultante vive/revoca EXACTO igual que los tokens de /ajustes
   (aparece en la lista 'Acceso para agentes'); log token_acciones usa el
   mismo canal. 401 en /api/mcp no cambia nada.
### Migracion 0013_login_solicitudes.sql (solo archivo)
create table login_solicitudes (
  id uuid pk, device_code text not null unique,   -- sha256 hex (nunca plain)
  nombre text not null check char_length 1-40,
  estado text not null default 'pendiente' check in ('pendiente,'aprobado',
  'rechazado','entregado'),
  user_id uuid null, token_id uuid null,
  created_at/updated_at timestamptz, expira_en timestamptz not null);
RLS: enable + revoke all de anon/authenticated (solo service_role, patron
ai_credenciales 0009). Index created_at. NO policies (el server usa admin).
Ladder limpieza: al leer/expirar, DELETE pendientes expirados (best-effort).

## B. Camara ademas de galeria (2 botones, mismo pipeline)
- CaptureBar: dos botones: 'Galeria' (input normal, como hoy 'foto') y
  'Camara' (input capture="environment" - en desktop abrir opciones, cae en
  file picker igual). Ambos llaman useFoto EXACTAMENTE igual (mismo pipeline,
  mismas validaciones, mismo POST).
- aria-label distintos; iconos inline sin tildes.

## Reglas generales
- Sin dependencias; 4 rutas nuevas (/api/mcp-login/start|poll,
  /api/conectar/aprobar, page /conectar); tokens y log REUSAN lo del modulo 15.
- El device_code NUNCA se guarda plain (sha256 in DB; comparacion por lookup).
- Toda la seguridad del par: rutas publicas rate-limited (Map in-memory,
  cap basico), errores genericos (401/400/410), sin filtros cross-tenant
  (user del sesion en aprobar; el user_id de solicitud solo se pone al aprobar).
- /api/mcp no cambia (Bearer igual — el CLI login SOLO produce el token).
- Rama feat/cli-login-m18. Commits 'feat: cli-login...'. NO push a main.

## Criterio de terminado
build/tsc/lint 0 · QA end-to-end con escritura parcial: start -> aprobar con
sesion real -> poll 'granted' con mt token funcionando en tools/list ->
entregado una sola vez (segundo poll no lo re-sirve) -> revocable desde
/ajustes. Camara: verificacion manual David en móvil.
