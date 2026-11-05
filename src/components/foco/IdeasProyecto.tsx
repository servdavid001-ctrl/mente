import Link from 'next/link';
import { ETIQUETAS_TIPO } from '@/lib/biblioteca';
import type { Idea } from '@/lib/types';

function preview(idea: Idea): string {
  if (idea.kind === 'link') return idea.sourceUrl ?? 'Link';
  if (idea.mediaUrl) return 'Con imagen';
  return idea.text || 'Nota de voz';
}

export default function IdeasProyecto(props: { ideas: Idea[] }) {
  return (
    <section aria-label="Ideas del proyecto" className="space-y-2">
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-text-soft">
        Ideas del proyecto
      </h2>

      {props.ideas.length === 0 ? (
        <p className="text-[13px] text-text-soft">
          Este proyecto aun no tiene ideas. Asigna una desde la Bandeja.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {props.ideas.map((idea) => {
            const clases =
              'flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5';
            const interior = (
              <>
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-text-soft">
                  {ETIQUETAS_TIPO[idea.kind]}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-text">
                  {preview(idea)}
                </span>
                {idea.estado === 'biblioteca' ? (
                  <span aria-hidden="true" className="text-text-soft">
                    →
                  </span>
                ) : null}
              </>
            );

            return (
              <li key={idea.id}>
                {idea.estado === 'biblioteca' ? (
                  <Link href={`/biblioteca/${idea.id}`} className={clases}>
                    {interior}
                  </Link>
                ) : (
                  <div className={clases}>{interior}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
