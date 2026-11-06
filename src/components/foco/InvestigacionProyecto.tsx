'use client';

import { useState } from 'react';
import ListaNotas from './ListaNotas';
import type { Idea } from '@/lib/types';

const ETIQUETA_INV: Record<Idea['kind'], string> = {
  texto: 'Investigacion',
  link: 'Investigacion',
  voz: 'Investigacion',
  arte: 'Investigacion'
};

/** apartado Investigacion (modulo 11 + 13): lista de investigaciones raiz del
 * proyecto; el tap abre la PAGINA con subpaginas (onAbrir). Nueva
 * investigacion crea la idea raiz; el detalle /biblioteca sigue intacto. */
export default function InvestigacionProyecto(props: {
  ideas: Idea[];
  onNueva: (titulo: string) => Promise<void>;
  onAbrir?: (idea: Idea) => void;
  hijosPorIdea?: Record<string, number>;
}) {
  const [titulo, setTitulo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limpio = titulo.trim();
    if (limpio.length === 0) {
      setError('Ponle un titulo a la investigacion.');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await props.onNueva(limpio);
      setTitulo('');
    } catch {
      setError('No se pudo crear la investigacion. Reintenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-label="Investigaciones del proyecto" className="space-y-2">
      <form
        onSubmit={(e) => void crear(e)}
        className="space-y-2 rounded-card border border-border bg-raised p-3"
      >
        <label htmlFor="invest-nueva" className="block text-[13px] font-semibold text-text">
          Nueva investigacion
        </label>
        <input
          id="invest-nueva"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Titulo de la investigacion"
          className="h-11 w-full rounded-card border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-soft"
        />
        {error ? (
          <p role="alert" className="text-[12px] text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={enviando}
          className="h-10 w-full rounded-card bg-accent text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {enviando ? 'Creando...' : 'Crear investigacion'}
        </button>
      </form>

      {props.ideas.length === 0 ? (
        <p className="text-[13px] text-text-soft">
          Sin investigaciones todavia. Crea la primera arriba.
        </p>
      ) : (
        <ListaNotas
          ideas={props.ideas}
          etiqueta={ETIQUETA_INV}
          onAbrir={props.onAbrir}
          hijosPorIdea={props.hijosPorIdea}
        />
      )}
    </section>
  );
}
