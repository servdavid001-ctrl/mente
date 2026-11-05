'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '../AppShell';
import BibliotecaGrid from './BibliotecaGrid';
import type { Coleccion, Idea, IdeaKind } from '@/lib/types';

const ERROR_CARGA = 'No pudimos cargar tu biblioteca. Reintentar';
type TipoFiltro = 'todo' | 'texto' | 'voz' | 'link' | 'arte';

/** orquestador de la tab Biblioteca: datos + filtros + toggle archivadas */
export default function Biblioteca(props: { email?: string }) {
  const [items, setItems] = useState<Idea[]>([]);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [chips, setChips] = useState<string[]>([]);
  const [sinColeccion, setSinColeccion] = useState(false);
  const [tipo, setTipo] = useState<TipoFiltro>('todo');
  const [query, setQuery] = useState('');
  const [verArchivadas, setVerArchivadas] = useState(false);

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const [rIdeas, rCol] = await Promise.all([
        fetch('/api/ideas?estado=biblioteca&todas=1'),
        fetch('/api/colecciones')
      ]);
      if (!rIdeas.ok) throw new Error('fallo lista');
      setItems(((await rIdeas.json()) as { ideas: Idea[] }).ideas);
      if (rCol.ok) {
        setColecciones(((await rCol.json()) as { colecciones: Coleccion[] }).colecciones);
      }
    } catch (e: unknown) {
      void e;
      setError(ERROR_CARGA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const activos = items.filter((i) => i.archivada !== true).length;
  const archivadasCount = items.filter((i) => i.archivada === true).length;

  return (
    <AppShell
      activeTab="biblioteca"
      titulo="Biblioteca"
      email={props.email}
      headerActions={
        !isLoading && !error ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-text-soft">
              {activos} {activos === 1 ? 'item' : 'items'}
            </span>
            <button
              type="button"
              aria-expanded={verArchivadas}
              onClick={() => setVerArchivadas((v) => !v)}
              className="h-11 rounded-blob px-2 text-[13px] text-text-soft hover:text-text"
            >
              {verArchivadas ? 'Ocultar archivadas' : `Ver archivadas (${archivadasCount})`}
            </button>
          </div>
        ) : null
      }
    >
      <div className="mx-auto w-full max-w-[75rem]">
        <BibliotecaGrid
          items={items}
          colecciones={colecciones}
          isLoading={isLoading}
          error={error}
          coleccionesActivas={chips}
          sinColeccionActiva={sinColeccion}
          tipo={tipo}
          verArchivadas={verArchivadas}
          query={query}
          onToggleColeccion={(id) =>
            setChips((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
          }
          onToggleSinColeccion={() => {
            if (chips.length > 0) setChips([]);
            setSinColeccion((v) => !v);
          }}
          onToggleVerArchivadas={() => setVerArchivadas((v) => !v)}
          onQuery={setQuery}
          onTipo={setTipo}
          onLimpiar={() => {
            setChips([]);
            setSinColeccion(false);
            setTipo('todo');
            setQuery('');
          }}
          onRetry={() => void cargar()}
        />
      </div>
    </AppShell>
  );
}

/** evita el warning de tipo no exportado IdeaKind mientras se define el contrato */
export type { IdeaKind };
