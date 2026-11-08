'use client';

import type { ReactNode } from 'react';
import type { PropuestaFundamento } from '@/lib/fundamento';

/** secciones del draft del fundamento (modulo 16 B): Problema / Debe hacer /
 * No debe / Criterio / Siguiente. Solo lectura: nada se guarda aqui. */
export default function VistaPropuesta(props: { propuesta: PropuestaFundamento }) {
  const p = props.propuesta;
  return (
    <div className="mt-3 space-y-2">
      <Seccion titulo="Problema">
        <p className="text-[14px] leading-snug text-text">{p.problema}</p>
      </Seccion>
      <Seccion titulo="Debe hacer">
        <Lista items={p.debe_hacer} />
      </Seccion>
      <Seccion titulo="No debe">
        <Lista items={p.no_debe} />
      </Seccion>
      <Seccion titulo="Criterio de exito">
        <Lista items={p.criterio_exito} />
      </Seccion>
      <Seccion titulo="Siguiente">
        <p className="text-[14px] leading-snug text-text">{p.siguiente_paso || '-'}</p>
      </Seccion>
    </div>
  );
}

function Seccion(props: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface px-3 py-2.5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-text-soft">
        {props.titulo}
      </p>
      <div className="mt-1">{props.children}</div>
    </div>
  );
}

function Lista(props: { items: string[] }) {
  if (props.items.length === 0) {
    return <p className="text-[13px] text-text-soft">-</p>;
  }
  return (
    <ul className="space-y-0.5">
      {props.items.map((item, i) => (
        <li key={i} className="text-[14px] leading-snug text-text">
          {item}
        </li>
      ))}
    </ul>
  );
}
