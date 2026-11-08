'use client';

import type { DatosCuadro, ItemCuadro } from './datosCuadros';

/* paso 4: cuadro clickeable del proyecto con encabezado + contador + preview
 * breve (3-4 items). El clic abre la vista ampliada a pantalla completa.
 * altura la define el caller (cuadro grande o mas bajo); el cuadro llena. */
export default function CuadroProyecto(props: {
  datos: DatosCuadro;
  onAbrir: (vista: DatosCuadro['vista']) => void;
}) {
  const vacio = props.datos.items.length === 0;
  return (
    <button
      type="button"
      aria-label={`Abrir ${props.datos.titulo}`}
      onClick={() => props.onAbrir(props.datos.vista)}
      className="flex h-full w-full flex-col rounded-card border border-border bg-surface p-4 text-left transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-[20px] font-semibold text-text">
          {props.datos.titulo}
        </h2>
        <span className="shrink-0 text-[13px] font-medium text-text-soft">
          {props.datos.conteo}
        </span>
      </span>
      <ul className="mt-2 space-y-1.5">
        {vacio ? (
          <li className="text-[13px] text-text-soft">
            Sin {props.datos.titulo.toLowerCase()} todavia.
          </li>
        ) : (
          props.datos.items.map((item) => <ItemPreview key={item.id} item={item} />)
        )}
      </ul>
      <span aria-hidden="true" className="mt-auto pt-2 text-[12px] font-semibold text-accent">
        Ver todo →
      </span>
    </button>
  );
}

function ItemPreview(props: { item: ItemCuadro }) {
  return (
    <li className="flex items-baseline justify-between gap-2">
      <span className="truncate text-[14px] text-text">{props.item.titulo}</span>
      {props.item.secundario ? (
        <span className="shrink-0 text-[12px] text-text-soft">{props.item.secundario}</span>
      ) : null}
    </li>
  );
}
