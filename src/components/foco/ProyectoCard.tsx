import Link from 'next/link';
import type { Proyecto } from '@/lib/types';

function conteos(proyecto: Proyecto): string {
  const ideas = `${proyecto.ideasCount} ${proyecto.ideasCount === 1 ? 'idea' : 'ideas'}`;
  const activos = `${proyecto.objetivosActivos} ${
    proyecto.objetivosActivos === 1 ? 'objetivo activo' : 'objetivos activos'
  }`;
  return `${ideas} · ${activos}`;
}

export default function ProyectoCard(props: {
  proyecto: Proyecto;
  ocupado: boolean;
  onToggle: () => void;
}) {
  const { proyecto } = props;
  const accion = proyecto.plegado ? 'Desplegar' : 'Plegar';

  return (
    <div className="hover-card flex items-center gap-2 rounded-card border border-border bg-surface p-3 md:min-h-[72px] md:p-4">
      <span
        aria-hidden="true"
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: proyecto.color }}
      />
      <Link href={`/foco/${proyecto.id}`} className="min-w-0 flex-1 py-1">
        <span className="block truncate text-[15px] font-semibold text-text">
          {proyecto.nombre}
        </span>
        <span className="block truncate text-[12px] text-text-soft">{conteos(proyecto)}</span>
      </Link>
      <button
        type="button"
        aria-label={`${accion} ${proyecto.nombre}`}
        disabled={props.ocupado}
        onClick={props.onToggle}
        className="h-11 shrink-0 rounded-blob border border-border px-3 text-[12px] font-semibold text-text disabled:opacity-50"
      >
        {accion}
      </button>
    </div>
  );
}
