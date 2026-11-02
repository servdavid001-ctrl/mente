'use client';

import type { DotColor } from '@/lib/types';
import { Dot } from '@/components/biblioteca/ColeccionChip';

/** banner dentro del CategorizarSheet (spec 13): 'Sugerido por tu AI' +
 * 'Descartar sugerencia' irreversible (descarta para siempre este item). */
export default function SugerenciaSection(props: {
  sugerencia: { nombreColeccion: string; esNueva?: boolean; dotColor?: DotColor };
  onDescartarParaSiempre: () => Promise<void>;
  isLoading?: boolean;
}) {
  return (
    <div
      role="status"
      aria-label={`Sugerencia de la AI: ${props.sugerencia.nombreColeccion}`}
      className="mb-3 flex items-center justify-between gap-2 rounded-card bg-accent-soft px-3 py-2"
    >
      <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-text">
        <span aria-hidden="true" className="shrink-0 text-accent">✦</span>
        <span aria-hidden="true" className="truncate font-medium">
          Sugerido por tu AI
        </span>
        {props.sugerencia.esNueva ? (
          <span aria-hidden="true" className="dot-fantasma shrink-0" />
        ) : (
          <Dot color={props.sugerencia.dotColor} tamano="h-2.5 w-2.5" />
        )}
        <span aria-hidden="true" className="truncate font-semibold">
          {props.sugerencia.nombreColeccion}
        </span>
      </div>
      <button
        type="button"
        aria-label="Descartar la sugerencia para siempre"
        onClick={() => void props.onDescartarParaSiempre()}
        disabled={props.isLoading}
        className="shrink-0 rounded-card border border-text-soft px-2 text-[12px] text-text-soft disabled:opacity-40 h-11"
      >
        ✕ Descartar sugerencia
      </button>
    </div>
  );
}
