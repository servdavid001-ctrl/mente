'use client';

import TarjetaProyecto from './TarjetaProyecto';
import type { Proyecto } from '@/lib/types';

/** vista de tarjetas de proyectos (modulo 11, spec §2): carrusel horizontal
 * con snap en movil (tarjeta ~65% ancho, vecina asoma) y grid de 3 columnas
 * en escritorio (md+). Las tarjetas plegadas no aparecen aqui. */
export default function VistaTarjetas(props: {
  proyectos: Proyecto[];
  ocupadoId: string | null;
  onPlegar: (proyecto: Proyecto) => void;
}) {
  return (
    <section aria-label="Proyectos desplegados" className="min-w-0">
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
        {props.proyectos.map((proyecto) => (
          <div
            key={proyecto.id}
            className="w-[65%] shrink-0 snap-center md:w-auto md:shrink"
          >
            <TarjetaProyecto
              proyecto={proyecto}
              ocupado={props.ocupadoId === proyecto.id}
              onPlegar={() => props.onPlegar(proyecto)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
