'use client';

import type { Coleccion } from '@/lib/types';
import ColeccionChip, { Dot } from './ColeccionChip';

/**
 * scroll-x: 'Todas' + 'Sin coleccion' (dot hueco) + chips de coleccion,
 * multi-select con default computado (spec §2).
 */
export default function ColeccionChips(props: {
  colecciones: Coleccion[];
  activas: string[];
  onToggle: (id: string) => void;
  sinColeccionActiva: boolean;
  onToggleSinColeccion: () => void;
}) {
  const todasActivas = props.activas.length === 0 && !props.sinColeccionActiva;
  return (
    <div
      role="group"
      aria-label="Colecciones"
      className="space-y-0.5 overflow-x-auto whitespace-nowrap"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex w-full items-center gap-2 pb-1">
        {/* 'Todas' = default cuando ni chips ni sin-coleccion estan activas */}
        <button
          type="button"
          aria-pressed={todasActivas}
          aria-label="Coleccion Todas"
          onClick={() => {
            props.colecciones.forEach((c) => {
              if (props.activas.includes(c.id)) props.onToggle(c.id);
            });
            if (props.sinColeccionActiva) props.onToggleSinColeccion();
          }}
          className={todasActivas
            ? 'flex h-8 shrink-0 items-center rounded-blob border-[1.5px] border-accent bg-accent-soft px-3 text-[13px] font-semibold text-text'
            : 'flex h-8 shrink-0 items-center rounded-blob border border-border bg-surface px-3 text-[13px] font-medium text-text'}
        >
          Todas
        </button>
        <button
          type="button"
          aria-pressed={props.sinColeccionActiva}
          aria-label="Coleccion Sin coleccion"
          onClick={props.onToggleSinColeccion}
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-blob px-3 text-[13px] ${
            props.sinColeccionActiva
              ? 'border-[1.5px] border-accent bg-accent-soft font-semibold text-text'
              : 'border border-border bg-surface font-medium text-text'
          }`}
        >
          <Dot hueco tamano="h-3.5 w-3.5" />
          <span aria-hidden="true">Sin coleccion</span>
        </button>
        {props.colecciones.map((c) => (
          <span key={c.id} className="shrink-0">
            <ColeccionChip coleccion={c} active={props.activas.includes(c.id)} onToggle={props.onToggle} />
          </span>
        ))}
      </div>
      {props.colecciones.length === 0 ? (
        <p aria-hidden="true" className="text-[12px] text-text-soft">
          Las colecciones se crean al categorizar.
        </p>
      ) : null}
    </div>
  );
}
