# Modulo 13 — Paginas/subpaginas estilo Notion (modelo LIGHT)

Fecha: 2026-11-06 · Merge main: f16b439 · Audit APROBADO · Migración 0011 aplicada y verificada · Deploy OK

## Que hace
Notas e investigacion funcionan como paginas de Notion: abrir una nota/investi-
gacion del proyecto abre una PAGINA con breadcrumb (Proyecto / Pagina / Subpagina
siempre visible), lista de subpaginas con badge de hijos, composer "Nueva
subpagina" inline y menu "Mover a" (solo raiz/ancestros => el subarugo se
acorta). Profundidad max 3 NIVELES validada en server (profundidadDe/
validarAnidamiento/validarMover con anti-ciclos). Back = breadcrumb.

## Decisiones
- Modelo LIGHT: ideas.parent_id self-reference (migram 0011, FK on delete
  cascade + index). Sin tabla paginas. REA a Notion saltado (decision David).
- GET /api/ideas?parent=<id> hijos directos; POST destino {parent_id} hereda
  proyecto_id del padre; PUT whitelist += parent_id con anti-ciclos.
- Detalle de biblioteca intacto: las paginas viven en su propia vista de Foco.

## QA prod end-to-end (sesion real)
Raiz -> N2 -> N3 OK · N4 rechazada 400 (max 3) · GET ?parent= devuelve hijos con
shape mapeado · PUT parent_id:null (a raiz) 200 · DELETE raiz 204 · residuo cero.

## Hallazgos del audit (no bloquean, backlog con 1 tarea de trigger de integridad)
1. Mover por API cruda puede dejar subarbol con prof > 3 (la UI jamas lo genera).
2. Ventana TOCTOU para ciclo mutuo ante PUT concurrentes propios.
3. FK valida existencia global, no bajo RLS (defense-in-depth: trigger).
4. PUT parent_id:null sobre id ajeno termina 500 en vez de 400.

## Alineación
Pedido literal de David (2026-11-06) · conservia el espíritu del FOUNDATION:
jerarquía acotada (max 3) + siempre accesible (breadcrumb) = "no jerarquias
que se pudren".
