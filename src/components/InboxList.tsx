'use client';

import type { Idea } from '@/lib/types';
import IdeaCard from './IdeaCard';
import EmptyState from './EmptyState';

type Props = {
  ideas: Idea[];
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
  nuevaId?: string;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function InboxList(props: Props) {
  if (props.error) {
    return (
      <div>
        <p role="alert" className="rounded-card bg-accent-soft px-4 py-3 text-sm text-text">
          {props.error}
        </p>
        {props.onRetry ? (
          <button
            type="button"
            onClick={props.onRetry}
            className="mt-2 h-11 w-full rounded-card border border-border bg-surface text-sm font-semibold text-text"
          >
            Reintenta
          </button>
        ) : null}
      </div>
    );
  }

  if (props.isLoading && props.ideas.length === 0) {
    return <TresEsqueletos />;
  }

  if (props.ideas.length === 0) {
    return (
      <EmptyState
        icon="sparkle"
        title="Tu cerebro descanza tranquilo."
        description="Anota lo que primero se te pase por la cabeza — aqui lo atajamos antes de que se te escape."
        anclaAbajo
      />
    );
  }

  return (
    <ul className="space-y-3">
      {props.ideas.map((idea) => (
        <li key={idea.id} className="anim-fade-rise">
          <IdeaCard
            idea={idea}
            nueva={idea.id === props.nuevaId}
            onArchive={props.onArchive}
            onDelete={props.onDelete}
          />
        </li>
      ))}
    </ul>
  );
}

/** estructura, no spinner centrado (spec §3) */
function TresEsqueletos() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((n) => (
        <div
          key={n}
          className="anim-shimmer h-24 rounded-card bg-gradient-to-r from-border via-surface to-border"
        />
      ))}
    </div>
  );
}
