/** Catalogos publicos de libros (modulo 10 #5): Google Books + OpenLibrary,
 * SOLO lectura, sin API key, timeout 5s, URLs fijas (nunca del user: cero
 * SSRF). Si una fuente falla el grupo queda vacio: cero datos inventados. */

import { normalizarTitulo } from '@/lib/externas';
import { itemsGoogle, itemsOpenLibrary } from './externaMapeo';
import type { ItemExterno } from '@/lib/types';

const TIMEOUT = AbortSignal.timeout(5000);
const UA = { 'User-Agent': 'MenteBot/1.0', Accept: 'application/json' };
const GOOGLE = 'https://www.googleapis.com/books/v1/volumes';
const OPENLIB = 'https://openlibrary.org/search.json';
const CAMPOS_OL =
  'key,title,author_name,first_publish_year,cover_i,cover_edition_key,isbn';

export type EntidadCatalogo = { nombre: string; tipo: string };

async function fetchJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { headers: UA, signal: TIMEOUT });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; /* la fuente caida deja su grupo vacio (spec) */
  }
}

/** 1 entidad = 1 GET por fuente (libro: intitle/q; autor: inauthor/author).
 * Devuelve max 8 items sin duplicar contra las claves ya conocidas. */
async function itemsDeEntidad(
  entidad: EntidadCatalogo,
  conocidas: Set<string>
): Promise<ItemExterno[]> {
  const esAutor = entidad.tipo === 'autor';
  const qGoogle = esAutor ? `inauthor:"${entidad.nombre}"` : `intitle:"${entidad.nombre}"`;
  const urlOl = esAutor
    ? `${OPENLIB}?author=${encodeURIComponent(entidad.nombre)}&limit=8&fields=${CAMPOS_OL}`
    : `${OPENLIB}?q=${encodeURIComponent(entidad.nombre)}&limit=8&fields=${CAMPOS_OL}`;
  const [google, ol] = await Promise.all([
    fetchJson(`${GOOGLE}?q=${encodeURIComponent(qGoogle)}`),
    fetchJson(urlOl)
  ]);
  const salida: ItemExterno[] = [];
  for (const item of [...itemsGoogle(google), ...itemsOpenLibrary(ol)]) {
    if (salida.length >= 8) break;
    const clave = normalizarTitulo(item.titulo);
    if (clave === '' || conocidas.has(clave)) continue;
    conocidas.add(clave);
    salida.push(item);
  }
  return salida;
}

/** busca en ambas fuentes cada entidad autor|libro en paralelo (max 6
 * entidades); el set compartido hace el dedup entre fuentes (spec). */
export async function buscarCatalogos(
  entidades: EntidadCatalogo[]
): Promise<ItemExterno[]> {
  if (entidades.length === 0) return [];
  const conocidas = new Set<string>();
  const grupos = await Promise.all(
    entidades.slice(0, 6).map((e) => itemsDeEntidad(e, conocidas))
  );
  return grupos.flat();
}
