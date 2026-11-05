import ProyectoCard from './ProyectoCard';
import type { Proyecto } from '@/lib/types';

export default function ListaProyectos(props: {
  titulo: string;
  ariaLabel: string;
  proyectos: Proyecto[];
  ocupadoId: string | null;
  onToggle: (proyecto: Proyecto) => void;
}) {
  if (props.proyectos.length === 0) return null;

  return (
    <section aria-label={props.ariaLabel}>
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-text-soft">
        {props.titulo}
      </h2>
      <div className="mt-2 grid gap-2 md:grid-cols-2 md:gap-3">
        {props.proyectos.map((proyecto) => (
          <ProyectoCard
            key={proyecto.id}
            proyecto={proyecto}
            ocupado={props.ocupadoId === proyecto.id}
            onToggle={() => props.onToggle(proyecto)}
          />
        ))}
      </div>
    </section>
  );
}
