'use client';

import { useState } from 'react';
import ComposerNota from './ComposerNota';
import ListaNotas from './ListaNotas';
import type { Idea } from '@/lib/types';

/** libreta del proyecto (modulo 12): bloques ligeros, composer inline y
 * movimiento interno del propio proyecto. El proyecto nunca importa ideas
 * desde la Bandeja (la entrada es solo escribir aqui directamente). */
export default function NotasProyecto(props: {
  ideas: Idea[];
  onNueva: (texto: string) => Promise<void>;
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

      {props.ideas.length === 0 ? <LibretaVacia /> : <ListaNotas ideas={props.ideas} />}
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
