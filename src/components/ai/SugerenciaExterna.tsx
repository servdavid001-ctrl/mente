'use client';

import { useState } from 'react';
import SheetDialog from '@/components/ui/SheetDialog';
import type { ItemExterno } from '@/lib/types';

/** sheet de la sugerencia externa (spec modulo 10): lista de fichas con
 * checkbox (todas marcadas), Aceptar seleccionadas / Descartar. Solo al
 * aceptar el server escribe en ideas.entidades.externa — aqui nada muta. */
export default function SugerenciaExterna(props: {
  items: ItemExterno[];
  ocupado: boolean;
  onAceptar: (seleccionadas: ItemExterno[]) => void;
  onDescartar: () => void;
  onCerrar: () => void;
}) {
  const [marcadas, setMarcadas] = useState<Set<number>>(
    () => new Set(props.items.map((_, i) => i))
  );
  const nMarcadas = marcadas.size;
  function alternar(i: number) {
    setMarcadas((prev) => {
      const nueva = new Set(prev);
      if (nueva.has(i)) nueva.delete(i);
      else nueva.add(i);
      return nueva;
    });
  }
  return (
    <SheetDialog label="Sugerencias externas de tu AI" onCerrar={props.onCerrar} ocupado={props.ocupado}>
      <p className="pt-4 text-[15px] font-semibold text-text">
        <span aria-hidden="true" className="text-accent">✦ </span>
        Conexiones externas propuestas
      </p>
      <p className="mt-1 text-[13px] text-text-soft">
        Conectamos las entidades de tu idea con catalogos publicos y tu AI.
      </p>
      <ul className="mt-3 space-y-2">
        {props.items.map((item, i) => (
          <li key={`${item.fuente}-${item.titulo}-${i}`} className="rounded-card border border-border bg-surface px-3 py-2">
            <label className="flex min-h-11 cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                aria-label={`Incluir ${item.titulo}`}
                checked={marcadas.has(i)}
                disabled={props.ocupado}
                onChange={() => alternar(i)}
                className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--color-accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-text">{item.titulo}</span>
                <span className="block truncate text-[13px] text-text-soft">
                  {[item.autor, item.anio].filter(Boolean).join(' - ') ||
                    (item.fuente === 'ai' ? 'Concepto propuesto por tu AI' : 'Sin datos')}
                </span>
                {item.frase ? (
                  <span className="mt-0.5 block text-[13px] leading-snug text-text-soft">{item.frase}</span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-2">
        <button
          type="button"
          aria-label="Aceptar las fichas seleccionadas"
          disabled={props.ocupado || nMarcadas === 0}
          onClick={() =>
            props.onAceptar(props.items.filter((_, i) => marcadas.has(i)))
          }
          className="h-11 w-full rounded-card bg-accent text-[14px] font-semibold text-white disabled:opacity-40"
        >
          Aceptar seleccionadas ({nMarcadas})
        </button>
        <button
          type="button"
          aria-label="Descartar estas sugerencias externas"
          disabled={props.ocupado}
          onClick={props.onDescartar}
          className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text disabled:opacity-40"
        >
          Descartar
        </button>
      </div>
    </SheetDialog>
  );
}
