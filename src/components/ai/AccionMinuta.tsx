'use client';

/** confirmacion contenido->tareas (spec 16): la lista real de tareas llega
 * en el modulo 7, aqui la minuta guardada produce la card de confirmacion
 * prometiendo exactamente lo guardado (Nielsen #2). */
export default function AccionMinuta(props: { tituloItem: string; pasos: string[] }) {
  return (
    <div className="rounded-card border border-[color:var(--success)] bg-surface px-3 py-2.5">
      <p className="text-[14px] font-semibold text-text">
        {String.fromCharCode(10003)} Guardada como minuta para cuando llegue tu lista de tareas
      </p>
      <ol className="mt-1 space-y-1 text-[13px] text-text-soft">
        {props.pasos.map((paso, i) => (
          <li key={i}>
            <span aria-hidden="true">{i + 1}. </span>
            {paso}
          </li>
        ))}
      </ol>
      <p className="sr-only">
        Minuta guardada para el item {props.tituloItem}. Se convierte en tareas cuando activemos la lista de tareas.
      </p>
    </div>
  );
}
