'use client';

import { ETIQUETAS_TIPO } from '@/lib/biblioteca';
import type { Sugerencia } from '@/lib/types';

/** lista de propuestas item+motivo (spec 14.3): Aceptar = POST real
 * /api/conexiones; duplicada deshabilitada con copy del modulo 2. */
export default function ConexionesPropuestas(props: {
  sugerencias: Sugerencia[];
  conectadasYa: string[];
  onAceptar: (haciaId: string, sugerenciaId: string) => Promise<void>;
  onDescartar: (id: string) => Promise<void>;
}) {
  return (
    <section className="space-y-2" aria-label="Conexiones propuestas por la AI">
      <p className="text-[13px] font-semibold text-text">
        <span aria-hidden="true" className="text-accent">✦ </span>
        Conexiones propuestas
      </p>
      <p aria-live="polite" className="sr-only">
        {props.sugerencias.length} sugerencias de conexiones
      </p>
      <ul className="space-y-2">
        {props.sugerencias.map((s) => {
          if (s.tipo !== 'conexion') return null;
          const p = s.payload as { haciaId?: string; tituloItem?: string; tipo?: string; motivo?: string };
          const duplicada = props.conectadasYa.includes(String(p.haciaId));
          return (
            <li
              key={s.id}
              className={`rounded-card border bg-surface px-3 py-2.5 ${
                duplicada ? 'border-border opacity-60' : 'border-border'
              }`}
            >
              <p className="truncate text-[15px] font-semibold text-text">
                <span aria-hidden="true" className="mr-1 text-[11px] font-medium text-text-soft">
                  {ETIQUETAS_TIPO[(p.tipo ?? '') as keyof typeof ETIQUETAS_TIPO] ?? 'Item'}
                </span>
                {p.tituloItem || 'Item'}
              </p>
              <p className="mt-0.5 text-[13px] text-text-soft">{p.motivo}</p>
              <div className="mt-2 flex items-center gap-2">
                {duplicada ? (
                  <span className="text-[12px] text-text-soft">Ya estan conectadas.</span>
                ) : null}
                <button
                  type="button"
                  aria-label={`Aceptar la conexion con ${p.tituloItem}`}
                  disabled={duplicada}
                  onClick={() => void props.onAceptar(String(p.haciaId), s.id)}
                  className="ml-auto h-8 rounded-full bg-accent px-4 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  aria-label="Descartar esta propuesta"
                  onClick={() => void props.onDescartar(s.id)}
                  className="min-h-11 px-2 text-[13px] text-text-soft"
                >
                  Descartar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
