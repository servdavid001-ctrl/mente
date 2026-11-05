'use client';

import type { ReactNode } from 'react';
import type { Coleccion, Idea } from '@/lib/types';
import ColeccionChips from './ColeccionChips';
import TypeFilterSegment from './TypeFilterSegment';
import LibCard from './LibCard';
import EsqueletosGrid from './EsqueletosGrid';

type TipoFiltro = 'todo' | 'texto' | 'voz' | 'link' | 'arte';

/** orquesta el grid: filtra chips+tipo+busqueda, loading/empty/error/archivadas */
export default function BibliotecaGrid(props: {
  items: Idea[];
  colecciones: Coleccion[];
  isLoading: boolean;
  error?: string;
  coleccionesActivas: string[];
  sinColeccionActiva: boolean;
  tipo: TipoFiltro;
  verArchivadas: boolean;
  query: string;
  onToggleColeccion: (id: string) => void;
  onToggleSinColeccion: () => void;
  onToggleVerArchivadas: () => void;
  onQuery: (q: string) => void;
  onTipo: (t: TipoFiltro) => void;
  onLimpiar: () => void;
  onRetry: () => void;
}) {
  const totalActivos = props.items.filter((i) => i.archivada !== true).length;
  const visibles = filtrar(props);

  return (
    <div className="space-y-3">
      <div className="space-y-2 md:flex md:items-center md:gap-2 md:space-y-0 lg:gap-3">
        <div className="md:w-[13rem] md:shrink-0 lg:w-[18rem]">{soloBusqueda(props)}</div>
        <div className="md:w-[15rem] md:shrink-0 lg:w-[20rem]">
          <TypeFilterSegment value={props.tipo} onChange={props.onTipo} />
        </div>
        <div className="md:ml-auto md:hidden">{botonArchivadas(props)}</div>
      </div>
      <ColeccionChips
        colecciones={props.colecciones}
        activas={props.coleccionesActivas}
        onToggle={props.onToggleColeccion}
        sinColeccionActiva={props.sinColeccionActiva}
        onToggleSinColeccion={props.onToggleSinColeccion}
      />

      {cuerpo(props, visibles, totalActivos)}
    </div>
  );
}

function soloBusqueda(props: { query: string; onQuery: (q: string) => void }): ReactNode {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <circle cx="11" cy="11" r="6.25" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        type="search"
        value={props.query}
        onChange={(e) => props.onQuery(e.target.value)}
        placeholder="Buscar en tu biblioteca..."
        aria-label="Buscar en tu biblioteca"
        className="h-11 w-full rounded-card border border-border bg-raised pl-9 pr-3 text-[15px] text-text placeholder:text-text-soft"
      />
    </div>
  );
}

/** toggle texto sutil esquina derecha, reveal con aria-expanded (spec §7) */
function botonArchivadas(props: {
  items: Idea[];
  verArchivadas: boolean;
  onToggleVerArchivadas: () => void;
}): ReactNode {
  const n = props.items.filter((i) => i.archivada === true).length;
  return (
    <div className="flex justify-end">
      <button
        type="button"
        aria-expanded={props.verArchivadas}
        onClick={props.onToggleVerArchivadas}
        className="min-h-11 py-2 text-[13px] text-text-soft"
      >
        {props.verArchivadas ? 'Ocultar archivadas' : `Ver archivadas (${n})`}
      </button>
    </div>
  );
}

function cuerpo(
  props: Parameters<typeof BibliotecaGrid>[0],
  visibles: Idea[],
  totalActivos: number
): ReactNode {
  if (props.isLoading) return <EsqueletosGrid />;
  if (visibles.length > 0) {
    return (
      <div aria-live="polite" className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 xl:grid-cols-4 xl:gap-4">
        {visibles.map((idea) => (
          <LibCard key={idea.id} idea={idea} colecciones={props.colecciones} archivoVisible={props.verArchivadas} />
        ))}
      </div>
    );
  }
  if (!props.verArchivadas && totalActivos === 0) {
    return <VacioBiblioteca />;
  }
  return <VacioFiltros onLimpiar={props.onLimpiar} />;
}

function VacioBiblioteca(): ReactNode {
  return (
    <div className="flex flex-col items-center gap-1 pt-10 text-center">
      <span
        aria-hidden="true"
        className="inline-flex h-8 items-center rounded-blob px-3 text-[13px] font-semibold"
        style={{ backgroundColor: 'var(--accent-soft)' }}
      >
        🎨
      </span>
      <h2 className="max-w-[18rem] font-display text-2xl font-semibold">
        Tu biblioteca esta prendiendo.
      </h2>
      <p className="mt-1 max-w-[18rem] text-[15px] text-text-soft">
        Categoriza una idea de tu Bandeja hacia Biblioteca y aqui queda guardada.
      </p>
    </div>
  );
}

function VacioFiltros(props: { onLimpiar: () => void }): ReactNode {
  return (
    <div className="flex flex-col items-center gap-2 pt-10 text-center">
      <p className="font-display text-xl font-semibold">Nada con esos filtros.</p>
      <button
        type="button"
        onClick={props.onLimpiar}
        className="h-11 rounded-card border border-border bg-surface px-4 text-[14px] font-semibold text-text"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

/** OR entre chips seleccionadas + 'Sin coleccion' + tipo + busqueda (AND capas) */
function filtrar(props: Parameters<typeof BibliotecaGrid>[0]): Idea[] {
  const base = props.items.filter((i) => (i.archivada === true) === props.verArchivadas);
  const q = props.query.trim().toLowerCase();

  return base.filter((idea) => {
    const pideColeccion = props.coleccionesActivas.length > 0 || props.sinColeccionActiva;
    if (pideColeccion) {
      const mis = idea.colecciones ?? [];
      const casaActiva = props.coleccionesActivas.some((id) => mis.includes(id));
      const casaSin = props.sinColeccionActiva && mis.length === 0;
      if (!casaActiva && !casaSin) return false;
    }
    if (props.tipo !== 'todo' && idea.kind !== props.tipo) return false;
    if (q.length > 0) {
      const palo = `${idea.text ?? ''} ${idea.nota ?? ''} ${idea.sourceUrl ?? ''}`.toLowerCase();
      if (!palo.includes(q)) return false;
    }
    return true;
  });
}
