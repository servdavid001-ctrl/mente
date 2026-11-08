'use client';

import FlechasOrden from './FlechasOrden';
import BotonBorrarTarea from './BotonBorrarTarea';
import type { Tarea } from '@/lib/types';

/* fila de subtarea (paso 4): flechas de orden dentro de su grupo + check +
 * titulo + borrar. Sin fecha, recado ni chips: el nucleo del arbol */
export default function FilaSubtarea(props: {
  tarea: Tarea;
  ocupado?: boolean;
  ordenando?: boolean;
  puedeSubir: boolean;
  puedeBajar: boolean;
  onToggle: (tarea: Tarea) => void;
  onBorrar: (tarea: Tarea) => void;
  onReordenar: (tarea: Tarea, direccion: 'arriba' | 'abajo') => void;
}) {
  const hecha = props.tarea.estado === 'hecha';
  const inputId = `subtarea-${props.tarea.id}`;
  const ocupar = props.ocupado || props.ordenando;

  return (
    <li className="rounded-card border border-border bg-surface px-3 py-2">
      <div className="flex items-start gap-2">
        <FlechasOrden
          etiqueta={props.tarea.titulo}
          puedeSubir={props.puedeSubir}
          puedeBajar={props.puedeBajar}
          ocupado={ocupar}
          subir={() => props.onReordenar(props.tarea, 'arriba')}
          bajar={() => props.onReordenar(props.tarea, 'abajo')}
        />
        <input
          id={inputId}
          type="checkbox"
          checked={hecha}
          disabled={props.ocupado}
          onChange={() => props.onToggle(props.tarea)}
          aria-label={`Marcar ${props.tarea.titulo} como ${hecha ? 'pendiente' : 'hecha'}`}
          className="mt-0.5 h-5 w-5 shrink-0 accent-accent disabled:opacity-50"
        />
        <label
          htmlFor={inputId}
          className={`min-w-0 flex-1 text-[14px] leading-snug ${
            hecha ? 'text-text-soft line-through' : 'text-text'
          }`}
        >
          {props.tarea.titulo}
        </label>
        <BotonBorrarTarea
          titulo={props.tarea.titulo}
          ocupado={props.ocupado}
          onBorrar={() => props.onBorrar(props.tarea)}
        />
      </div>
    </li>
  );
}
