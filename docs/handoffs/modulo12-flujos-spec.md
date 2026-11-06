# Spec final — Modulo 12: direccion de flujos de ideas (APROBADO David "ok")

Orientacion explicita: Bandeja -> proyecto/investigacion (CategorizarSheet, ya
existe) · criacao directa en proyecto (composer, modulo 11, ya existe) ·
Biblioteca -> proyecto (VERIFICAR/REFORIZAcer desde /biblioteca/[id]).
PROHIBIDO: proyecto pulleague desde Bandeja ( SelectorBandeja SE QUITA de
NotasProyecto; el composer se queda). David: "una idea se puede pasar a la
libreta, y tambien llenarla desde el propio proyecto" — es decir: entrar al
proyecto SOLO por los caminos anteriores; el proyecto nunca importa del Inbox.
Dentro del proyecto se sigue.permission mover notas<->investigacion (mismas ideas).

## Cambios (solo UI/copy, sin rutas nuevas, sin DB)
1. Quitar SelectorBandeja (boton "Traer de la Bandeja") de NotasProyecto.tsx y
   TODO su soporte uso no usado (imports). La libreta fica composer +
   movimiento interno del propio proyecto.
2. /biblioteca/[id]: verificar CategorizarSheet cubre ENVIAR a proyecto (o
   investigacion especifica). Si falta el envio explicito a proyecto, añadir la
   opcion con el PUT existente (ideaAcciones: estado + proyecto_id). Aria labels,
   formulariou noter same estilo.
3. Copy final: lugar del composer dice "escrito aqui directamente"; bandeja/scala
   categoriash caso mantemidentico. NO tocar /api/*.

## Verificacion final
build/tsc/lint 0 (patron canonico pkill-[n]/rm .next/build) · QA manual: (a) la
libreta ya NO trae de bandeja; (b) desde /biblioteca/[id] puedo enviar a
proyecto X y la idea desaparece de biblioteca y aparece en NotasProyecto de X;
(c) composer directo sigue guardando en el proyecto. rama feat/flujos-m12,
commits `feat: flujos-m12`. NO push de main; reportar diff y construir.
