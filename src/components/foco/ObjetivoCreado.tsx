import type { Objetivo } from '@/lib/types';

export default function ObjetivoCreado(props: { objetivo: Objetivo }) {
  return (
    <div role="status" className="rounded-card border border-border bg-surface p-3">
      <p className="text-[13px] font-semibold text-success">Objetivo guardado.</p>
      <p className="mt-1 text-[15px] font-semibold">{props.objetivo.titulo}</p>
      {props.objetivo.descripcion ? (
        <ul className="mt-1 space-y-0.5 text-[13px] text-text-soft">
          {props.objetivo.descripcion.split('\n').map((paso, indice) => (
            <li key={`${indice}-${paso}`}>· {paso}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
