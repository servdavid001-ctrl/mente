'use client';

import { tituloIdea } from '@/lib/foco';
import type { Idea, Proyecto } from '@/lib/types';

/** breadcrumb siempre visible (modulo 13): Proyecto / Pagina / Subpagina.
 * El primer crumb regresa a los paneles; un crumb intermedio corta la ruta
 * hasta ese nivel (XSS-safe: los nombres son data, no JSX peligroso aqui). */
export default function BreadcrumbPaginas(props: {
  proyecto: Proyecto;
  ruta: Idea[];
  onVolverAProyecto: () => void;
  onIrANivel: (index: number) => void;
}) {
  return (
    <nav
      aria-label="Ruta de la pagina"
      className="flex flex-wrap items-center gap-1 text-[13px]"
    >
      <button
        type="button"
        onClick={props.onVolverAProyecto}
        className="h-8 max-w-[10rem] truncate rounded-blob px-2 font-semibold text-accent"
      >
        {props.proyecto.nombre}
      </button>
      {props.ruta.map((pagina, index) =>
        index === props.ruta.length - 1 ? (
          <span key={pagina.id} className="flex items-center gap-1">
            <span aria-hidden="true" className="text-text-soft">
              /
            </span>
            <span
              aria-current="page"
              className="h-8 max-w-[10rem] truncate rounded-blob px-2 font-semibold text-text"
            >
              {tituloIdea(pagina)}
            </span>
          </span>
        ) : (
          <span key={pagina.id} className="flex items-center gap-1">
            <span aria-hidden="true" className="text-text-soft">
              /
            </span>
            <button
              type="button"
              onClick={() => props.onIrANivel(index)}
              className="h-8 max-w-[10rem] truncate rounded-blob px-2 font-semibold text-accent"
            >
              {tituloIdea(pagina)}
            </button>
          </span>
        )
      )}
    </nav>
  );
}
