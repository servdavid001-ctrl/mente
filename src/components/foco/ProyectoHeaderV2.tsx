'use client';

import { useEffect, useRef, useState } from 'react';
import ProgresoTarjeta from './ProgresoTarjeta';
import type { Proyecto } from '@/lib/types';

/** cabecera del proyecto (modulo 11): nombre + barra de progreso de tareas +
 * menu de tres puntos con "Plegar proyecto" (reversible desde el modal P
 * de /foco). Reemplaza el toggler fijo de la v1. */
export default function ProyectoHeaderV2(props: {
  proyecto: Proyecto;
  plegando: boolean;
  onPlegar: () => void;
}) {
  const { proyecto } = props;
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
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: proyecto.color }}
          />
          <h1 className="truncate font-display text-[24px] font-semibold md:text-[28px]">
            {proyecto.nombre}
          </h1>
        </div>

        <div ref={raizRef} className="relative shrink-0">
          <button
            type="button"
            aria-label={`Mas acciones de ${proyecto.nombre}`}
            aria-haspopup="menu"
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:text-text"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ⋯
            </span>
          </button>
          {abierto ? (
            <div
              role="menu"
              aria-label={`Acciones de ${proyecto.nombre}`}
              className="absolute right-0 top-11 w-44 overflow-hidden rounded-card border border-border bg-raised shadow-pop"
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
      </div>

      <div className="mt-3">
        <ProgresoTarjeta
          hechas={proyecto.tareasHechas ?? 0}
          total={proyecto.tareasTotal ?? 0}
        />
      </div>
    </div>
  );
}
