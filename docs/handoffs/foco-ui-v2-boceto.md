# Espec — Interfaz Foco v2 (vista principal de proyectos) — BOCETO de 2026-11-06

Origen: David (boceto a mano, transcrito literal). ESTADO: borrador con 6 "por
definir" — NO programar hasta que se cierren (propuestas del CTO en el chat).

## Concepto general
Pantalla simplificada de tarjetas de proyecto. Solo pocas visibles (boceto: 3). El
resto existe pero oculto, accesible desde boton flotante.

## Layout
- Fila HORIZONTAL de tarjetas, misma altura, espaciado uniforme.
- Tarjeta: rectangulo vertical (mas alto que ancho), esquinas redondeadas.
- Botones circulares flotantes en esquina inferior DERECHA, apilados verticalmente:
  "+" arriba, "P" abajo. Fijos aunque haya scroll.

## Estructura de cada tarjeta (plantilla unica)
De arriba a abajo:
1. Bloque visual superior: recuadro grande con esquinas redondeadas (imagen, portada
   o icono del proyecto).
2. Nombre del proyecto: texto debajo del bloque visual.
3. Barra inferior: horizontal, casi del ancho de la tarjeta, pegada a la parte baja.
   Funcion POR DEFINIR.

Las 3 tarjetas del boceto no son identicas porque se dibujaron a mano: la plantilla
es una sola ("Proyecto x"). El marco con columnas y cajas del borde izquierdo de la
hoja es parte impresa del cuaderno — IGNORAR.

## Boton "+" (nuevo proyecto)
- Circulo flotante con "+"; clic -> modal para crear proyecto; al guardar, se agrega
  al sistema (por definir: si aparece de inmediato como tarjeta visible).

## Boton "P" (proyectos ocultos)
- Representa los proyectos ocultos de la fila; clic -> popup con la lista; desde
  ella se puede llevar un proyecto a vista y pasa a tarjeta.
- "P" es marcador del boceto; icono final por definir (idealmente cantidad ocultos).

## Por definir antes de programar (6)
1. Barra inferior de la tarjeta (progreso/estado/boton/input)
2. Comportamiento del clic en tarjeta
3. Maximo de tarjetas visibles y que pasa al llegar
4. Accion para quitar tarjeta de la vista (solo hay como agregar)
5. Campos del popup "+"
6. Responsive tarjeta (movil vs escritorio)
7. Icono final del boton "P" (con contador si se puede)

## ADICION David (2026-11-06 tarde): estructura interna del proyecto
Cada proyecto (clic en tarjeta) abre su espacio con APARTADOS:
- **Notas**: libreta propia del proyecto (hoy: ideas con estado 'proyecto' +
  proyecto_id — bloques ligeros con enlaces, FOUNDATION punto #8).
- **Investigacion**: apartado propio (hoy: ideas con estado 'investigacion' +
  project_id; cada investigacion con sus items/notas, FOUNDATION estructura).
- **Tareas**: ya existen con proyecto_id (modulo 7).
En la conversacion previa se hablo de pestaña "contexto": ENTENDIDO como la misma
libreta de notas — confirmar si "contexto" era algo distinto.
Pestaña "archivos" (boceto inicial): depende de la decision fotos-en-bandeja
(pendiente). Sin fotos decididas, "archivos" no puede poblarse.
Modelo DB: SIN conflicto — libreta/investigacion son ideas ligadas por proyecto_id.
Si David quiere una libreta de TEXTO LIBRE (documento continuo, no bloques/ideas),
ahi SI hace falta enmienda de modelo (tabla notas_proyecto). Pendiente decidir ese
matiz.

## ADICION David (2026-11-06, ultima): tres reglas mas
1. **Libreta dual**: una idea EXISTENTE se puede pasar a la libreta del proyecto,
   Y TAMBIEN se puede escribir directo desde la libreta (composer inline). La
   libreta es un apartado del proyecto, no un lugar global.
2. **Extension Chrome v2**: debe permitir (a) captura screenshot, (b) guardar
   items, (c) COPIAR textos/ideas PARTIENDO de una nota/captura/item existente y
   guardar esa derivacion en Bandeja o en un proyecto. (Diseño con David en
   sesion de planificacion del agente/extensión — requiere elegir flujo UX.)
3. **Regla de ubicacion**: todo lo referente a Extension y App (PWA/APK/ZIP) vive
   SOLO en /ajustes — ninguna distribucion ni caso de uso fuera de ahi. Audit
   spider: mover/quitar menciones que existan hoy en otras vistas.
4. **Interfaz del proyecto**: simple, tomando el concepto de simplicidad de la
   vista principal de Foco (tarjetas, mismo lenguaje visual).
