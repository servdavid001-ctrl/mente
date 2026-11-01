'use client';

type Icono = 'sparkle' | 'target' | 'layers';

export default function EmptyState(props: {
  title: string;
  description?: string;
  icon?: Icono;
  /** flecha hacia la accion requerida (solo el vacio de la Bandeja) */
  anclaAbajo?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 pt-16 text-center">
      <span
        className="inline-flex h-8 items-center rounded-blob px-3 text-[13px] font-semibold"
        style={{ backgroundColor: 'var(--accent-soft)' }}
        aria-hidden="true"
      >
        {props.icon === 'target' ? '◎' : props.icon === 'layers' ? '☰' : '✨'}
      </span>
      <h2 className="max-w-[18rem] font-display text-2xl font-semibold leading-snug">
        {props.title}
      </h2>
      {props.description ? (
        <p className="mt-1 max-w-[18rem] text-[15px] text-text-soft">{props.description}</p>
      ) : null}
      {props.anclaAbajo ? (
        <span aria-hidden="true" className="anim-pulse-soft mt-4 text-xl text-text-soft">
          ↓
        </span>
      ) : null}
    </div>
  );
}
