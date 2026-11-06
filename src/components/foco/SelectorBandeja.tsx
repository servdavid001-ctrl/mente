'use client';

import { useEffect, useState } from 'react';
import SheetDialog from '@/components/ui/SheetDialog';
import type { Idea } from '@/lib/types';

/** segunda pata de la libreta dual (modulo 11): mover una idea DESDE la
 * bandeja a la libreta del proyecto (PUT { proyectoId, estado:'proyecto' }). */
export default function SelectorBandeja(props: {
  onCerrar: () => void;
  ocupadoId: string | null;
  onMover: (idea: Idea) => Promise<void>;
}) {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch('/api/ideas', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: { ideas?: Idea[] }) => {
        if (vivo) setIdeas((json.ideas ?? []).filter((i) => i.estado === 'bandeja'));
      })
      .catch(() => {
        if (vivo) setError('No pudimos cargar la Bandeja. Reintenta.');
      });
    return () => {
      vivo = false;
    };
  }, []);

  const cargando = ideas === null;

  return (
    <SheetDialog label="Traer de la Bandeja" onCerrar={props.onCerrar}>
      <div className="space-y-2 pb-2 pt-4">
        <p className="text-center font-display text-lg font-semibold">
          Traer de la Bandeja
        </p>
        <p className="px-2 text-center text-[13px] text-text-soft">
          Pasa una idea de la bandeja a la libreta de este proyecto.
        </p>

        {error ? (
          <p role="alert" className="rounded-card bg-danger px-3 py-2 text-[13px] text-white">
            {error}
          </p>
        ) : null}

        {cargando ? (
          <p className="pt-4 text-center text-[13px] text-text-soft">Cargando ideas...</p>
        ) : ideas.length === 0 ? (
          <p className="pt-4 text-center text-[14px] text-text-soft">
            Tu bandeja esta vacia.
          </p>
        ) : (
          <ul className="space-y-2 pt-3">
            {ideas.map((idea) => (
              <li
                key={idea.id}
                className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-[14px] text-text">
                  {idea.text || idea.sourceUrl || 'Captura'}
                </span>
                <button
                  type="button"
                  aria-label={`Mover a la libreta: ${idea.text || idea.sourceUrl || 'captura'}`}
                  disabled={props.ocupadoId !== null}
                  onClick={() => void props.onMover(idea)}
                  className="h-10 shrink-0 rounded-blob bg-accent px-3 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {props.ocupadoId === idea.id ? 'Moviendo...' : 'A la libreta'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SheetDialog>
  );
}
