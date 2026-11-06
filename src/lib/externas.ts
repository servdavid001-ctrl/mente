/** helpers puros de conexiones externas (modulo 10 #5): validacion de shape,
 * normalizacion para dedup y fusion de items aceptados en ideas.entidades.
 * Sin dependencias de servidor: las usa la route y tambien la UI cliente. */

import type { ItemExterno, FuenteExterna } from './types';

const FUENTES: readonly string[] = ['google_books', 'openlibrary', 'ai'];
const MAX_ITEMS = 20;

/** normalizacion de dedup (contrato spec): lowercase, sin acentos y sin
 * espacios repetidos; misma ficha en las 2 fuentes NO se duplica */
export function normalizarTitulo(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** clave de especie de una ficha: titulo+autor normalizados (spec: dedup por
 * titulo normalizado; autor participa para no confundir obras homonimas) */
export function claveItem(i: { titulo: string; autor: string | null }): string {
  const autor = normalizarTitulo(i.autor ?? '');
  return `${normalizarTitulo(i.titulo)}|${autor}`;
}

/** valida una ficha cruda (jsonb del payload) hacia ItemExterno; null si miente */
export function validarItemExterno(bruto: unknown): ItemExterno | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const e = bruto as Record<string, unknown>;
  if (!FUENTES.includes(String(e.fuente))) return null;
  if (typeof e.titulo !== 'string' || e.titulo.trim() === '') return null;
  return {
    fuente: String(e.fuente) as FuenteExterna,
    titulo: e.titulo.trim().slice(0, 160),
    autor: typeof e.autor === 'string' && e.autor.trim() !== '' ? e.autor.trim().slice(0, 120) : null,
    anio: typeof e.anio === 'string' && /^\d{4}$/.test(e.anio) ? e.anio : null,
    coverUrl: typeof e.coverUrl === 'string' && /^https:\/\//.test(e.coverUrl) ? e.coverUrl : null,
    url: typeof e.url === 'string' && /^https:\/\//.test(e.url) ? e.url : null,
    frase: typeof e.frase === 'string' && e.frase.trim() !== '' ? e.frase.trim().slice(0, 200) : null
  };
}

/** valida y recorta una lista cruda del payload de una sugerencia */
export function validarItemsExterna(brutos: unknown[]): ItemExterno[] {
  const lista: ItemExterno[] = [];
  for (const b of brutos) {
    const item = validarItemExterno(b);
    if (item) lista.push(item);
    if (lista.length >= MAX_ITEMS) break;
  }
  return lista;
}

/** fusion dedup (aceptar externa): existentes primero, entrantes que NO ya
 * estan por clave titulo+autor; el orden conocido se preserva */
export function fusionarExternas(existentes: unknown, entrantes: ItemExterno[]): ItemExterno[] {
  const previas = Array.isArray(existentes) ? validarItemsExterna(existentes) : [];
  const vistas = new Set(previas.map((p) => claveItem(p)));
  const fusion = [...previas];
  for (const n of entrantes) {
    const clave = claveItem(n);
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    fusion.push(n);
  }
  return fusion;
}
