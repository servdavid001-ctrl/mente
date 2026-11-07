'use client';

import TareaItem from './TareaItem';
import type { Tarea } from '@/lib/types';

type ContextoProyecto = { nombre: string; href: string };

export default function ListaTareas(props: {
  tareas: Tarea[];
  cargando: boolean;
  error?: string;
  vacio: string;
  ocupadoId?: string | null;
  proyectoDe?: (tarea: Tarea) => ContextoProyecto | null;
  onToggle: (tarea: Tarea) => void;
  onBorrar: (tarea: Tarea) => void;
  onAsignar?: (tarea: Tarea, valor: string) => void;
  onReintentar: () => void;
}) {
  if (props.cargando) {
    return (
      <div className="space-y-1.5" aria-hidden="true">
        <div className="anim-shimmer h-12 w-full rounded-card bg-border" />
        <div className="anim-shimmer h-12 w-full rounded-card bg-border" />
      </div>
    );
  }

  if (props.error) {
    return (
      <div className="rounded-card bg-danger px-4 py-3 text-sm text-white">
        {props.error}
        <button
          type="button"
          onClick={props.onReintentar}
          className="ml-2 h-9 rounded-blob border border-white px-3 text-[13px] font-semibold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (props.tareas.length === 0) {
    return <p className="text-[13px] text-text-soft">{props.vacio}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {props.tareas.map((tarea) => {
        const contexto = props.proyectoDe ? props.proyectoDe(tarea) : null;
        return (
          <TareaItem
            key={tarea.id}
            tarea={tarea}
            ocupado={props.ocupadoId === tarea.id}
            proyectoNombre={contexto?.nombre}
            proyectoHref={contexto?.href}
            onToggle={props.onToggle}
            onBorrar={props.onBorrar}
            onAsignar={props.onAsignar}
          />
        );
      })}
    </ul>
  );
}
