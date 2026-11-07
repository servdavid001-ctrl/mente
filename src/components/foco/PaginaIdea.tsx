'use client';

import { useState } from 'react';
import ComposerNota from './ComposerNota';
import BreadcrumbPaginas from './BreadcrumbPaginas';
import ListaSubpaginas from './ListaSubpaginas';
import CuerpoPagina from './CuerpoPagina';
import { tituloIdea } from '@/lib/foco';
import type { Idea, Proyecto } from '@/lib/types';
import type { OpcionMover } from './MoverMenu';

/** vista de pagina/subpagina (modulo 13 + 14): breadcrumb visible siempre,
 * cuerpo editable in-place (requisito #0: lo guardado se ve alli debajo),
 * bloque de hijas con badges y Mover a, y composer inline para la nueva
 * subpagina (fix P1 intacto). Estado vive en usePaginasProyecto */
export default function PaginaIdea(props: {
  proyecto: Proyecto;
  ruta: Idea[];
  actual: Idea;
  hijas: Idea[];
  hijosPor: Record<string, number>;
  opcionesDe: (hija: Idea) => OpcionMover[];
  onAbrir: (idea: Idea) => void;
  onVolverAProyecto: () => void;
  onIrANivel: (index: number) => void;
  crearSubpagina: (texto: string, estado: 'proyecto' | 'investigacion', parentId: string) => Promise<void>;
  moverIdea: (ideaId: string, parentId: string | null) => Promise<void>;
  guardarCuerpo: (ideaId: string, textoOriginal: string, cuerpo: string) => Promise<void>;
}) {
  const [componiendo, setComponiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(texto: string): Promise<void> {
    setEnviando(true);
    setError(null);
    try {
      // la subpagina hereda el estado del padre (proyecto o investigacion)
      const estado = props.actual.estado === 'investigacion' ? 'investigacion' : 'proyecto';
      await props.crearSubpagina(texto, estado, props.actual.id);
      setComponiendo(false);
    } catch {
      setError('No se pudo guardar la subpagina. Reintenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-label="Pagina del proyecto" className="space-y-3">
      <BreadcrumbPaginas
        proyecto={props.proyecto}
        ruta={props.ruta}
        onVolverAProyecto={props.onVolverAProyecto}
        onIrANivel={props.onIrANivel}
      />
      <h1 className="truncate text-[18px] font-semibold text-text">
        {tituloIdea(props.actual)}
      </h1>
      <CuerpoPagina
        key={props.actual.id}
        texto={props.actual.text}
        onGuardar={(cuerpo) => props.guardarCuerpo(props.actual.id, props.actual.text, cuerpo)}
      />
      <button
        type="button"
        aria-expanded={componiendo}
        onClick={() => setComponiendo((v) => !v)}
        className="h-10 w-full rounded-card bg-accent text-[14px] font-semibold text-white"
      >
        Nueva subpagina
      </button>
      {componiendo ? (
        <ComposerNota ocupado={enviando} onGuardar={guardar} />
      ) : null}
      {error ? (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : null}
      {props.hijas.length === 0 ? (
        <p className="text-[13px] text-text-soft">
          Sin subpaginas todavia. Crea la primera arriba.
        </p>
      ) : (
        <ListaSubpaginas
          hijas={props.hijas}
          onAbrir={props.onAbrir}
          onMoverUno={props.moverIdea}
          opcionesDe={props.opcionesDe}
          ocupado={enviando}
        />
      )}
    </section>
  );
}
