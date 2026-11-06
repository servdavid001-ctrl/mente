'use client';

import { conteoHijos, tituloIdea } from '@/lib/foco';
import type { Idea } from '@/lib/types';
import type { OpcionMover } from './MoverMenu';
import MoverMenu from './MoverMenu';

/** bloque lista de hijos de la pagina abierta (modulo 13):
 * - subpaginas (con hijos): fila con badge + menu Mover a
 * - notas simples: fila ligera; ambas abren su pagina con click */
export default function ListaSubpaginas(props: {
  hijas: Idea[];
  onAbrir: (idea: Idea) => void;
  onMoverUno: (ideaId: string, parentId: string | null) => Promise<void>;
  opcionesDe: (hija: Idea) => OpcionMover[];
  ocupado: boolean;
}) {
  const nietosPor = conteoHijos(props.hijas);
  const conHijos = props.hijas.filter((h) => (nietosPor[h.id] ?? 0) > 0);
  const notas = props.hijas.filter((h) => nietosPor[h.id] === 0);
  return (
    <ul className="space-y-1.5">
      {[...conHijos, ...notas].map((hija) => (
        <li
          key={hija.id}
          className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5"
        >
          <button
            type="button"
            onClick={() => props.onAbrir(hija)}
            className="min-w-0 flex-1 truncate text-left text-[14px] text-text"
          >
            {tituloIdea(hija)}
          </button>
          {(nietosPor[hija.id] ?? 0) > 0 ? (
            <span
              aria-label={`${nietosPor[hija.id]} subpaginas dentro`}
              className="shrink-0 rounded-blob bg-raised px-2 py-0.5 text-[11px] font-semibold text-accent"
            >
              {nietosPor[hija.id]}
            </span>
          ) : null}
          <Movimiento
            hija={hija}
            onMoverUno={props.onMoverUno}
            opcionesDe={props.opcionesDe}
            ocupado={props.ocupado}
          />
        </li>
      ))}
    </ul>
  );
}

function Movimiento(props: {
  hija: Idea;
  onMoverUno: (ideaId: string, parentId: string | null) => Promise<void>;
  opcionesDe: (hija: Idea) => OpcionMover[];
  ocupado: boolean;
}) {
  const opciones = props.opcionesDe(props.hija);
  if (opciones.length === 0) return null;
  return (
    <MoverMenu
      opciones={opciones}
      ocupado={props.ocupado}
      onMover={(parentId) => props.onMoverUno(props.hija.id, parentId)}
    />
  );
}
