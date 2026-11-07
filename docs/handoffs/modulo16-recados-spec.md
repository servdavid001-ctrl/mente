# Spec — Modulo 16: Fundamento generado por agente + Paquetes de recado (muse/grok manual)

Arquitectura: docs/handoffs/arquitectura-agente-mente.md. David aprobó el orden
(fundamento + paquetes tras el servidor MCP del modulo 15).

## A. Paquete de recado (determinista, sin AI — elig lente del modelo 12/13)
UN botón por tarea ("Copiar recado"): genera TEXTO reproducible. El pack:
```
Encargo: <titulo tarea>
Asignado: <muse|grok|opencode>
Proyecto: <nombre + color>
Objetivo del proyecto: <objetivo activo si hay>
Fundamento del proyecto: <contenido de la página 'Fundamento - <nombre>' (max 1500 chars) si existe>
Nota de la tarea: <nota si hay>
Criterio de terminado: <resumen generico del FOUNDATION: 'queda registrada en Mente la respuesta como nota del proyecto, con lo entregado y a quien'>
Como devolver (manual): 'pegar/adjuntar el resultado en Mente como nota del proyecto; o via MCP crear_nota si vous tienes el token'
```
Ruta nueva GET /api/tareas/[id]/recado (auth 401; get tarea+proyecto+objetivo+fundamento),
devuelve {recado: string} (template deterministic, caps: tarea nota 1000,
fundamento slice 1500, objetivo 400).
UI: botón en cada fila de tarea (TareaItem) -> modal con preview + Copiar
(clipboard con fallback); estilo repo (<100 lineas; modales del proyecto ya
existe pa probability look).

## B. Fundamento técnico generado (AI con la clave del usuario, modulo 3 pattern)
- Ruta nueva POST /api/proyectos/[id]/fundamento (auth + rate consumir_analisis
  + credencialesUsuario; 503 si no hay clave — mismo copy que explicar).
- Recolecta datos del proyecto (via focoServer/ideas + objetivos + tareas) y
  llama al provider con salida JSON: {problema, debe_hacer[], no_debe[],
  criterio_exito[], siguiente_paso} (máx dispositivo: cap 2000 chars total).
- NO guarda nada automatico: responde el DRAFT (found: {propuesta }) — el
  usuario ve la vista previa en la UI y pulse "Crear fundamento" lo que crea
  PAGINA del proyecto via POST /api/ideas existente (destino proyecto_id,
  estado 'proyecto') con titulo 'Fundamento - <nombre>' y cuerpo markdown
  ligero lid del MODULO 14 (contents: #, []. etc — ya renderiza renderBloques).
- Si el fundamento ya existe (suna note title-prefix 'Fundamento - ' en el
  proyecto), la ruta responde {existe: true} y el UI redirige a verlo
  (regla: un solo fundamento por proyecto en v1; re-generar sera v2).
- Prompt del AI ( provider util chatStream? usar analizar pattern):
  "Eres un copiloto de proyectos; con estos datos del proyecto construye un
  documento fundacional claro ... SOLO JSON".
- UI: boton en el header del proyecto (ProyectoHeaderV2): "Fundamento" ->
  sheet proponer el draft con botones Crear/Pagedespres; loading y error.
- El MCP obtener_plan ya expone las paginas del proyecto (incluye el
  fundamento) — nada extra.

## Reglas
- Sin tablas nuevas, sin migraciones. 2 rutas nuevas documentadas (recado +
  fundamento). Sin dependencias nuevas. Sin tocar modulos 9/10/extension/mcp.
- Todo determinista el recado (no AI); AI SOLO fundamento con clave de usuario
  y rate compartido + user keys (nada global). Nada auto-guardado (draft).
- Archivos <100 lineas. Sin tildes JSX // aria-label correctos.
- Rama feat/recados-m16. Commits 'feat: recados...'. NO push de main.
