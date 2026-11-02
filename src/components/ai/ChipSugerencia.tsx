'use client';

import type { DotColor } from '@/lib/types';
import { Dot } from '@/components/biblioteca/ColeccionChip';

export type SugerenciaChip = {
  coleccionId: string;
  nombreColeccion: string;
  esNueva: boolean;
  dotColor?: DotColor;
};

/** chip sugerida (spec 12): borde 1.5px discontinuo accent + dot fantasma
 * cuando es coleccion nueva; tap 44px abre el sheet pre-enrutado (14). */
export default function ChipSugerencia(props: {
  sugerencia: SugerenciaChip;
  onOpenSheet: (ideaId: string) => void;
  ideaId: string;
}) {
  const s = props.sugerencia;
  return (
    <button
      type="button"
      aria-label={`Sugerencia de la AI: ${s.nombreColeccion}`}
      onClick={() => props.onOpenSheet(props.ideaId)}
      className="anim-fade-rise flex h-6 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-accent bg-surface px-2"
    >
      {s.esNueva ? (
        <span aria-hidden="true" className="dot-fantasma" />
      ) : (
        <Dot color={s.dotColor} tamano="h-2.5 w-2.5" />
      )}
      <span aria-hidden="true" className="max-w-28 truncate text-[11px] font-medium text-text">
        {s.nombreColeccion}
      </span>
      {s.esNueva ? <span aria-hidden="true" className="text-[10px] text-text-soft">Nueva</span> : null}
    </button>
  );
}

/** accion secundaria bajo el chip: rechaza la sugerencia (descarta normal) */
export function BotonNoMeSirve(props: { onDescartar: () => void }) {
  return (
    <button
      type="button"
      aria-label="No me sirve esta sugerencia"
      onClick={() => props.onDescartar()}
      className="min-h-11 text-[13px] text-text-soft"
    >
      No me sirve ({String.fromCharCode(10005)})
    </button>
  );
}
