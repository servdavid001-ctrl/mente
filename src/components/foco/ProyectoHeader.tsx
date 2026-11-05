import type { Proyecto } from '@/lib/types';

export default function ProyectoHeader(props: {
  proyecto: Proyecto;
  ideasCount: number;
  plegando: boolean;
  onToggle: () => void;
}) {
  const { proyecto } = props;
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 md:p-4">
      <span
        aria-hidden="true"
        className="h-3 w-3 shrink-0 rounded-full md:h-3.5 md:w-3.5"
        style={{ backgroundColor: proyecto.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[20px] font-semibold md:text-[24px] lg:text-[28px]">{proyecto.nombre}</p>
        <p className="text-[12px] text-text-soft md:text-[13px]">
          {props.ideasCount} {props.ideasCount === 1 ? 'idea' : 'ideas'} ·{' '}
          {proyecto.objetivosActivos}{' '}
          {proyecto.objetivosActivos === 1 ? 'objetivo activo' : 'objetivos activos'}
        </p>
      </div>
      <button
        type="button"
        disabled={props.plegando}
        onClick={props.onToggle}
        className="h-11 shrink-0 rounded-blob border border-border px-3 text-[12px] font-semibold text-text disabled:opacity-50"
      >
        {proyecto.plegado ? 'Desplegar' : 'Plegar'}
      </button>
    </div>
  );
}
