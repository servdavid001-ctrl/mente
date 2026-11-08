'use client';

import { useState } from 'react';
import Link from 'next/link';
import { etiquetaFecha } from '@/lib/tareas';
import ChipsAsignado from './ChipsAsignado';
import BotonBorrarTarea from './BotonBorrarTarea';
import RecadoSheet from './RecadoSheet';
import type { Tarea } from '@/lib/types';

/** fila de tarea (modulo 7/15/16): check + fecha + chips asignado + acciones
 * (Copiar recado del modulo 16 y Borrar con confirmacion extraida). El
 * recado se genera en el server (GET determinista) y solo se muestra/copiar */
export default function TareaItem(props: {
  tarea: Tarea;
  ocupado?: boolean;
  proyectoNombre?: string | null;
  proyectoHref?: string | null;
  onToggle: (tarea: Tarea) => void;
  onBorrar: (tarea: Tarea) => void;
  onAsignar?: (tarea: Tarea, valor: string) => void;
}) {
  const { tarea } = props;
  const hecha = tarea.estado === 'hecha';
  const [recadoAbierto, setRecadoAbierto] = useState(false);
  const inputId = `tarea-${tarea.id}`;

  return (
    <li className="rounded-card border border-border bg-surface px-3 py-2.5">
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={hecha}
          disabled={props.ocupado}
          onChange={() => props.onToggle(tarea)}
          aria-label={`Marcar ${tarea.titulo} como ${hecha ? 'pendiente' : 'hecha'}`}
          className="mt-0.5 h-5 w-5 shrink-0 accent-accent disabled:opacity-50"
        />
        <label htmlFor={inputId} className="min-w-0 flex-1">
          <span
            className={`block text-[15px] leading-snug ${
              hecha ? 'text-text-soft line-through' : 'text-text'
            }`}
          >
            {tarea.titulo}
          </span>
          {tarea.fecha || (props.proyectoNombre && props.proyectoHref) ? (
            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-text-soft">
              {tarea.fecha ? <span>{etiquetaFecha(tarea.fecha)}</span> : null}
              {props.proyectoNombre && props.proyectoHref ? (
                <Link href={props.proyectoHref} className="font-semibold underline">
                  {props.proyectoNombre}
                </Link>
              ) : null}
            </span>
          ) : null}
          {props.onAsignar ? (
            <ChipsAsignado tarea={tarea} ocupado={props.ocupado} onAsignar={props.onAsignar} />
          ) : null}
        </label>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            aria-label={`Copiar recado de ${tarea.titulo}`}
            disabled={props.ocupado}
            onClick={() => setRecadoAbierto(true)}
            className="h-9 rounded-blob px-2 text-[12px] font-semibold text-text-soft disabled:opacity-50"
          >
            Copiar recado
          </button>
          <BotonBorrarTarea
            titulo={tarea.titulo}
            ocupado={props.ocupado}
            onBorrar={() => props.onBorrar(tarea)}
          />
        </div>
      </div>

      {recadoAbierto ? (
        <RecadoSheet tareaId={tarea.id} onCerrar={() => setRecadoAbierto(false)} />
      ) : null}
    </li>
  );
}
