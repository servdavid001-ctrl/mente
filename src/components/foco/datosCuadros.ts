import { tituloIdea } from '@/lib/foco';
import { grupoDe } from '@/lib/tareasOrden';
import type { Idea, Proyecto, Tarea } from '@/lib/types';

/* paso 4 (cuadros del proyecto): conteo + preview breve (3-4 items) por cuadro.
 * Calculo puro para la UI. Tareas muestra m/total (hechas/totales vivas del
 * hook, con fallback al conteo del server mientras carga); investigacion y
 * notas llevan conteo simple. */

export type VistaCuadro = 'investigacion' | 'notas' | 'tareas';

export type ItemCuadro = {
  id: string;
  titulo: string;
  // tareas: 'hecha' | 'pendiente'; las libretas no llevan estado aqui
  secundario?: string;
};

export type DatosCuadro = {
  vista: VistaCuadro;
  titulo: string;
  conteo: string;
  items: ItemCuadro[];
};

export type EntradaCuadros = {
  notas: Idea[];
  investigaciones: Idea[];
  tareas: Tarea[];
  tareasCargando: boolean;
  proyecto: Proyecto;
};

function conteoContador(entrada: EntradaCuadros): string {
  if (entrada.tareasCargando) {
    return `${entrada.proyecto.tareasHechas ?? 0}/${entrada.proyecto.tareasTotal ?? 0}`;
  }
  const hechas = entrada.tareas.filter((tarea) => tarea.estado === 'hecha').length;
  return `${hechas}/${entrada.tareas.length}`;
}

/** los 3 cuadros en el orden de la columna movil: Investigacion, Notas, Tareas */
export function datosCuadros(entrada: EntradaCuadros): DatosCuadro[] {
  return [
    {
      vista: 'investigacion',
      titulo: 'Investigacion',
      conteo: String(entrada.investigaciones.length),
      items: entrada.investigaciones.slice(0, 4).map((idea) => ({
        id: idea.id,
        titulo: tituloIdea(idea)
      }))
    },
    {
      vista: 'notas',
      titulo: 'Notas',
      conteo: String(entrada.notas.length),
      items: entrada.notas.slice(0, 4).map((idea) => ({
        id: idea.id,
        titulo: tituloIdea(idea)
      }))
    },
    {
      vista: 'tareas',
      titulo: 'Tareas',
      conteo: conteoContador(entrada),
      items: grupoDe(entrada.tareas, null).slice(0, 4).map((tarea) => ({
        id: tarea.id,
        titulo: tarea.titulo,
        secundario: tarea.estado === 'hecha' ? 'hecha' : 'pendiente'
      }))
    }
  ];
}
