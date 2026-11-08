'use client';

import { useState } from 'react';
import FormSubtarea from './FormSubtarea';
import FilaSubtarea from './FilaSubtarea';
import type { Tarea } from '@/lib/types';
import type { ResultadoTareas } from './useTareasProyecto';

/* bloque de subtareas de una raiz (paso 4): lista anidada + composer inline
 * '+ Nueva subtarea'. Toda la escritura pasa por el estado compartido del
 * hook (agregarSubtarea / alternar / eliminar / reordenar); el composer vive
 * en FormSubtarea para cumplir el limite de 100 lineas por archivo. */
export default function SubtareasDe(props: {
  parentId: string;
  subtareas: Tarea[];
  estado: ResultadoTareas;
}) {
  const [componiendo, setComponiendo] = useState(false);

  return (
    <div className="space-y-2">
      {props.subtareas.length > 0 ? (
        <ul className="space-y-1.5">
          {props.subtareas.map((tarea, indice) => (
            <FilaSubtarea
              key={tarea.id}
              tarea={tarea}
              ocupado={props.estado.ocupadoId === tarea.id}
              ordenando={props.estado.ordenando}
              puedeSubir={indice > 0}
              puedeBajar={indice < props.subtareas.length - 1}
              onToggle={(t) => void props.estado.alternar(t)}
              onBorrar={(t) => void props.estado.eliminar(t)}
              onReordenar={(t, d) => void props.estado.reordenar(t, d)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-text-soft">
          Sin subtareas: anade pasos anidados con el boton de abajo.
        </p>
      )}

      {componiendo ? (
        <FormSubtarea
          onGuardar={async (titulo) => {
            await props.estado.agregarSubtarea(props.parentId, titulo);
          }}
          onCerrar={() => setComponiendo(false)}
        />
      ) : (
        <button
          type="button"
          aria-expanded={componiendo}
          onClick={() => setComponiendo(true)}
          className="h-9 w-full rounded-card border border-border text-[13px] font-semibold text-text"
        >
          + Nueva subtarea
        </button>
      )}
    </div>
  );
}
