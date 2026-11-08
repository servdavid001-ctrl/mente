'use client';

import { useEffect, useRef, useState } from 'react';

/** menu de tres puntos del proyecto (modulo 11): Plegar proyecto (reversible
 * desde el modal P de /foco). Extraido de ProyectoHeaderV2 al llegar el
 * boton Fundamento (modulo 16) para que la cabecera encaje en el limite. */
export default function MenuProyecto(props: {
  nombreProyecto: string;
  plegando: boolean;
  onPlegar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function cerrar(e: MouseEvent) {
      if (!raizRef.current?.contains(e.target as Node)) setAbierto(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', onKey);
    };
  }, [abierto]);

  return (
    <div ref={raizRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Mas acciones de ${props.nombreProyecto}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:text-text"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          &#8943;
        </span>
      </button>
      {abierto ? (
        <div
          role="menu"
          aria-label={`Acciones de ${props.nombreProyecto}`}
          className="absolute right-0 top-11 z-10 w-44 overflow-hidden rounded-card border border-border bg-raised shadow-pop"
        >
          <button
            type="button"
            role="menuitem"
            disabled={props.plegando}
            onClick={() => {
              setAbierto(false);
              props.onPlegar();
            }}
            className="h-10 w-full px-3 text-left text-[13px] font-semibold text-text disabled:opacity-50"
          >
            {props.plegando ? 'Plegando...' : 'Plegar proyecto'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
