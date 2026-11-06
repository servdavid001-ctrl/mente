'use client';

import type { ItemExterno } from '@/lib/types';

/** iniciales del titulo si la portada no llega (spec: placeholder CSS) */
function iniciales(titulo: string): string {
  return (titulo.trim()[0] ?? '?').toUpperCase() + (titulo.trim()[1] ?? '').toUpperCase();
}

/** portada 48x72 con <img> plain (spec: Next/image exige allow-list de
 * dominios que los catalogos no cumplen; la regla de lint queda en warning) */
export default function PortadaExterna(props: { item: ItemExterno }) {
  if (props.item.coverUrl) {
    return (
      <img
        loading="lazy"
        width={48}
        height={72}
        src={props.item.coverUrl}
        alt={`Portada de ${props.item.titulo}`}
        className="h-[4.5rem] w-12 shrink-0 rounded-blob border border-border object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-[4.5rem] w-12 shrink-0 items-center justify-center rounded-blob border border-border bg-accent-soft text-[16px] font-semibold text-text"
    >
      {iniciales(props.item.titulo)}
    </span>
  );
}
