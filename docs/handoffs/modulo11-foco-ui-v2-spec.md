# Spec — Modulo 11: Foco UI v2 (tarjetas + proyecto simple)

APROBADO por David (2026-11-06, "si todo"). Boceto origen y adiciones:
docs/handoffs/foco-ui-v2-boceto.md (LTR literalA). Regla de auditoria:
todo referente a Extension/App vive SOLO en /ajustes.

## Contrato de las tarjetas (vista principal /foco)
1. Fila horizontal de tarjetas de proyecto, plantilla unica:
   bloque visual superior (color del proyecto + iniciales grandes, esquinas
   redondeadas) · nombre debajo · barra inferior = progreso de tareas
   (hechas / total*100%, texto "sin tareas" si 0).
2. Movil: carrusel horizontal swipe (tarjeta (~65% ancho, vecina asoma).
   Escritorio (md+): grid 3 columnas, tarjetas iguales.
3. Clic tarjeta -> /foco/[id] (proyecto completo). Sin popup intermedio.
4. Botones flotantes circulares abajo-derecha apilados, siguen con scroll con
   scroll:
   - "+": modal crear proyecto (nombre + color + descripcion opcional). El
     proyecto nuevo aparece como tarjeta visible de inmediato (sin bloqueo).
   - "P" con contador de ocultos (texto tipo "+3" debajo del icono): modal con
     lista de proyectos plegados; desde ella "Desplegar" trae la tarjeta.
5. Maximo sin bloqueo: mas de 3 visibles se permite; con 4+ el Guardián avisa
   suave (reusar mensajeGuardian/detector). NUNCA bloquear ni ocultar automatico.
6. Quitar tarjeta: menu contextual en la tarjeta (tres puntos) -> "Plegar
   proyecto" (reversible, al modal P) / "Ver detalles" (redirección /foco/[id]).

## Proyecto (/foco/[id]) — simple, concepto visu del foco de tarjetas
- Cabecera: nombre + barra de progreso + scroll menu (plegar/ver detalles) equal.
- TABS (barra superior, sencillo): **Notas | Investigación | Tareas**.
  - Notas: libreta dual — (a) botón "Nueva nota" abre composer inline que crea
    idea `estado:'proyecto'` con `proyecto_id`; (b) possibilité de pasar ideas
    DESDE la bandeja (flow categorizar já existe en muejera; añadir "a la libreta
    de proyecto"). Formato: bloques ligeros (Fundamento punto #8).
  - Investigacion: lista de invest. del proyecto (desobras idea con estado
    'investigacion' + proyecto_id); nueva investigacion crea la idea raiz; su
    detalle mantiene el flow actual (items/notas).
  - Tareas: LISTA de tareas existentes con proyecto_id + los OBJETIVOS del
    proyecto arriba (au list simple, para no perderlos hasta querer David +
    decision final). Marcar hecha court con PUT existente.
- Sin altura tab "Archivos" (depende fotos/binaria des y decision pendiente).

## API (cambios minimos, sin tablas nuevas)
- POST /api/ideas: aceptar campo opcional `destino` = { proyecto_id } +
  ` Ladies:'proyecto'|'investigacion'` para el composer de la libreta
  (validate: project belongs to user; default tight behavior unchanged).
- PUT /api/proyectos/[id]: confirmar/impedir `plegado` (cambre+nameが bien). Si no
  existe el campo en whitelist, añadir con validationeded boolean.
- DELETE/UI actions: reuse TODO existing. Nada de escritura automatica.

## Regla de Ajustes (audit de ubicacion)
grep de todo el fuente por menciones de extension/PWA/APK/ZIP: eliminar/reubicar
toda referencia fuera de /ajustes a APX ("descargar extension" desde la bandeja/
extension/.也越来越干净).
La page de descarga plan de ruta `/downloads` permanece: es terminal del enlace,
no marketing en UI. Reportar cada archivo tocado.

## Convenciones
- Sin tildes en strings JSX. Lucide icons con aria-label (> icono de tres puntosetc).
- Archivos >100 lineas: escribir por partes y verificar.
- Commits: `feat: foco-ui` incrementales, NUNCA push a main.
- No tocar: features/, tests, sugerencia, /api/ai/*, /api/higiene, módulo 10.
- Rama: feat/foco-ui-v2.

## Criterio de terminado (gate)
build/tsc/lint 0 · auth rules intactas (no nueva ruta) · QA manual descrito:
crear proyecto desde "+", plegar/desplegar, progreso = tareas reales, tabs
funcionales, libreta dual (mover idea desde bandeja + composer directo
guarda estado proyecto + el item aparece en tarjetas del proyecto correcto).
Reportar diff y deovuelver; Deploy/QA-procisiones los ejecuta el CTO.
