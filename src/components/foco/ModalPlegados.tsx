'use client';

import Link from 'next/link';
import SheetDialog from '@/components/ui/SheetDialog';
import type { Proyecto } from '@/lib/types';

/** modal "P" (modulo 11, spec §4): lista de proyectos plegados; desde ella
 * "Desplegar" devuelve la tarjeta. Nunca borra ni bloquea (FOUNDATION #29). */
export default function ModalPlegados(props: {
  plegados: Proyecto[];
  ocupadoId: string | null;
  onCerrar: () => void;
  onDesplegar: (proyecto: Proyecto) => void;
}) {
  return (
    <SheetDialog label="Proyectos guardados" onCerrar={props.onCerrar}>
      <div className="space-y-2 pb-2 pt-4">
        <p className="text-center font-display text-lg font-semibold">
          Proyectos guardados
        </p>
        <p className="px-2 text-center text-[13px] text-text-soft">
          Estan ahi, no perdidos. Despliega el que toque hoy.
        </p>

        {props.plegados.length === 0 ? (
          <p className="pt-4 text-center text-[14px] text-text-soft">
            No hay proyectos guardados.
          </p>
        ) : (
          <ul className="space-y-2 pt-3">
            {props.plegados.map((proyecto) => {
              const ocupado = props.ocupadoId === proyecto.id;
              return (
                <li
                  key={proyecto.id}
                  className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5"
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: proyecto.color }}
                  />
                  <Link
                    href={`/foco/${proyecto.id}`}
                    onClick={props.onCerrar}
                    className="min-w-0 flex-1 truncate text-[15px] font-medium text-text"
                  >
                    {proyecto.nombre}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Desplegar ${proyecto.nombre}`}
                    disabled={props.ocupadoId !== null}
                    onClick={() => props.onDesplegar(proyecto)}
                    className="h-10 shrink-0 rounded-blob border border-border px-3 text-[13px] font-semibold text-text disabled:opacity-50"
                  >
                    {ocupado ? 'Desplegando...' : 'Desplegar'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SheetDialog>
  );
}
