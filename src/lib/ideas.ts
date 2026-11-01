import type { Idea, IdeaKind } from './types';

/** fila cruda -> contrato Idea de la spec */
export function mapIdeaRow(row: AnyRow): Idea {
  return {
    id: String(row.id),
    text: row.contenido ?? '',
    kind: row.tipo,
    sourceUrl: row.fuente ?? row.audio_url ?? undefined,
    createdAt: String(row.created_at),
    categorized: false,
  };
}

/** crea un Idea temporal para insercion optimista antes de la respuesta del server */
export function optimisticIdea(kind: Idea['kind'], text: string, sourceUrl?: string): Idea {
  return {
    id: `temp-${crypto.randomUUID()}`,
    text: kind === 'voz' ? '' : text,
    kind,
    sourceUrl,
    createdAt: new Date().toISOString(),
    categorized: false,
  };
}

/** payload POST desde un Idea ya guardado (para undo de eliminacion) */
export function ideaToPayload(idea: Idea) {
  return {
    kind: idea.kind,
    text: idea.kind === 'voz' ? '' : idea.text,
    // en 'voz' sourceUrl es la ruta del audio en el bucket; en 'link', la URL
    sourceUrl: idea.sourceUrl,
  };
}

type AnyRow = {
  id: unknown;
  tipo: Idea['kind'];
  contenido: string | null;
  fuente: string | null;
  audio_url?: string | null;
  created_at: unknown;
};
