# Modulo 12 — Direccion de flujos de ideas

Fecha: 2026-11-06 · Merge main: d1522c2 · Audit APROBADO (IDOR probado activo) · Deploy OK

## Que hace
Las ideas viajan en UNA sola direccion: Bandeja -> proyecto/investigacion
(CategorizarSheet), creado directo en proyecto (composer, "Se queda escrito aqui
directamente"), o Biblioteca -> proyecto/nueva investigacion (EnviaProyecto,
nuevo paso del sheet). PROHIBIDO el pull inverso proyecto<-bandeja:
SelectorBandeja eliminado sin referencias. Movimiento interno notas<->investi
gacion del propio proyecto sigue permitido.

## Decisiones
- Solo UI/copy: 0 rutas nuevas, 0 DB, 0 /api tocado. Enviar a = PUT existente
  (ideaAcciones {proyectoId, estado}) reusado en Bandeja y Biblioteca.
- Compositor hint: "Se queda escrito aqui directamente."

## Hallazgos del audit (no bloquean)
- idea huér frecuente: PUT estado='proyecto' sin proyectoId deja idea con
  proyecto_id=null (preexistente mod 4) — deuda a arregla.
- 500 con mensaje PostgREST en edge (ruta ideas/[id]) — envuelto por RLS.
- npm audit dev-only (eslint toolchain).

## Alineacion
Regla David: 'una idea viaja, no se trae' — el Inbox es la única puerta del
sistema; el proyecto nunca importa del Inbox.
