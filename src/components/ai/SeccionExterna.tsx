'use client';

import PortadaExterna from './PortadaExterna';
import type { ItemExterno } from '@/lib/types';

const ETIQUETA_FUENTE: Record<string, string> = {
  google_books: 'Google Books',
  openlibrary: 'Open Library',
  ai: 'Tu AI'
};

/** seccion "Conectado con el mundo" de la ficha (spec modulo 10): ficha
 * horizontal con portada + datos + la frase AI de 1 linea; el toque abre la
 * url externa en pestaña nueva. Seccion de la VIEW, no pagina nueva. */
export default function SeccionExterna(props: { items: ItemExterno[] }) {
  if (props.items.length === 0) return null;
  return (
    <section
      aria-label="Conectado con el mundo"
      className="rounded-card border border-border bg-surface p-3"
    >
      <p className="text-[13px] font-semibold text-text">
        <span aria-hidden="true" className="text-accent">→ </span>
        Conectado con el mundo
      </p>
      <ul className="mt-2 space-y-2">
        {props.items.map((item, i) => (
          <FichaExterna
            key={`${item.fuente}-${item.titulo}-${i}`}
            item={item}
          />
        ))}
      </ul>
    </section>
  );
}

function FichaExterna(props: { item: ItemExterno }) {
  const item = props.item;
  const contenido = (
    <div className="flex items-start gap-3">
      <PortadaExterna item={item} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-text">{item.titulo}</p>
        <p className="truncate text-[13px] text-text-soft">
          {[item.autor, item.anio].filter(Boolean).join(' - ') || 'Sin datos'}
          <span aria-hidden="true"> · </span>
          {ETIQUETA_FUENTE[item.fuente] ?? 'Externo'}
        </p>
        {item.frase ? (
          <p className="mt-1 text-[13px] leading-snug text-text-soft">{item.frase}</p>
        ) : null}
      </div>
    </div>
  );
  if (item.url) {
    return (
      <li>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir ${item.titulo} en una pestaña nueva`}
        >
          {contenido}
        </a>
      </li>
    );
  }
  return <li>{contenido}</li>;
}
