'use client';

import { useEffect } from 'react';

export type Undo = { tipo: 'archivar' | 'eliminar'; texto: string; idea: import('@/lib/types').Idea };

export default function UndoPrompt(props: {
  activo: Undo;
  onDeshacer: () => void;
  onCerrar: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(props.onCerrar, 6000);
    return () => window.clearTimeout(t);
  }, [props.activo, props.onCerrar]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-11 items-center gap-2 rounded-card bg-raised px-3 shadow-card"
    >
      <span aria-hidden="true" className="flex-1 truncate text-sm font-medium">
        {props.activo.texto}
      </span>
      <button
        type="button"
        aria-label="Deshacer"
        onClick={props.onDeshacer}
        className="flex h-9 items-center rounded-blob px-3 text-[13px] font-semibold text-accent"
      >
        Deshacer
      </button>
      <button
        type="button"
        aria-label="Cerrar el aviso"
        onClick={props.onCerrar}
        className="flex h-9 w-9 items-center justify-center text-text-soft"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
