'use client';

import { useMemo } from 'react';
import TareaItem from './TareaItem';
import SubtareasDe from './SubtareasDe';
import { grupoDe, mapaPorPadre } from '@/lib/tareasOrden';
import type { ResultadoTareas } from './useTareasProyecto';

/* tablon de tareas del proyecto (paso 4): raices con sus subtareas anidadas
 * (sangria + guia), reorden por flechas dentro de cada grupo y las escrituras
 * del hook compartido (marcar hecha, borrar, nueva subtarea). */
export default function TablonTareas(props: { estado: ResultadoTareas }) {
  const estado = props.estado;
  const raices = useMemo(() => grupoDe(estado.tareas, null), [estado.tareas]);
  const porPadre = useMemo(() => mapaPorPadre(estado.tareas), [estado.tareas]);

  if (estado.cargando) {
    return (
      <div className="space-y-1.5" aria-hidden="true">
        <div className="anim-shimmer h-14 w-full rounded-card bg-border" />
        <div className="anim-shimmer h-14 w-full rounded-card bg-border" />
      </div>
    );
  }

  if (estado.error) {
    return (
      <p role="alert" className="rounded-card bg-danger px-4 py-3 text-sm text-white">
        {estado.error}
        <button
          type="button"
          onClick={() => void estado.cargar()}
          className="ml-2 h-9 rounded-blob border border-white px-3 text-[13px] font-semibold"
        >
          Reintentar
        </button>
      </p>
    );
  }

  if (raices.length === 0) {
    return <p className="text-[13px] text-text-soft">Este proyecto aun no tiene tareas.</p>;
  }

  return (
    <ul className="space-y-2">
      {raices.map((tarea, indice) => (
        <li key={tarea.id} className="space-y-2">
          <TareaItem
            tarea={tarea}
            ocupado={estado.ocupadoId === tarea.id || estado.ordenando}
            ordenControles={
              raices.length > 1
                ? {
                    puedeSubir: indice > 0,
                    puedeBajar: indice < raices.length - 1,
                    subir: () => estado.reordenar(tarea, 'arriba'),
                    bajar: () => estado.reordenar(tarea, 'abajo')
                  }
                : undefined
            }
            onToggle={(t) => void estado.alternar(t)}
            onBorrar={(t) => void estado.eliminar(t)}
            onAsignar={(t, valor) => void estado.asignar(t, valor)}
          />
          {/* subtareas anidadas bajo su raiz, indicadas con sangria + guia */}
          <div className="ml-4 border-l border-border pl-3">
            <SubtareasDe
              parentId={tarea.id}
              subtareas={porPadre[tarea.id] ?? []}
              estado={estado}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
