'use client';

import type { Coleccion, DotColor } from '@/lib/types';
import { DOT_HEX } from '@/lib/biblioteca';

/** pill h-8 visual con tap 44: dot de color + nombre (spec §2) */
export function Dot(props: { color?: DotColor | null; hueco?: boolean; tamano?: string }) {
  const base = props.tamano ?? 'h-3.5 w-3.5';
  if (props.hueco) {
    return (
      <span
        aria-hidden="true"
        className={`${base} shrink-0 rounded-full border border-border`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${base} shrink-0 rounded-full`}
      style={{ backgroundColor: props.color ? DOT_HEX[props.color] : DOT_HEX.terracota }}
    />
  );
}

export default function ColeccionChip(props: {
  coleccion: Pick<Coleccion, 'id' | 'nombre' | 'color'>;
  active: boolean;
  onToggle: (id: string) => void;
  /** tip opcional del aria-label (default "Colección X") */
  ariaSufijo?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.active}
      aria-label={props.ariaSufijo ?? `Coleccion ${props.coleccion.nombre}`}
      onClick={() => props.onToggle(props.coleccion.id)}
      className={props.active
        ? 'flex h-8 items-center gap-1.5 rounded-blob border-[1.5px] border-accent bg-accent-soft px-3 text-[13px] font-semibold text-text'
        : 'flex h-8 items-center gap-1.5 rounded-blob border border-border bg-surface px-3 text-[13px] font-medium text-text'}
    >
      <Dot color={props.coleccion.color} />
      <span aria-hidden="true" className="whitespace-nowrap">
        {props.coleccion.nombre}
      </span>
    </button>
  );
}
