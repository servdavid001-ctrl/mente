'use client';

import { useState } from 'react';

/* Borrar con confirmacion de la fila de tarea (modulo 7): swap "Si, borrar"/"
 * No" sin dialogo externo. Extraido del TareaItem al llegar el Copiar recado
 * (modulo 16) para que la fila encaje en el limite de lineas del repo. */
export default function BotonBorrarTarea(props: {
  titulo: string;
  ocupado?: boolean;
  onBorrar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <span className="flex gap-1">
        <button
          type="button"
          onClick={() => {
            setConfirmando(false);
            props.onBorrar();
          }}
          className="h-9 rounded-blob px-2 text-[12px] font-semibold text-danger"
        >
          Si, borrar
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="h-9 rounded-blob px-2 text-[12px] text-text-soft"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Borrar ${props.titulo}`}
      disabled={props.ocupado}
      onClick={() => setConfirmando(true)}
      className="h-9 shrink-0 rounded-blob px-2 text-[12px] font-semibold text-text-soft disabled:opacity-50"
    >
      Borrar
    </button>
  );
}
