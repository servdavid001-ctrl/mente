import type { Idea, IdeaKind } from './types';

/** fila cruda -> contrato Idea (modulo 2: estado + datos de Biblioteca) */
export function mapIdeaRow(row: AnyRow): Idea {
  return {
    id: String(row.id),
    text: row.contenido ?? '',
    kind: row.tipo,
    sourceUrl: row.fuente ?? row.audio_url ?? undefined,
    createdAt: String(row.created_at),
    categorized: String(row.estado) !== 'bandeja',
    estado: row.estado,
    archivada: Boolean(row.archivada),
    colecciones: row.coleccion_ids ?? [],
    mediaUrl: row.media_url ?? null,
    nota: row.nota ?? null
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
    estado: 'bandeja'
  };
}

/** payload POST desde un Idea ya guardado (para undo de eliminacion).
 * el undo restaura en Bandeja sin categorizacion: contrato del modulo 1.
 * Extension (modulo 2, documentada): el tipo 'arte' nace de una imagen subida
 * (POST media), no de la captura; el undo lo restaura como texto con una
 * marca para que la idea no se pierda. */
export function ideaToPayload(idea: Idea) {
  const esArte = idea.kind === 'arte';
  return {
    kind: (esArte ? 'texto' : idea.kind) as IdeaKind,
    text:
      idea.kind === 'voz'
        ? ''
        : idea.text || (esArte ? 'Arte sin imagen (restaurado)' : ''),
    // en 'voz' sourceUrl es la ruta del audio en el bucket; en 'link', la URL
    sourceUrl: idea.sourceUrl
  };
}

const SELECT = 'id,tipo,contenido,fuente,audio_url,estado,archivada,coleccion_ids,media_url,nota,created_at';

export const SELECT_IDEA = SELECT;

type AnyRow = {
  id: unknown;
  tipo: Idea['kind'];
  contenido: string | null;
  fuente?: string | null;
  audio_url?: string | null;
  estado?: Idea['estado'];
  archivada?: boolean;
  coleccion_ids?: string[];
  media_url?: string | null;
  nota?: string | null;
  created_at: unknown;
};
