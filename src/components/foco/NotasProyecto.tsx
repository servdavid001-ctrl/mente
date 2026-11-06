'use client';

import { useState } from 'react';
import ComposerNota from './ComposerNota';
import ListaNotas from './ListaNotas';
import SelectorBandeja from './SelectorBandeja';
import type { Idea } from '@/lib/types';

/** libreta del proyecto (modulo 11, spec Notas): bloques ligeros, composer
 * inline y mover ideas desde la Bandeja (patro dual aprobado por David). */
export default function NotasProyecto(props: {
  ideas: Idea[];
  onNueva: (texto: string) => Promise<void>;
  onMover: (idea: Idea) => Promise<void>;
}) {
  const [componiendo, setComponiendo] = useState(false);
  const [entrada, setEntrada] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [moviendoId, setMoviendoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mover(idea: Idea) {
    if (moviendoId !== null) return;
    setMoviendoId(idea.id);
    setError(null);
    try {
      await props.onMover(idea);
      setEntrada(false);
    } catch {
      setError('No se pudo mover la idea. Reintenta.');
    } finally {
      setMoviendoId(null);
    }
  }

  return (
    <section aria-label="Libreta del proyecto" className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          aria-expanded={componiendo}
          onClick={() => setComponiendo((v) => !v)}
          className="h-10 flex-1 rounded-card bg-accent text-[14px] font-semibold text-white"
        >
          Nueva nota
        </button>
        <button
          type="button"
          onClick={() => setEntrada(true)}
          className="h-10 flex-1 rounded-card border border-border text-[14px] font-semibold text-text"
        >
          Traer de la Bandeja
        </button>
      </div>

      {componiendo ? (
        <ComposerNota
          ocupado={enviando}
          onGuardar={async (texto) => {
            setEnviando(true);
            setError(null);
            try {
              await props.onNueva(texto);
              setComponiendo(false);
            } catch {
              setError('No se pudo guardar la nota. Reintenta.');
            } finally {
              setEnviando(false);
            }
          }}
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : null}

      {props.ideas.length === 0 ? <LibretaVacia /> : <ListaNotas ideas={props.ideas} />}

      {entrada ? (
        <SelectorBandeja
          onCerrar={() => setEntrada(false)}
          ocupadoId={moviendoId}
          onMover={mover}
        />
      ) : null}
    </section>
  );
}

function LibretaVacia() {
  return (
    <p className="text-[13px] text-text-soft">
      La libreta esta vacia. Escribe la primera nota o trae una de la Bandeja.
    </p>
  );
}
