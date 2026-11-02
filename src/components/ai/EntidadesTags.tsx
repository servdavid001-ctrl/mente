'use client';

import IconoEntidad from './IconoEntidad';
import type { Entidad, TipoEntidad } from '@/lib/types';

const ETIQUETA_TIPO: Record<TipoEntidad, string> = {
  autor: 'Autor',
  libro: 'Libro',
  persona: 'Persona',
  lugar: 'Lugar',
  marca: 'Marca',
  concepto: 'Concepto'
};

/** tags informativos con icono por tipo (spec 14.2): span, no tappable; si no
 * hay, mensaje suave sin drama (nunca "=0"). */
export default function EntidadesTags(props: { entidades: Entidad[] }) {
  if (props.entidades.length === 0) {
    return (
      <p className="text-[13px] text-text-soft">No detectamos entidades.</p>
    );
  }
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {props.entidades.map((e, i) => (
        <span
          key={`${e.tipo}-${e.nombre}-${i}`}
          aria-label={`${ETIQUETA_TIPO[e.tipo] ?? 'Concepto'}: ${e.nombre}`}
          className="flex h-8 shrink-0 items-center gap-1 rounded-blob border border-border bg-surface px-2.5 text-[14px] text-text-soft"
        >
          <span aria-hidden="true" className="text-text-soft">
            <IconoEntidad tipo={e.tipo} />
          </span>
          {e.nombre}
        </span>
      ))}
    </div>
  );
}
