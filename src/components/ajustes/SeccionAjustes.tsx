import type { ReactNode } from 'react';

/** card comun de /ajustes: titulo, descripcion, chip opcional y contenido */
export default function SeccionAjustes(props: {
  id: string;
  titulo: string;
  descripcion?: string;
  chip?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={props.id}
      className="rounded-card border border-border bg-surface p-5 md:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={props.id} className="font-display text-[18px] font-semibold md:text-xl">
            {props.titulo}
          </h2>
          {props.descripcion ? (
            <p className="mt-1 text-[13px] leading-snug text-text-soft">{props.descripcion}</p>
          ) : null}
        </div>
        {props.chip ? <div className="shrink-0 pt-0.5">{props.chip}</div> : null}
      </div>
      <div className="mt-4">{props.children}</div>
    </section>
  );
}
