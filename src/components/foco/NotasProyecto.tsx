'use client';

import { useState } from 'react';
import ComposerNota from './ComposerNota';
import ListaNotas from './ListaNotas';
import type { Idea } from '@/lib/types';

/** libreta del proyecto (modulo 12 + 13): bloques ligeros, composer inline y
 * movimiento interno del propio proyecto. El tap de una nota abre su PAGINA
 * con subpaginas (onAbrir); el proyecto nunca importa ideas de la Bandeja. */
export default function NotasProyecto(props: {
  ideas: Idea[];
  onNueva: (texto: string) => Promise<void>;
  onAbrir?: (idea: Idea) => void;
  hijosPorIdea?: Record<string, number>;
}) {
  const [componiendo, setComponiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section aria-label="Libreta del proyecto" className="space-y-2">
      <button
        type="button"
        aria-expanded={componiendo}
        onClick={() => setComponiendo((v) => !v)}
        className="h-10 w-full rounded-card bg-accent text-[14px] font-semibold text-white"
      >
        Nueva nota
      </button>

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

      {props.ideas.length === 0 ? (
        <LibretaVacia />
      ) : (
        <ListaNotas
          ideas={props.ideas}
          onAbrir={props.onAbrir}
          hijosPorIdea={props.hijosPorIdea}
        />
      )}
    </section>
  );
}

function LibretaVacia() {
  return (
    <p className="text-[13px] text-text-soft">
      La libreta esta vacia. Escribe la primera nota aqui directamente.
    </p>
  );
}
