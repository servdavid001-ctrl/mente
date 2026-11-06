'use client';

import { useMemo, useState } from 'react';
import { conteoHijos, tituloIdea } from '@/lib/foco';
import type { Idea } from '@/lib/types';
import type { OpcionMover } from './MoverMenu';

/** navegacion de paginas del proyecto (modulo 13): la ruta abierta vive como
 * ids y se resuelve contra las ideas cargadas, asi la recarga refresca datos */
export function usePaginasProyecto(ideas: Idea[]) {
  const [idsRuta, setIdsRuta] = useState<string[]>([]);
  const porId = useMemo(() => new Map(ideas.map((i) => [i.id, i] as const)), [ideas]);
  const hijosPor = useMemo(() => conteoHijos(ideas), [ideas]);

  // ids anidados que ya no existen (pagina borrada) se descortan de la ruta
  const ruta = useMemo(
    () =>
      idsRuta
        .map((id) => porId.get(id) ?? null)
        .filter((idea): idea is Idea => idea !== null),
    [idsRuta, porId]
  );
  const actual = ruta.length > 0 ? ruta[ruta.length - 1] : null;

  // hijos directos (un nivel) ordenados por creacion; badge de nietos aparte
  const hijas = useMemo(() => {
    if (actual === null) return [];
    return ideas
      .filter((idea) => idea.parentId === actual.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [ideas, actual]);

  function abrir(idea: Idea): void {
    setIdsRuta((prev) => (prev.includes(idea.id) ? prev : [...prev, idea.id]));
  }
  function volver(): void {
    setIdsRuta((prev) => prev.slice(0, -1));
  }
  function irA(index: number): void {
    setIdsRuta((prev) => prev.slice(0, index + 1));
  }
  function salir(): void {
    setIdsRuta([]);
  }

  /* Opciones del menu Mover a (modulo 13): raiz o un ancestro de la cadena
   * abierta. Jamas descendientes, asi la profundidad max (3) queda garantizada
   * por construccion (todo ancestro vive a menor o igual nivel) */
  function opcionesMover(hija: Idea): OpcionMover[] {
    const opciones: OpcionMover[] = [{ nombre: 'Raiz del proyecto', parentId: null }];
    const posicion = ruta.findIndex((p) => p.id === hija.parentId);
    for (let i = 0; i < posicion; i += 1) {
      opciones.push({ nombre: tituloIdea(ruta[i]), parentId: ruta[i].id });
    }
    return opciones;
  }

  return { ruta, actual, hijas, hijosPor, abrir, volver, irA, salir, opcionesMover };
}

export type VistaPaginas = ReturnType<typeof usePaginasProyecto>;
