import type { Proyecto, Tarea } from './types';

/* modulo 16 A: paquete de recado determinista por tarea (sin AI). Puro:
 * misma entrada -> mismo texto siempre; es lo que la UI muestra y copia,
 * y nada se guarda en la DB (spec modulo 16 seccion A). */

const CAP_NOTA = 1000;
const CAP_FUNDAMENTO = 1500;
const CAP_OBJETIVO = 400;

const CRITERIO_TERMINADO =
  'queda registrada en Mente la respuesta como nota del proyecto, con lo entregado y a quien';
const COMO_DEVOLVER =
  'pegar/adjuntar el resultado en Mente como nota del proyecto; o via MCP crear_nota si tienes el token';

export type DatosRecado = {
  tarea: Pick<Tarea, 'titulo' | 'nota' | 'asignado_a'>;
  proyecto: Pick<Proyecto, 'nombre' | 'color'> | null;
  objetivo: string | null;
  fundamento: string | null;
};

/** template del encargo (spec modulo 16 A); '-' = dato ausente, cada campo
 * con su cap (nota 1000, fundamento 1500, objetivo 400) */
export function armarRecado(d: DatosRecado): string {
  const proyecto = d.proyecto
    ? `${d.proyecto.nombre} (${d.proyecto.color})`
    : '-';
  const lineas = [
    `Encargo: ${d.tarea.titulo}`,
    `Asignado: ${d.tarea.asignado_a ?? 'yo'}`,
    `Proyecto: ${proyecto}`,
    `Objetivo del proyecto: ${(d.objetivo ?? '-').slice(0, CAP_OBJETIVO)}`,
    `Fundamento del proyecto: ${(d.fundamento ?? '-').slice(0, CAP_FUNDAMENTO)}`,
    `Nota de la tarea: ${(d.tarea.nota ?? '-').slice(0, CAP_NOTA)}`,
    `Criterio de terminado: ${CRITERIO_TERMINADO}`,
    `Como devolver (manual): ${COMO_DEVOLVER}`
  ];
  return lineas.join('\n');
}
