# Spec — Modulo 15: Servidor MCP de Mente + etiqueta asignado_a + tokens (Diana "empieza con los mcps")

Arquitectura aprobada: docs/handoffs/arquitectura-agente-mente.md. PRINCIPIO:
Mente = almacen + mensajero. Los workers (opencode/muse/grok) BUSCAN y DEJAN
automaticamente explícitos, con token revocable, log de acciones, y NUNCA
destructivo salvo terminar_tarea.

## Migracion 0012_mcp.sql (solo archivo, el CTO aplica)
1. alter tareas add asignado_a text not null default 'yo'
   check (asignado_a in ('yo','opencode','muse','grok')); + index.
2. create table worker_tokens (
   id uuid pk, user_id uuid not null default auth.uid(),
   nombre text not null check (char_length(nombre) between 1 and 40),
   token_hash text not null unique,          -- sha256 hex del token
   created_at timestamptz default now(),
   last_used_at timestamptz null,
   revocado_en timestamptz null);
   RLS: owner_all (patron 0001). Index user_id.
3. create table token_acciones (
   id uuid, user_id uuid default auth.uid(), token_id uuid set null on delete
   set null? (fibra token borra no rompe el log: referencia null otw),
   worker text not null, accion text not null, proyecto text null,
   resumen text null (max 200), created_at timestamptz default now());
   RLS owner_all. Index (user_id, created_at desc).

## Token
- Formato: `mt_` + 40 chars base64url aleatorio (crypto). Guardado SHA-256 hex
  (nunca texto plano en DB). En una API: POST /api/ajustes/tokens {nombre}
  devuelve EL TOKEN UNA VEZ (response JSON) y lo registra; NO se vuelven a ver.
  GET /api/ajustes/tokens: listado (nombre, created, last_used, revocado_en,
  ultimas acciones? simple: solo datos). DELETE revoca (PUT revocado_en=now(),
  DELETE fisico no — comodidad del historial).
- UI /ajustes: seccion nueva "Acceso para agentes" (despues de Extension):
  crear token (nombre placeholder: opencode/muse/grok), copiar (navigator
  clipboard + fallback), revocar, listado con estado. Instructions de montaje
  para opencode (worker-opencode.html snippet / mcp config example).
- REGLA FUNDACIÓN: TODO sobre tokens vive SOLO en /ajustes.

## Servidor MCP: /api/mcp (route.ts, sin dependencias nuevas — JSON-RPC 2.0
stateless, transporte Streamable-HTTP con respuestas application/json)
- POST: parse body JSON-RPC. Methods:
  - initialize -> resposta {protocolVersion, capabilities{tools:{}},
    serverInfo{name:'mente', version:'1.0'}}; notifications/initialized 202 vain.
  - tools/list -> el catalogo (schemas JSON schema minimo, descriptions en es).
  - tools/call -> switch name, auth antes de cada uno.
  - ping -> {}.
- Auth: Header Authorization: Bearer mt_xxx -> sha256 -> busqueda en
  worker_tokens (service_role o client admin? Use ADMIN client del repo,
  filtrando user_id del token, revocado_en null. Si no: 401 con codigo
  MCP error -32700?/ -32600. Cada tool call VALIDA el token por petición.
- Rate: contar por token in-memory (Map, cap; pattern existing) 60/min.
- Log: INSERT token_acciones por tool (worker=nombre token, accion, proyecto
  nombre, resumen corto). Los datos sensibles (contenido completo) NO en logs.

## Tools (v1 lectura-creacion; NINGUN delete de contenido redaccional)
1. buscar_tareas(asignado_a?) -> tareas pendiente del usuario orden fecha
   (max 50); cada una: id, titulo, nota, proyecto nombre, asignado_a.
   DEFAULT asignado_a = el nombre/token worker (buscando del propio token).
2. obtener_plan(proyecto) -> [{titulo, contenido}] de las paginas del proyecto
   max 20 + tareas del proyecto. Utiliza el fundamento técnico.
3. leer_investigacion(proyecto, titulo?) -> la(s) investigacion(es) (raiz +
   hijos en texto plano) = max 10 paginas.
4. crear_nota(proyecto, texto) -> idea estado 'proyecto' (max 2000).
5. crear_subpagina(proyecto, pagina_titulo, texto)
6. crear_tarea(proyecto, titulo, nota?, asignado_a? default token worker, fecha?)
   -> max 200 chars titles, fecha ISO date opcional.
7. terminar_tarea(id, resultado?) -> PUT estado 'hecha' (+ nota que el
   resultado lado como comentario del proyecto: idea con texto
   "[resultado worker] ..." max 2000 dentro de la investigación? NO. Simple:
   `resultado` se SIempre is idea con origino del token (crea_nota_special) —
   needs modification: crear idea estado 'proyecto'/'investigacion'
   con contenido derivado y tarea hecha.
8. importar_investigacion(proyecto, titulo, cuerpo, subpaginas[<=10]) ->
   raiz + hijas (parent_id via validarAnidamiento) con content.
9. pedir_anexo(mensaje) -> idea en bandeja con nota de origen "[token] pide:"(
   o de proyecto) para que David la vea.
FUERA de v1: editar/eliminar (call it hard sin lista). Cada tool call VALANJA
props (uuid, caps) y usa el bucket de keys COMO origen user_id (stuff
proportional). Zugriff required sin neste herramienta.

## UI Tareas: etiqueta asignado_a
- TareasProyecto: chip/clickable para asignar a (yo/opencode/muse/grok)
  via PUT /api/tareas/[id] whitelist += asignado_a (check list).
- Filtre pequeño/chips en los header de tarea (no bloquejar protocol).

## Fonts
- Sin dependencias NUEVAS (JSON-RPC manual, no SDK; fetchSeguro ya existe).
- No endpoints new EXCEPTO /api/mcp + /api/ajustes/tokens* (documentados).
- /api/mcp DEVUELVE answers JSON-RPC con 400s genericos al defecto; nunca
  c(stack). user_id SIEMPRE viene del token (no del request body) - el
  client no puede spoofear user.
- resumen en tokens_acciones max 200 chars, SIN datos privadosomeness.

## Criterio terminado
tsc/lint/build 0, rutas manifest conocido, 401 sin token, tools recognise y
operar; QA cursor con token real. Reportar list files, build EXIT 0, y 401
pehea para el CTO. Branch feat/mcp-server-m15. Commits: 'feat: mcp...'.
