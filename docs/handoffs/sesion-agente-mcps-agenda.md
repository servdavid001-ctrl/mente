# Agenda — Sesión de planificación: Agente de Mente + MCPs + comportamiento AI

ESTADO: PENDIENTE (David, 2026-11-06: "documenta eso para empezar a trabajar en eso
cuando terminemos [modulo 11]"). Se abre DESPUES del modulo 11. Refuerza la seccion
Versión 2 del FOUNDATION y completa decisions-log 2026-11-06 (brief David).

## Temas a decidir juntos (ordre propuesto)
1. **Rol del agente vs herramientas externas.** El agente solo manipula info DENTRO
   de Mente (proyectos/ideas/notas/tareas). Define: que casos devian a opencode
   (code, shell, filesystem), que casos al asistente AI (Muse/Grok), y que casos
   resuelve el mismo con AI de bajo volumen (clasificar, redactar). Regla: cada
   entrega externa sale PREPARADA en el formato que la herramienta necesita
   (prompt empaquetado, contexto, archivos) — nunca pelado al rulo.
2. **Discernimiento y conflicto.** Como detecta cruces de tareas y colisiones de
   recursos/tiempos; plantilla de aviso honesto: "con estos recursos y este
   tiempo, la mejor opcion es A o B" (enfoque soluciones, no quejas).
3. **Comportamiento de la AI en cada parte (no-determinismo por contexto).**
   Definir el equilibrio determinista<->exploratorio por modulo: captura/analisis
   (mas determinista), conexiones externas (mixto), explicaciones (mas abierto),
   tareas-plan (determinista con approval), coach de foco (conversacional).
   Salida esperada: un mapa modulo->modo con casos de pagina.
4. **Extension Chrome v2**: flujo UX exacto de derivacion (capturar -> crear
   texto/idea desde un item -> elegir destino Bandeja o proyecto). Requiere
   decision de tokens/copia, multilinea, si guarda con origen y/undo.
5. **Coneccion tecnica**: MCP server de Mente (exponer tools) vs agente cliente
   MCP (consumir opencode/assistant). Quien golpea a quien y donde corre el
   "programador/activador" ya definido en v1 (_approval| autonoma).
6. **Frontiesa del dashboard/panel del agente** hasta si se quiere en /ajustes.

## Insumos (leer antes de la session)
- docs/FOUNDATION.md seccion Versión 2
- src/cierre/modulo10 - comportamiento IA externa actual (determinista v1)
- docs/handoffs/sesion-agente-mcps-agenda.md (este archivo)
