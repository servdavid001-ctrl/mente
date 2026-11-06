'use client';

import { useState } from 'react';

/** opciones del menu Mover a (modulo 13): raiz (null) o un ancestro; el
 * caller solo ofrece destinos seguros (profundidad max 3 garantizada) */
export type OpcionMover = { nombre: string; parentId: string | null };

/** menu contextual Mover a: PUT parent_id con las opciones ya validadas por
 * el caller. <details> puro HTML; el undo/deocracion vive en el detalle */
export default function MoverMenu(props: {
  opciones: OpcionMover[];
  ocupado: boolean;
  onMover: (parentId: string | null) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mover(opcion: OpcionMover) {
    if (props.ocupado) return;
    setError(null);
    try {
      await props.onMover(opcion.parentId);
      setAbierto(false);
    } catch {
      setError('No se pudo mover. Reintenta.');
    }
  }

  if (props.opciones.length === 0) return null;
  return (
    <details
      open={abierto}
      onToggle={(e) => setAbierto(e.currentTarget.open)}
      className="relative shrink-0"
    >
      <summary
        aria-label="Mover a"
        className="h-8 cursor-pointer select-none rounded-blob px-2 text-[12px] font-semibold text-accent"
      >
        Mover a
      </summary>
      <ul className="absolute right-0 z-10 mt-1 min-w-[11rem] list-none space-y-0.5 rounded-card border border-border bg-surface p-1 shadow-md">
        {props.opciones.map((opcion) => (
          <li key={opcion.nombre}>
            <button
              type="button"
              disabled={props.ocupado}
              onClick={() => void mover(opcion)}
              className="h-8 w-full truncate rounded-blob px-2 text-left text-[13px] text-text hover:bg-raised disabled:opacity-50"
            >
              {opcion.nombre}
            </button>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="absolute right-0 z-10 mt-1 text-[11px] text-danger">
          {error}
        </p>
      ) : null}
    </details>
  );
}
