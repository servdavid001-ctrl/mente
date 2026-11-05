'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fechaHoyISO } from '@/lib/tareas';
import type { Tarea } from '@/lib/types';

export default function TareaItem(props: {
  tarea: Tarea;
  ocupado?: boolean;
  proyectoNombre?: string | null;
  proyectoHref?: string | null;
  onToggle: (tarea: Tarea) => void;
  onBorrar: (tarea: Tarea) => void;
}) {
  const { tarea } = props;
  const hecha = tarea.estado === 'hecha';
  const [confirmando, setConfirmando] = useState(false);
  const inputId = `tarea-${tarea.id}`;

  return (
    <li className="rounded-card border border-border bg-surface px-3 py-2.5">
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={hecha}
          disabled={props.ocupado}
          onChange={() => props.onToggle(tarea)}
          aria-label={`Marcar ${tarea.titulo} como ${hecha ? 'pendiente' : 'hecha'}`}
          className="mt-0.5 h-5 w-5 shrink-0 accent-accent disabled:opacity-50"
        />
        <label htmlFor={inputId} className="min-w-0 flex-1">
          <span
            className={`block text-[15px] leading-snug ${
              hecha ? 'text-text-soft line-through' : 'text-text'
            }`}
          >
            {tarea.titulo}
          </span>
          {tarea.fecha || (props.proyectoNombre && props.proyectoHref) ? (
            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-text-soft">
              {tarea.fecha ? <span>{etiquetaFecha(tarea.fecha)}</span> : null}
              {props.proyectoNombre && props.proyectoHref ? (
                <Link href={props.proyectoHref} className="font-semibold underline">
                  {props.proyectoNombre}
                </Link>
              ) : null}
            </span>
          ) : null}
        </label>

        {confirmando ? (
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => {
                setConfirmando(false);
                props.onBorrar(tarea);
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
        ) : (
          <button
            type="button"
            aria-label={`Borrar ${tarea.titulo}`}
            disabled={props.ocupado}
            onClick={() => setConfirmando(true)}
            className="h-9 shrink-0 rounded-blob px-2 text-[12px] font-semibold text-text-soft disabled:opacity-50"
          >
            Borrar
          </button>
        )}
      </div>
    </li>
  );
}

function etiquetaFecha(fecha: string): string {
  if (fecha === fechaHoyISO()) return 'Hoy';
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!partes) return fecha;
  const d = new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])));
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  }).format(d);
}
