/** mapeo de respuestas de los catalogos publicos (modulo 10) hacia la ficha
 * ItemExterno: Google Books volumeInfo + OpenLibrary doc; puras y testeables. */

import type { ItemExterno } from '@/lib/types';

export function texto(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export function itemsGoogle(bruta: unknown): ItemExterno[] {
  const items = (bruta as { items?: unknown[] } | null)?.items ?? [];
  return (items as Record<string, unknown>[])
    .slice(0, 8)
    .map((v) => {
      const info = (v.volumeInfo ?? {}) as Record<string, unknown>;
      const auto = Array.isArray(info.authors) ? (info.authors as unknown[])[0] : null;
      const link = (info.imageLinks ?? {}) as Record<string, unknown>;
      const mini = texto(link.thumbnail);
      const fecha = texto(info.publishedDate);
      return {
        fuente: 'google_books' as const,
        titulo: texto(info.title) ?? '',
        autor: texto(auto),
        anio: fecha && /^\d{4}/.test(fecha) ? fecha.slice(0, 4) : null,
        coverUrl: mini ? mini.replace(/^http:/, 'https:').split('&zoom=')[0] : null,
        url: texto(info.previewLink) ?? texto(info.infoLink),
        frase: null
      };
    })
    .filter((i) => i.titulo !== '');
}

export function itemsOpenLibrary(bruta: unknown): ItemExterno[] {
  const docs = (bruta as { docs?: unknown[] } | null)?.docs ?? [];
  return (docs as Record<string, unknown>[])
    .slice(0, 8)
    .map((d) => {
      const auto = Array.isArray(d.author_name) ? (d.author_name as unknown[])[0] : null;
      const isbn = Array.isArray(d.isbn) ? texto((d.isbn as unknown[])[0]) : null;
      const clave = texto(d.cover_edition_key) ?? isbn;
      const portada = texto(d.cover_i)
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
        : clave
          ? `https://covers.openlibrary.org/b/${clave}-M.jpg`
          : null;
      return {
        fuente: 'openlibrary' as const,
        titulo: texto(d.title) ?? '',
        autor: texto(auto),
        anio: texto(d.first_publish_year),
        coverUrl: portada,
        url: texto(d.key) ? `https://openlibrary.org${d.key}` : null,
        frase: null
      };
    })
    .filter((i) => i.titulo !== '');
}
