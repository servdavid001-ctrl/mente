'use client';

import type { ReactNode } from 'react';

/* paso 4: vista ampliada a pantalla completa (overlay) de un cuadro del
 * proyecto. Boton volver arriba + contenido con scroll; pb-24 deja sitio a
 * la barra de navegacion inferior. Solo presentacion. */
export default function VistaAmpliada(props: {
  titulo: string;
  onVolver: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Vista de ${props.titulo}`}
      className="fixed inset-0 z-50 flex flex-col bg-bg"
    >
      <header className="flex items-center gap-1 border-b border-border bg-surface px-2 py-2">
        <button
          type="button"
          aria-label={`Volver del cuadro ${props.titulo}`}
          onClick={props.onVolver}
          className="flex h-11 w-11 items-center justify-center text-text"
        >
          <span aria-hidden="true">←</span>
        </button>
        <h2 className="truncate font-display text-[18px] font-semibold text-text">
          {props.titulo}
        </h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-3">
        <div className="mx-auto w-full max-w-[64rem]">{props.children}</div>
      </div>
    </div>
  );
}
