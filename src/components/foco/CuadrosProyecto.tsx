'use client';

import CuadroProyecto from './CuadroProyecto';
import { datosCuadros, type DatosCuadro } from './datosCuadros';
import type { Idea, Proyecto, Tarea } from '@/lib/types';

/* paso 4: los 3 cuadros del proyecto SIN tabs. Desktop: columna izquierda
 * Investigacion (grande) + Notas (mas bajo), columna derecha Tareas (grande,
 * crece). Movil: los 3 apilados verticalmente en el mismo orden. La altura
 * voza el layout a CuadroProyecto via wrappers con min-h y flex-1. */

export type VistaCuadroGrid = DatosCuadro['vista'];

export default function CuadrosProyecto(props: {
  notas: Idea[];
  investigaciones: Idea[];
  tareas: Tarea[];
  tareasCargando: boolean;
  proyecto: Proyecto;
  onAbrir: (vista: DatosCuadro['vista']) => void;
}) {
  const [investigacion, notas, tareas] = datosCuadros(props);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-3 md:col-start-1">
        <div className="min-h-[13rem] md:min-h-[17rem]">
          <CuadroProyecto datos={investigacion} onAbrir={props.onAbrir} />
        </div>
        <div className="min-h-[8rem] md:min-h-[9rem]">
          <CuadroProyecto datos={notas} onAbrir={props.onAbrir} />
        </div>
      </div>
      <div className="flex flex-col gap-3 md:col-start-2 md:h-full">
        <div className="min-h-[13rem] md:min-h-0 md:flex-1">
          <CuadroProyecto datos={tareas} onAbrir={props.onAbrir} />
        </div>
      </div>
    </div>
  );
}
