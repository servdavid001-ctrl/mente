'use client';

import { useState } from 'react';
import { MAX_CUERPO_PAGINA } from '@/lib/cuerpoPagina';

/** editor in-place del cuerpo de la pagina (modulo 14): textarea simple con
 * markdown ligero. Guardar es explicito; el error de guardado vive aqui y el
 * texto no se pierde. Limpiar y Guardar vacio no se permite (el server
 * rechaza contenido vacio porque borraria el titulo). */
export default function EditorBloques(props: {
  cuerpoInicial: string;
  guardando: boolean;
  errorGuardado: boolean;
  onGuardar: (cuerpo: string) => void;
  onCancelar: () => void;
}) {
  const [texto, setTexto] = useState(props.cuerpoInicial);

  function enviar(): void {
    const limpio = texto.trim();
    if (limpio.length === 0 || props.guardando) return;
    props.onGuardar(limpio);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
      className="space-y-2 rounded-card border border-border bg-raised p-3"
    >
      <textarea
        id="cuerpo-pagina"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={5}
        maxLength={MAX_CUERPO_PAGINA}
        placeholder="Escribe el cuerpo de la pagina..."
        aria-label="Cuerpo de la pagina"
        className="w-full rounded-card border border-border bg-surface px-3 py-2 text-[14px] text-text placeholder:text-text-soft"
      />
      <p className="text-[12px] text-text-soft">
        # titulo · **negrita** · *cursiva* · [ ] tarea · imagen: !imagen(https://...)
      </p>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={props.guardando}
          className="h-10 flex-1 rounded-card bg-accent text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {props.guardando ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={props.onCancelar}
          disabled={props.guardando}
          className="h-10 rounded-card px-4 text-[14px] font-semibold text-text-soft"
        >
          Cancelar
        </button>
      </div>
      {props.errorGuardado ? (
        <p role="alert" className="text-[12px] text-danger">
          No se pudo guardar el cuerpo. Reintenta.
        </p>
      ) : null}
    </form>
  );
}
