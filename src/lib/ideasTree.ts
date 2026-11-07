import type { Idea } from './types';

/* fix P1 (2026-11-07, modulo 13): helpers puros del arbol de ideas del detalle.
 * El POST del server devuelve la idea ya confirmada (201): se inserta al arbol
 * al instante (duplicado imposible por id) y el subarbol de la pagina se
 * reemplaza con el resultado fresco de GET /api/ideas?parent (listarHijos).
 * Puros para poder testear sin React */

/** inserta/reemplaza por id: la idea del server nunca duplica una existente */
export function upsertIdeas(prev: Idea[], nuevas: Idea[]): Idea[] {
  if (nuevas.length === 0) return prev;
  const ids = new Set(nuevas.map((idea) => idea.id));
  return [...prev.filter((idea) => !ids.has(idea.id)), ...nuevas];
}

/** reemplaza el conjunto de hijos directos de parentId por la lista fresca
 * del server (GET ?parent): purga fantasmas (archivadas/borradas en otro
 * dispositivo) y conserva el resto del arbol intacto */
export function sincronizarHijos(prev: Idea[], parentId: string, hijos: Idea[]): Idea[] {
  const ids = new Set(hijos.map((hijo) => hijo.id));
  const resto = prev.filter((idea) => idea.parentId !== parentId || ids.has(idea.id));
  return upsertIdeas(resto, hijos);
}
