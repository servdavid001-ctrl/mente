# Spec — Modulo 19: Wizard conector + permisos por tools + docs publicas

Pedido David 2026-11-08: "forma mas sencilla para conectarse con muse y/o grok"
+ "que los ajustes permita configurar que herramientas le permites a cada
conector: nombra todas con un interruptor" + "documentacion v1 para conector
y mcps: que cualquier herramienta externa con AI entre y vea como conectarse,
a la vista de todos".

## A. Permisos por conector (el corazon)
### Migracion 0014_permisos.sql (solo archivo)
alter table worker_tokens add column permisos text[] not null default
'{buscar_tareas,obtener_plan,leer_investigacion,crear_nota,crear_subpagina,crear_tarea,terminar_tarea,importar_investigacion,pedir_anexo}';
(sin policies nuevas; solo columna + defaults)

### Server (enforcement)
- /api/ajustes/tokens: PUT {id, permisos:[names]} (owner sesion; validation nom
  de la lista de tools de /api/mcp catalogo; si vacio => bloqueara TODO
  (advertido en UI)). GET devuelve permisos tambien.
- /api/mcp tools/call: verificar permisos del token ANTES de ejecutar: si el
  tool no esta -> JSON-RPC error code -32002 message 'Herramienta no permitida
  por el conector' + log token_acciones accion 'bloqueada' con resumen tool.
- /api/mcp tools/list: devolver SOLO los tools permitidos al token (asi el
  cliente no ofrece herramientas que el worker no puede usar).

### UI (en /ajustes AjustesAgentes)
- Cada token expande (chevron): lista COMPLETA de las 9 herramientas con
  INTERRUPTOR (toggle) cada una + acciones rapidas "Todas/Ninguna". Guardado
  por toggle (PUT) optimista con rollback + toast; lista oficial de tools
  copiada del catalogo (source of truth: COMMON TOOLS const compartida).
- Wizard generado: browser "Añadir conector" -> nombre (opencode/muse/grok/
  custom) -> sheet genera token en un paso y muestra TODO en una vista:
  1) token (copiar una vez) · 2) config JSON para clientes MCP (mencionando
  cual es el URL) · 3) los interruptores de permisos ya activos · 4) nota de
  "muse/grok sin MCP: usa Copiar recado por tarea" con link a /integraciones.
  Esto REEMPLAZA el camino manual de 3 pasos (mas facile de lo que era antes).

## B. Documentacion publica /integraciones (v1 contenido, "a la vista de todos")
- page.tsx SERVER COMPONENT estatico (sin auth; proxy.ts queda EXCLUIDA la
  ruta de auth cath-all; ver reglas existentes en /api/mcp y /downloads).
- Contenido (espanol, honesto, bien generado en text):
  1. Que mudness expone y como autoriza: flow Bearer token + device flow
     (start -> /conectar -> poll; curls de ejemplo)
  2. Tools table con 9 herramientas + descripcion + junta argumentos v1
  3. Permisos: como limitar por conector (interruptores en /ajustes)
  4. Config JSON ejemplos: opencode + generic MCP client (url + headers
     Authorization Bearer)
  5. muse/grok: modo manual (Copiar recado) + MQTT? NO — solo manual + opcional
     MCP si el asistente soporta tools de via web MCP
  6. Seguridad: tokens revocables, log, rate limit 60/min, nada destructivo
     salvo terminar_tarea, user_id liefert el token
  7. Limites v1 + soporte / report issues (repo GitHub URL)
- Link desde /login (esquina inferior: 'Integraciones y MCP' small) y desde
  /ajustes (boton 'Ver documentacion publica').
- Hito: texto estatico en repo tambien en docs/INTEGRACIONES.md (mirror
  legible) para que CUALQUIER agente lo lea del repositorio. Same content.

## Reglas generales
- Sin dependencias; 1 migracion archivo; 1 ruta nueva (page /integraciones) +
  PUT aux en tokens route; el resto expande. /api/mcp DISPACHO solo agrega el
  gate de permisos (verificar que no rompa tools/list nada more).
- Arquitectura del estado del interruptor token: FICHAS actualizar caso; solo
  propose by David pending inline state changes (Definir own state).
- Style: Validation/errores genericos; protege el inline detail areial visibles;
  sin tildes JSX. Commits 'feat: conectores...'. Branch feat/conectores-m19.
  NO push a main.
