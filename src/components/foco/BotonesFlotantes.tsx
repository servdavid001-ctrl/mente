'use client';

/** botones flotantes apilados abajo-derecha (modulo 11, spec §4): "+" arriba
 * (crear proyecto) y "P" abajo (proyectos guardados) con contador de ocultos.
 * Fijos aunque haya scroll; accesibles y sin bloquear nada. */
export default function BotonesFlotantes(props: {
  ocultos: number;
  ocupado: boolean;
  onCrear: () => void;
  onPlegados: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-4 z-40 flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="Crear proyecto"
        onClick={props.onCrear}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-pop transition-transform active:scale-95"
      >
        <span aria-hidden="true" className="text-3xl leading-none">
          +
        </span>
      </button>

      <button
        type="button"
        aria-label={`Proyectos guardados${props.ocultos > 0 ? `: ${props.ocultos} ocultos` : ''}`}
        disabled={props.ocupado}
        onClick={props.onPlegados}
        className="flex h-12 w-12 flex-col items-center justify-center rounded-full border border-border bg-raised text-text shadow-pop transition-transform active:scale-95 disabled:opacity-50"
      >
        <span aria-hidden="true" className="text-[15px] font-bold leading-none">
          P
        </span>
        {props.ocultos > 0 ? (
          <span
            aria-hidden="true"
            className="text-[10px] font-semibold leading-tight text-text-soft"
          >
            +{props.ocultos}
          </span>
        ) : null}
      </button>
    </div>
  );
}
