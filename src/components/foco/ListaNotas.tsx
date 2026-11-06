import Link from 'next/link';
import type { Idea } from '@/lib/types';

/** fila ligera de idea (FOUNDATION #8): chip de tipo + preview + enlace al
 * detalle (/biblioteca/[id], flow existente). etiqueta por kind parametrizable. */
export default function ListaNotas(props: {
  ideas: Idea[];
  etiqueta?: Record<Idea['kind'], string>;
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
          <Link
            href={`/biblioteca/${idea.id}`}
            className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5"
          >
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-text-soft">
              {etiquetas[idea.kind]}
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] text-text">
              {idea.text || idea.sourceUrl || 'Captura'}
            </span>
            <span aria-hidden="true" className="text-text-soft">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
