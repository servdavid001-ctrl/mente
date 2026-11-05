'use client';

import type { ReactNode } from 'react';

export type OpcionSegmentada<T extends string> = {
  valor: T;
  etiqueta: string;
  descripcion?: string;
  muestra?: ReactNode;
};

/** radiogroup accesible con radios nativos (flechas + Tab funcionan) */
export default function Segmented<T extends string>(props: {
  legend: string;
  name: string;
  valor: T;
  opciones: OpcionSegmentada<T>[];
  onChange: (valor: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[13px] font-semibold text-text-soft">{props.legend}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {props.opciones.map((opcion) => {
          const activa = opcion.valor === props.valor;
          return (
            <label
              key={opcion.valor}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center text-[13px] font-semibold focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus)] ${
                activa
                  ? 'border-[var(--accent-strong)] bg-accent-soft text-text'
                  : 'border-[var(--border-control)] text-text-soft'
              }`}
            >
              <input
                type="radio"
                name={props.name}
                value={opcion.valor}
                checked={activa}
                onChange={() => props.onChange(opcion.valor)}
                className="sr-only"
              />
              {opcion.muestra ?? null}
              <span>{opcion.etiqueta}</span>
              {opcion.descripcion ? (
                <span className="text-[11px] font-normal text-text-soft">{opcion.descripcion}</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
