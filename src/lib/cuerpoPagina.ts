import type { Idea } from './types';

/* modulo 14 (editor Notion): el cuerpo de la pagina vive en ideas.contenido
 * (columna textual existente, SIN migracion) como markdown ligero. La primera
 * linea del texto SIEMPRE es el titulo; el resto es el cuerpo editable.
 * Regla 4 de la spec: editar el cuerpo jamas cambia el titulo. */

export const MAX_CUERPO_PAGINA = 2000;

/** cuerpo editable = el texto despues de la primera linea (el titulo) */
export function cuerpoDe(texto: string): string {
  return texto.split('\n').slice(1).join('\n').trim();
}

/** recompone el texto completo de la idea: titulo preservado + cuerpo editado */
export function componerTexto(textoOriginal: string, cuerpo: string): string {
  const titulo = textoOriginal.split('\n')[0].trim();
  const limpio = cuerpo.trim();
  if (titulo.length === 0) return limpio;
  if (limpio.length === 0) return titulo;
  return `${titulo}\n${limpio}`;
}
