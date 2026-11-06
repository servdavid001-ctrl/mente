'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/** menu contextual de la tarjeta (modulo 11): tres puntos -> plegar / detalles.
 * el menu vive fuera del enlace de la tarjeta (sin botones anidados). */
export default function MenuTarjeta(props: {
  nombre: string;
  hrefDetalle: string;
  deshabilitado: boolean;
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
    <div ref={raizRef} className="absolute right-2 top-2 z-10">
      <button
        type="button"
        aria-label={`Mas acciones de ${props.nombre}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={(e) => {
          e.stopPropagation();
          setAbierto((v) => !v);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-sm transition-colors hover:bg-black/30"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ⋯
        </span>
      </button>

      {abierto ? (
        <div
          role="menu"
          aria-label={`Acciones de ${props.nombre}`}
          className="absolute right-0 top-10 w-44 overflow-hidden rounded-card border border-border bg-raised shadow-pop"
        >
          <button
            type="button"
            role="menuitem"
            disabled={props.deshabilitado}
            onClick={() => {
              setAbierto(false);
              props.onPlegar();
            }}
            className="h-10 w-full px-3 text-left text-[13px] font-semibold text-text disabled:opacity-50"
          >
            Plegar proyecto
          </button>
          <Link
            href={props.hrefDetalle}
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="block h-10 w-full px-3 text-left text-[13px] font-medium text-text-soft"
          >
            Ver detalles
          </Link>
        </div>
      ) : null}
    </div>
  );
}
