import Link from 'next/link';
import type { Idea } from '@/lib/types';

/** fila ligera de idea (FOUNDATION #8): chip de tipo + preview + badge de
 * subpaginas (modulo 13). Con onAbrir el tap abre la PAGINA en foco; sin
 * onAbrir mantiene el enlace al detalle (/biblioteca/[id]) */
export default function ListaNotas(props: {
  ideas: Idea[];
  etiqueta?: Record<Idea['kind'], string>;
  onAbrir?: (idea: Idea) => void;
  hijosPorIdea?: Record<string, number>;
}) {
  const etiquetas = props.etiqueta ?? {
    texto: 'Nota',
    link: 'Link',
    voz: 'Nota de voz',
    arte: 'Imagen'
  };
  return (
    <ul className="space-y-1.5">
      {props.ideas.map((idea) => (
        <li key={idea.id}>
          <Fila
            idea={idea}
            etiqueta={etiquetas[idea.kind]}
            onAbrir={props.onAbrir}
            hijos={props.hijosPorIdea?.[idea.id] ?? 0}
          />
        </li>
      ))}
    </ul>
  );
}

function Fila(props: {
  idea: Idea;
  etiqueta: string;
  onAbrir?: (idea: Idea) => void;
  hijos: number;
}) {
  const contenido = (
    <>
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-text-soft">
        {props.etiqueta}
      </span>
      <span className="min-w-0 flex-1 truncate text-[14px] text-text">
        {props.idea.text || props.idea.sourceUrl || 'Captura'}
      </span>
      {props.hijos > 0 ? (
        <span
          aria-label={`${props.hijos} subpaginas dentro`}
          className="shrink-0 rounded-blob bg-raised px-2 py-0.5 text-[11px] font-semibold text-accent"
        >
          {props.hijos}
        </span>
      ) : null}
      <span aria-hidden="true" className="text-text-soft">
        →
      </span>
    </>
  );
  if (props.onAbrir) {
    return (
      <button
        type="button"
        onClick={() => props.onAbrir?.(props.idea)}
        className="flex w-full items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5 text-left"
      >
        {contenido}
      </button>
    );
  }
  return (
    <Link
      href={`/biblioteca/${props.idea.id}`}
      className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5"
    >
      {contenido}
    </Link>
  );
}
