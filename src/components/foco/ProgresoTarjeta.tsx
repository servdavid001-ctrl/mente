/** barra de progreso de tareas de la tarjeta (modulo 11): hechas / total.
 * total 0 = texto "Sin tareas", sin barra (spec: plantilla unica). */
export default function ProgresoTarjeta(props: {
  hechas: number;
  total: number;
}) {
  if (props.total === 0) {
    return (
      <p className="text-[12px] font-medium text-text-soft" aria-label="Sin tareas">
        Sin tareas
      </p>
    );
  }

  const pct = Math.min(100, Math.round((props.hechas / props.total) * 100));
  return (
    <div aria-label={`${props.hechas} de ${props.total} tareas hechas`}>
      <div className="flex items-baseline justify-between text-[11px] font-medium text-text-soft">
        <span>
          {props.hechas}/{props.total} tareas
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
