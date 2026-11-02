'use client';

import type { Conexion, Idea } from '@/lib/types';
import { relativeTime } from '@/lib/time';
import { ETIQUETAS_TIPO } from '@/lib/biblioteca';

/** lista dirigida idea→idea con flecha, nota 'por que' y quitar 44px (spec §4) */
export default function ConexionesPanel(props: {
  conexiones: Conexion[];
  items: Record<string, { titulo: string; tipo: string }>;
  itemIdActual: string;
  onRemove: (id: string) => void;
}) {
  return (
    <section aria-label="Conexiones">
      <h3 className="font-display text-lg font-semibold">Conexiones</h3>
      {props.conexiones.length === 0 ? (
        <p className="mt-2 text-[13px] text-text-soft">Nada conectado aun.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {props.conexiones.map((c) => {
            const otro = c.desdeId === props.itemIdActual ? c.haciaId : c.desdeId;
            const info = props.items[otro];
            return (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-card bg-surface p-3 shadow-card"
              >
                <span aria-hidden="true" className="text-text-soft">
                  →
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-text">
                    {info?.titulo ?? 'Idea'}
                  </p>
                  <p aria-hidden="true" className="truncate text-[11px] text-text-soft">
                    {info ? ETIQUETAS_TIPO[info.tipo as Idea['kind']] ?? info.tipo : ''}
                    {c.nota ? ` · ${c.nota}` : ''} · {relativeTime(c.creadoEl)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Quitar esta conexion"
                  onClick={() => props.onRemove(c.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-text-soft"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
