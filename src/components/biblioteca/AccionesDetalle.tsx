'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * acciones bajo el panel (spec §4): Archivar reversible sin confirmacion +
 * Eliminar para siempre con confirmacion inline 2-tap. El undo 6s lo controla
 * la pagina (DetalleItem); aqui solo se emiten los eventos.
 */
export default function AccionesDetalle(props: {
  archivada: boolean;
  onArchivar: () => void;
  onEliminar: () => void;
}): ReactNode {
  const [confirmar, setConfirmar] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  function pedirEliminar() {
    setConfirmar(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setConfirmar(false), 6000);
  }

  function eliminar() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setConfirmar(false);
    props.onEliminar();
  }

  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={props.onArchivar}
        className="h-11 flex-1 rounded-card bg-accent-soft text-[14px] font-semibold text-text"
      >
        {props.archivada ? 'Desarchivar' : 'Archivar'}
      </button>
      {confirmar ? (
        <button
          type="button"
          onClick={eliminar}
          className="h-11 flex-1 rounded-card bg-danger text-[14px] font-semibold text-white"
        >
          Eliminar
        </button>
      ) : (
        <button
          type="button"
          onClick={pedirEliminar}
          className="h-11 flex-1 rounded-card border border-danger text-[14px] font-semibold text-danger"
        >
          Eliminar para siempre
        </button>
      )}
    </div>
  );
}
